from datetime import datetime

from sqlalchemy import select, update

from app.entities.mysql.auth_models import ServiceCredential, User
from infrastructure.database.mysql.settings.connection import MySqlAsyncConnectionHandler


class AuthRepository:

    async def find_user_by_email(self, email: str) -> dict | None:
        async with MySqlAsyncConnectionHandler() as session:
            result = await session.execute(select(User).where(User.email == email))
            row = result.scalars().first()
            if not row:
                return None
            return {
                "id": row.id,
                "active": bool(row.active),
                "administrator_id": row.administrator_id,
                "email": row.email,
                "password": row.password,
            }

    async def find_user_by_id(self, user_id: int) -> dict | None:
        async with MySqlAsyncConnectionHandler() as session:
            result = await session.execute(select(User).where(User.id == user_id))
            row = result.scalars().first()
            if not row:
                return None
            return {"id": row.id, "active": bool(row.active), "email": row.email}

    async def find_credential_by_client_id(self, client_id: str) -> dict | None:
        async with MySqlAsyncConnectionHandler() as session:
            result = await session.execute(
                select(ServiceCredential).where(ServiceCredential.client_id == client_id)
            )
            row = result.scalars().first()
            if not row:
                return None
            return {
                "id": row.id,
                "client_id": row.client_id,
                "client_secret": row.client_secret,
                "refresh_token": row.refresh_token,
                "expire_at": row.expire_at,
                "active": bool(row.active),
            }

    async def save_app_refresh(self, client_id: str, refresh_token: str, expire_at: datetime) -> None:
        async with MySqlAsyncConnectionHandler() as session:
            await session.execute(
                update(ServiceCredential)
                .where(ServiceCredential.client_id == client_id)
                .values(refresh_token=refresh_token, expire_at=expire_at)
            )
            await session.commit()
