import jwt
from fastapi import Depends, Header, HTTPException
from fastapi.security import APIKeyHeader, HTTPAuthorizationCredentials, HTTPBearer

from app.services import jwt_service

_bearer_scheme = HTTPBearer(auto_error=False, description="JWT (app nas rotas públicas; usuário nas rotas admin)")
_app_header_scheme = APIKeyHeader(name="X-App-Token", auto_error=False, description="JWT de aplicação (rotas admin)")


def _unauthorized(detail: str = "Não autorizado.") -> HTTPException:
    return HTTPException(status_code=401, detail=detail)


def require_app(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> dict:
    if not credentials or not credentials.credentials:
        raise _unauthorized("Token de aplicação ausente.")
    try:
        return jwt_service.decode(credentials.credentials, jwt_service.TYPE_APP)
    except jwt.PyJWTError:
        raise _unauthorized("Token de aplicação inválido ou expirado.")


def require_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    x_app_token: str | None = Depends(_app_header_scheme),
) -> dict:
    if not x_app_token:
        raise _unauthorized("Token de aplicação ausente.")
    try:
        jwt_service.decode(x_app_token, jwt_service.TYPE_APP)
    except jwt.PyJWTError:
        raise _unauthorized("Token de aplicação inválido ou expirado.")

    if not credentials or not credentials.credentials:
        raise _unauthorized("Autenticação de usuário ausente.")
    try:
        return jwt_service.decode(credentials.credentials, jwt_service.TYPE_USER_ACCESS)
    except jwt.PyJWTError:
        raise _unauthorized("Sessão expirada. Entre novamente.")


def booking_token(x_booking_token: str | None = Header(default=None, alias="X-Booking-Token")) -> str | None:
    return x_booking_token
