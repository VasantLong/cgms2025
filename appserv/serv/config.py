import logging
from fastapi import FastAPI
from .dblock import create_dpool

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s"
)

dblock, lifespan = create_dpool("host=localhost dbname=examdb user=examdb", min_size=4)

app = FastAPI(lifespan=lifespan)
