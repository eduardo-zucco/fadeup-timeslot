from abc import ABC, abstractmethod


class IAgendaRepository(ABC):

    @abstractmethod
    async def get_config(self) -> dict | None: ...

    @abstractmethod
    async def save_config(self, config: dict) -> None: ...

    @abstractmethod
    async def find_booking(self, booking_id: str) -> dict | None: ...

    @abstractmethod
    async def occupied(self, date: str, exclude: str | None = None) -> list[int]: ...

    @abstractmethod
    async def list_agenda(self, date: str, end: str) -> list[dict]: ...

    @abstractmethod
    async def create_booking(self, booking: dict, minutes: list[int], queued_messages: list[dict]) -> None: ...

    @abstractmethod
    async def move_booking(
        self, booking_id: str, date: str, start: int, minutes: list[int], queued_messages: list[dict]
    ) -> None: ...

    @abstractmethod
    async def cancel_booking(self, booking: dict, queued_messages: list[dict]) -> None: ...
