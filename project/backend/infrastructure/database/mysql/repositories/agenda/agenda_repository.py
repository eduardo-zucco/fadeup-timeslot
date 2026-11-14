import json

from sqlalchemy import delete, insert, select, update

from app.entities.mysql.models import Booking, Occupancy, Outbox, Setting
from app.interfaces.entities.agenda.agenda_repository_interface import IAgendaRepository
from infrastructure.database.mysql.settings.connection import MySqlAsyncConnectionHandler

_BOOKING_FIELDS = ("id", "name", "phone", "service", "price", "duration", "date", "start", "status", "kind")


def _booking_to_dict(row: Booking) -> dict:
    return {
        "id": row.id,
        "token": row.token,
        "name": row.name,
        "phone": row.phone,
        "service": row.service,
        "price": row.price,
        "duration": row.duration,
        "date": row.date,
        "start": row.start,
        "status": row.status,
        "kind": row.kind,
        "created": row.created,
    }


class AgendaRepository(IAgendaRepository):

    async def get_config(self) -> dict | None:
        async with MySqlAsyncConnectionHandler() as session:
            stmt = select(Setting.value).where(Setting.key == "config")
            result = await session.execute(stmt)
            value = result.scalars().first()
            return json.loads(value) if value else None

    async def save_config(self, config: dict) -> None:
        payload = json.dumps(config, ensure_ascii=False)
        async with MySqlAsyncConnectionHandler() as session:
            result = await session.execute(
                update(Setting).where(Setting.key == "config").values(value=payload)
            )
            if result.rowcount == 0:
                await session.execute(insert(Setting).values(key="config", value=payload))
            await session.commit()

    async def find_booking(self, booking_id: str) -> dict | None:
        async with MySqlAsyncConnectionHandler() as session:
            result = await session.execute(select(Booking).where(Booking.id == booking_id))
            row = result.scalars().first()
            return _booking_to_dict(row) if row else None

    async def occupied(self, date: str, exclude: str | None = None) -> list[int]:
        async with MySqlAsyncConnectionHandler() as session:
            stmt = select(Occupancy.minute).where(Occupancy.date == date)
            if exclude:
                stmt = stmt.where(Occupancy.booking != exclude)
            result = await session.execute(stmt)
            return list(result.scalars().all())

    async def list_agenda(self, date: str, end: str) -> list[dict]:
        async with MySqlAsyncConnectionHandler() as session:
            stmt = (
                select(Booking)
                .where(Booking.date >= date, Booking.date <= end)
                .order_by(Booking.date, Booking.start)
            )
            result = await session.execute(stmt)
            rows = result.scalars().all()
            return [{field: getattr(row, field) for field in _BOOKING_FIELDS} for row in rows]

    def _occupancy_values(self, booking_id: str, date: str, minutes: list[int]) -> list[dict]:
        return [{"date": date, "minute": minute, "booking": booking_id} for minute in minutes]

    def _message_values(self, items: list[dict]) -> list[dict]:
        return [
            {
                "id": item["id"],
                "booking": item["booking"],
                "type": item["type"],
                "status": "pending",
                "scheduled": item["scheduled"],
                "created": item["created"],
            }
            for item in items
        ]

    async def _cancel_messages(self, session, booking_id: str) -> None:
        await session.execute(
            update(Outbox)
            .where(Outbox.booking == booking_id, Outbox.status == "pending")
            .values(status="cancelled")
        )

    async def create_booking(self, booking: dict, minutes: list[int], queued_messages: list[dict]) -> None:
        async with MySqlAsyncConnectionHandler() as session:
            session.add(Booking(**{k: booking[k] for k in Booking.__table__.columns.keys()}))
            await session.flush()
            if minutes:
                await session.execute(insert(Occupancy), self._occupancy_values(booking["id"], booking["date"], minutes))
            if queued_messages:
                await session.execute(insert(Outbox), self._message_values(queued_messages))
            await session.commit()

    async def move_booking(
        self, booking_id: str, date: str, start: int, minutes: list[int], queued_messages: list[dict]
    ) -> None:
        async with MySqlAsyncConnectionHandler() as session:
            await session.execute(delete(Occupancy).where(Occupancy.booking == booking_id))
            await session.execute(
                update(Booking)
                .where(Booking.id == booking_id, Booking.status == "confirmed")
                .values(date=date, start=start)
            )
            if minutes:
                await session.execute(insert(Occupancy), self._occupancy_values(booking_id, date, minutes))
            await self._cancel_messages(session, booking_id)
            if queued_messages:
                await session.execute(insert(Outbox), self._message_values(queued_messages))
            await session.commit()

    async def cancel_booking(self, booking: dict, queued_messages: list[dict]) -> None:
        async with MySqlAsyncConnectionHandler() as session:
            await session.execute(delete(Occupancy).where(Occupancy.booking == booking["id"]))
            await session.execute(
                update(Booking).where(Booking.id == booking["id"]).values(status="cancelled")
            )
            await self._cancel_messages(session, booking["id"])
            if queued_messages:
                await session.execute(insert(Outbox), self._message_values(queued_messages))
            await session.commit()
