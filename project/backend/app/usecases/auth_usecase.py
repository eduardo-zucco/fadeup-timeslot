from datetime import datetime, timedelta, timezone

import jwt

from app.services import jwt_service
from app.services.errors import HttpError
from app.services.hashing_service import verify_client_secret, verify_password
from config import get_environment_variables
from infrastructure.database.mysql.repositories.auth.auth_repository import AuthRepository

_env = get_environment_variables()


class AuthUsecase:
    def __init__(self, repository: AuthRepository):
        self._repository = repository

    async def app_token(self, client_id: str, client_secret: str) -> dict:
        credential = await self._repository.find_credential_by_client_id(client_id)
        if not credential or not credential["active"]:
            raise HttpError(401, "Credenciais de aplicação inválidas.")
        if not verify_client_secret(client_secret, credential["client_secret"]):
            raise HttpError(401, "Credenciais de aplicação inválidas.")
        return await self._issue_app_pair(client_id)

    async def app_refresh(self, refresh_token: str) -> dict:
        try:
            data = jwt_service.decode(refresh_token, jwt_service.TYPE_APP_REFRESH)
        except jwt.PyJWTError:
            raise HttpError(401, "Refresh de aplicação inválido ou expirado.")
        client_id = data.get("client_id")
        credential = await self._repository.find_credential_by_client_id(client_id)
        if not credential or not credential["active"] or credential["refresh_token"] != refresh_token:
            raise HttpError(401, "Refresh de aplicação inválido ou expirado.")
        return await self._issue_app_pair(client_id)

    async def _issue_app_pair(self, client_id: str) -> dict:
        access = jwt_service.issue_app_access(client_id)
        refresh = jwt_service.issue_app_refresh(client_id)
        expire_at = datetime.now(timezone.utc) + timedelta(days=_env.APP_REFRESH_DAYS)
        await self._repository.save_app_refresh(client_id, refresh, expire_at.replace(tzinfo=None))
        return {"access_token": access, "refresh_token": refresh}

    async def login(self, email: str, password: str) -> dict:
        user = await self._repository.find_user_by_email(email)
        if not user or not user["active"] or not verify_password(password, user["password"]):
            raise HttpError(401, "E-mail ou senha inválidos.")
        return self._issue_user_pair(user["id"])

    async def user_refresh(self, refresh_token: str) -> dict:
        try:
            data = jwt_service.decode(refresh_token, jwt_service.TYPE_USER_REFRESH)
        except jwt.PyJWTError:
            raise HttpError(401, "Sessão expirada. Entre novamente.")
        user = await self._repository.find_user_by_id(data.get("userId"))
        if not user or not user["active"]:
            raise HttpError(401, "Sessão expirada. Entre novamente.")
        return self._issue_user_pair(user["id"])

    def _issue_user_pair(self, user_id: int) -> dict:
        return {
            "access_token": jwt_service.issue_user_access(user_id),
            "refresh_token": jwt_service.issue_user_refresh(user_id),
            "userId": user_id,
        }
