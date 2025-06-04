from contextlib import contextmanager, asynccontextmanager
from psycopg_pool import ConnectionPool
from dataclasses import make_dataclass
from fastapi import FastAPI
import logging

_log = logging.getLogger("dblock")


def dict_row_factory(cursor):
    if cursor.description is None:
        return None

    field_names = [c.name for c in cursor.description]
    _dataclass = make_dataclass("Row", field_names)

    def make_row(values):
        return _dataclass(*values)

    return make_row


def create_dpool(dsn: str, min_size=4):
    pool = ConnectionPool(dsn, min_size=min_size)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        pool.open()
        _log.info("connection pool is open")

        yield

        pool.close()
        _log.info("connection pool is closed")

    @contextmanager
    def dblock():
        with pool.connection() as conn:
            try:
                with conn.cursor(row_factory=dict_row_factory) as cur:
                    yield cur
                conn.commit()
            except:
                conn.rollback()
                raise

    return dblock, lifespan
