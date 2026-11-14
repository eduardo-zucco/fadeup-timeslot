from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from infrastructure.database.mysql.settings.base import Base


class TypeDocument(Base):
    __tablename__ = "type_documents"

    id: Mapped[int] = mapped_column("id", Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column("name", String(32), nullable=False)


class Administrator(Base):
    __tablename__ = "administrators"

    id: Mapped[int] = mapped_column("id", Integer, primary_key=True, autoincrement=True)
    active: Mapped[bool] = mapped_column("active", Boolean, nullable=False, default=True)
    name: Mapped[str] = mapped_column("name", String(120), nullable=False)
    mobile_number: Mapped[str] = mapped_column("mobile_number", String(20), nullable=False)
    type_document_id: Mapped[int] = mapped_column(
        "type_document_id", Integer, ForeignKey("type_documents.id"), nullable=False
    )
    document_number: Mapped[str] = mapped_column("document_number", String(20), nullable=False)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column("id", Integer, primary_key=True, autoincrement=True)
    active: Mapped[bool] = mapped_column("active", Boolean, nullable=False, default=True)
    administrator_id: Mapped[int] = mapped_column(
        "administrator_id", Integer, ForeignKey("administrators.id"), nullable=False
    )
    email: Mapped[str] = mapped_column("email", String(160), nullable=False, unique=True)
    password: Mapped[str] = mapped_column("password", String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        "created_at", DateTime, nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        "updated_at", DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
    )


class ServiceCredential(Base):
    __tablename__ = "service_credentials"

    id: Mapped[int] = mapped_column("id", Integer, primary_key=True, autoincrement=True)
    client_id: Mapped[str] = mapped_column("client_id", String(64), nullable=False, unique=True)
    client_secret: Mapped[str] = mapped_column("client_secret", String(64), nullable=False)
    refresh_token: Mapped[str | None] = mapped_column("refresh_token", String(512), nullable=True)
    expire_at: Mapped[datetime | None] = mapped_column("expire_at", DateTime, nullable=True)
    active: Mapped[bool] = mapped_column("active", Boolean, nullable=False, default=True)
