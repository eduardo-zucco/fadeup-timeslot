import uuid
from datetime import datetime, timedelta, timezone

import jwt

from config import get_environment_variables

_env = get_environment_variables()
_ALG = "HS256"

TYPE_APP = "app"
TYPE_USER_ACCESS = "user_access"
TYPE_USER_REFRESH = "user_refresh"
TYPE_APP_REFRESH = "app_refresh"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _encode(payload: dict, token_type: str, expires: timedelta) -> str:
    data = {
        **payload,
        "type": token_type,
        "jti": uuid.uuid4().hex,
        "iat": _now(),
        "exp": _now() + expires,
    }
    return jwt.encode(data, _env.JWT_SECRET, algorithm=_ALG)


def decode(token: str, expected_type: str) -> dict:
    data = jwt.decode(token, _env.JWT_SECRET, algorithms=[_ALG])
    if data.get("type") != expected_type:
        raise jwt.InvalidTokenError("tipo de token inválido")
    return data


def issue_app_access(client_id: str) -> str:
    return _encode({"client_id": client_id}, TYPE_APP, timedelta(minutes=_env.ACCESS_TOKEN_MINUTES))


def issue_app_refresh(client_id: str) -> str:
    return _encode({"client_id": client_id}, TYPE_APP_REFRESH, timedelta(days=_env.APP_REFRESH_DAYS))


def issue_user_access(user_id: int) -> str:
    return _encode({"userId": user_id}, TYPE_USER_ACCESS, timedelta(minutes=_env.ACCESS_TOKEN_MINUTES))


def issue_user_refresh(user_id: int) -> str:
    return _encode({"userId": user_id}, TYPE_USER_REFRESH, timedelta(hours=_env.REFRESH_USER_HOURS))
