import uuid
from datetime import datetime

from sqlalchemy.exc import IntegrityError

from app.interfaces.entities.agenda.agenda_usecase_interface import IAgendaUsecase
from app.interfaces.entities.agenda.agenda_repository_interface import IAgendaRepository
from app.interfaces.entities.config.config_usecase_interface import IConfigUsecase
from app.services.customer_service import customer
from app.services.errors import HttpError, ValidationError
from app.services.notifications_service import notifications
from app.services.config_service import DURATIONS
from app.services.scheduling_service import (
    SAO_PAULO,
    OFFSET,
    agenda_range_ok,
    available,
    cells,
    date_ok,
    time_label,
)


def _now_iso() -> str:
    return datetime.now(SAO_PAULO).astimezone().isoformat()


def _started(booking: dict) -> bool:
    start = datetime.strptime(
        f"{booking['date']} {time_label(booking['start'])}", "%Y-%m-%d %H:%M"
    ).replace(tzinfo=OFFSET)
    return start <= datetime.now(OFFSET)


class AgendaUsecase(IAgendaUsecase):
    def __init__(self, repository: IAgendaRepository, config_usecase: IConfigUsecase):
        self._repository = repository
        self._config_usecase = config_usecase

    async def _slots(self, date: str, duration: int, config: dict, exclude: str | None = None) -> list[int]:
        if not date_ok(date):
            raise ValidationError("Escolha uma data de hoje até os próximos 90 dias.")
        return available(date, duration, config, await self._repository.occupied(date, exclude))

    async def _authorize(self, booking_id: str, token: str | None, operator: bool) -> dict:
        booking = await self._repository.find_booking(booking_id)
        if not booking or (not operator and token != booking["token"]):
            raise HttpError(404, "Reserva não encontrada ou link inválido.")
        return booking

    @staticmethod
    def _require_confirmed(booking: dict) -> None:
        if booking["status"] != "confirmed":
            raise HttpError(409, "Esta reserva já foi cancelada. Atualize seus horários.")

    @staticmethod
    def _strip_internal(booking: dict) -> dict:
        return {k: v for k, v in booking.items() if k not in ("token", "created")}

    async def list_slots(self, date, service_id, duration, operator) -> list[int]:
        config = await self._config_usecase.get_config()
        if operator:
            minutes = duration
        else:
            match = next((s for s in config["services"] if s["id"] == service_id), None)
            minutes = match["duration"] if match else None
        if minutes not in DURATIONS:
            raise ValidationError("Escolha um serviço ou uma duração válida.")
        return await self._slots(date, minutes, config)

    async def list_agenda(self, date, end) -> list[dict]:
        if not agenda_range_ok(date, end):
            raise ValidationError("Escolha um período válido de até 31 dias.")
        return await self._repository.list_agenda(date, end)

    async def get_booking(self, booking_id, token, operator) -> dict:
        booking = await self._authorize(booking_id, token, operator)
        return self._strip_internal(booking)

    async def booking_slots(self, booking_id, date, token, operator) -> list[int]:
        booking = await self._authorize(booking_id, token, operator)
        self._require_confirmed(booking)
        config = await self._config_usecase.get_config()
        return await self._slots(date, booking["duration"], config, booking_id)

    async def cancel_booking(self, booking_id, token, operator) -> None:
        booking = await self._authorize(booking_id, token, operator)
        self._require_confirmed(booking)
        if not operator and _started(booking):
            raise HttpError(409, "Este atendimento já começou. Fale com a barbearia.")
        await self._repository.cancel_booking(booking, notifications(booking, ["cancellation"], _now_iso()))

    async def move_booking(self, booking_id, body, token, operator) -> None:
        booking = await self._authorize(booking_id, token, operator)
        self._require_confirmed(booking)
        if not operator and _started(booking):
            raise HttpError(409, "Este atendimento já começou. Fale com a barbearia.")
        config = await self._config_usecase.get_config()
        if body["start"] not in await self._slots(body["date"], booking["duration"], config, booking_id):
            raise HttpError(409, "Esse horário não está mais disponível. Escolha outro.")
        moved = {**booking, "date": body["date"], "start": body["start"]}
        try:
            await self._repository.move_booking(
                booking_id,
                body["date"],
                body["start"],
                cells(body["start"], booking["duration"], config["interval"]),
                notifications(moved, ["confirmation", "reminder"], _now_iso()),
            )
        except IntegrityError:
            raise HttpError(409, "A reserva ou o horário mudou. Atualize os dados e tente novamente.")

    async def create_booking(self, body, operator) -> dict:
        config = await self._config_usecase.get_config()
        block = operator and body.get("kind") == "block"
        if block:
            who = {"name": str(body.get("name") or "").strip(), "phone": ""}
            if len(who["name"]) < 2 or len(who["name"]) > 80:
                raise ValidationError("Informe o motivo do bloqueio, entre 2 e 80 caracteres.")
            service = {"name": "Bloqueio", "duration": body.get("duration"), "price": 0}
        else:
            who = customer(body)
            service = next((s for s in config["services"] if s["id"] == body.get("service")), None)
        if not service or service["duration"] not in DURATIONS:
            raise ValidationError("O serviço foi alterado. Atualize a lista e escolha novamente.")
        if body["start"] not in await self._slots(body["date"], service["duration"], config):
            raise HttpError(409, "Esse horário não está mais disponível. Escolha outro.")
        created = _now_iso()
        booking = {
            "id": str(uuid.uuid4()),
            "token": str(uuid.uuid4()) + str(uuid.uuid4()),
            **who,
            "service": service["name"],
            "price": service["price"],
            "duration": service["duration"],
            "date": body["date"],
            "start": body["start"],
            "status": "confirmed",
            "kind": "block" if block else "appointment",
            "created": created,
        }
        try:
            await self._repository.create_booking(
                booking,
                cells(body["start"], service["duration"], config["interval"]),
                notifications(booking, [] if block else ["confirmation", "reminder"], created),
            )
        except IntegrityError:
            raise HttpError(409, "Esse horário acabou de ser ocupado. Escolha outro.")
        return {k: v for k, v in booking.items() if k != "created"}
