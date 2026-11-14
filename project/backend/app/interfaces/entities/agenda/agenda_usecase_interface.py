from abc import ABC, abstractmethod


class IAgendaUsecase(ABC):

    @abstractmethod
    async def list_slots(self, date: str, service_id: str | None, duration: int | None, operator: bool) -> list[int]: ...

    @abstractmethod
    async def list_agenda(self, date: str, end: str) -> list[dict]: ...

    @abstractmethod
    async def get_booking(self, booking_id: str, token: str | None, operator: bool) -> dict: ...

    @abstractmethod
    async def booking_slots(self, booking_id: str, date: str, token: str | None, operator: bool) -> list[int]: ...

    @abstractmethod
    async def create_booking(self, body: dict, operator: bool) -> dict: ...

    @abstractmethod
    async def move_booking(self, booking_id: str, body: dict, token: str | None, operator: bool) -> None: ...

    @abstractmethod
    async def cancel_booking(self, booking_id: str, token: str | None, operator: bool) -> None: ...
