from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from infrastructure.database.mysql.settings.base import Base


class Setting(Base):
    __tablename__ = "settings"

    key: Mapped[str] = mapped_column("key", String(64), primary_key=True)
    value: Mapped[str] = mapped_column("value", Text, nullable=False)


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[str] = mapped_column("id", String(36), primary_key=True)
    token: Mapped[str] = mapped_column("token", String(72), nullable=False)
    name: Mapped[str] = mapped_column("name", String(80), nullable=False)
    phone: Mapped[str] = mapped_column("phone", String(20), nullable=False)
    service: Mapped[str] = mapped_column("service", String(80), nullable=False)
    price: Mapped[int] = mapped_column("price", Integer, nullable=False)
    duration: Mapped[int] = mapped_column("duration", Integer, nullable=False)
    date: Mapped[str] = mapped_column("date", String(10), nullable=False)
    start: Mapped[int] = mapped_column("start", Integer, nullable=False)
    status: Mapped[str] = mapped_column("status", String(16), nullable=False, default="confirmed")
    kind: Mapped[str] = mapped_column("kind", String(16), nullable=False, default="appointment")
    created: Mapped[str] = mapped_column("created", String(40), nullable=False)


class Occupancy(Base):
    __tablename__ = "occupancy"

    date: Mapped[str] = mapped_column("date", String(10), primary_key=True)
    minute: Mapped[int] = mapped_column("minute", Integer, primary_key=True)
    booking: Mapped[str] = mapped_column("booking", String(36), ForeignKey("bookings.id"), nullable=False)


class Outbox(Base):
    __tablename__ = "outbox"

    id: Mapped[str] = mapped_column("id", String(36), primary_key=True)
    booking: Mapped[str] = mapped_column("booking", String(36), ForeignKey("bookings.id"), nullable=False)
    type: Mapped[str] = mapped_column("type", String(24), nullable=False)
    status: Mapped[str] = mapped_column("status", String(16), nullable=False, default="pending")
    scheduled: Mapped[str] = mapped_column("scheduled", String(40), nullable=False)
    created: Mapped[str] = mapped_column("created", String(40), nullable=False)
