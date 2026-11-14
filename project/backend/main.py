import uvicorn
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from config import get_environment_variables
from app.controllers import (
    admin_controller,
    auth_controller,
    bookings_controller,
    config_controller,
    healthy_check_controller,
)
from app.services.errors import HttpError, ValidationError

env = get_environment_variables()

app = FastAPI(
    title="fadeUp API",
    description="Agendamento da barbearia fadeUp (uma unidade, um profissional).",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=env.front_origins_list,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-App-Token", "X-Booking-Token"],
)

_SECURITY_HEADERS = {"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"}


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    for key, value in _SECURITY_HEADERS.items():
        response.headers.setdefault(key, value)
    return response


@app.exception_handler(ValidationError)
async def validation_error_handler(request: Request, exc: ValidationError):
    body: dict = {"error": exc.message}
    if exc.fields:
        body["fields"] = exc.fields
    return JSONResponse(status_code=400, content=body, headers=_SECURITY_HEADERS)


@app.exception_handler(HttpError)
async def http_error_handler(request: Request, exc: HttpError):
    return JSONResponse(status_code=exc.status, content={"error": exc.message}, headers=_SECURITY_HEADERS)


@app.exception_handler(RequestValidationError)
async def request_validation_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=400,
        content={"error": "Os dados enviados são inválidos. Confira e tente novamente."},
        headers=_SECURITY_HEADERS,
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    detail = exc.detail
    message = detail if isinstance(detail, str) else "Não foi possível concluir."
    return JSONResponse(status_code=exc.status_code, content={"error": message}, headers=_SECURITY_HEADERS)


app.include_router(config_controller.router)
app.include_router(bookings_controller.router)
app.include_router(admin_controller.router)
app.include_router(auth_controller.router)
app.include_router(healthy_check_controller.router)


if __name__ == "__main__":
    uvicorn.run("main:app", host=env.HOST, port=env.PORT, reload=False)
