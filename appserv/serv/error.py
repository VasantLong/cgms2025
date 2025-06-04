from fastapi import HTTPException
from fastapi import Request
from fastapi.responses import JSONResponse
from .config import app


class EntityNotFound(HTTPException):
    def __init__(self, detail):
        self.status_code = 404
        self.detail = detail


class ConflictError(HTTPException):
    def __init__(self, detail):
        self.status_code = 409
        self.detail = detail


class InvalidError(HTTPException):
    def __init__(self, detail):
        self.status_code = 422
        self.detail = detail


@app.exception_handler(EntityNotFound)
@app.exception_handler(ConflictError)
@app.exception_handler(InvalidError)
async def error_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"message": exc.detail},
    )
