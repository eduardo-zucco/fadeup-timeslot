from abc import ABC, abstractmethod


class IConfigUsecase(ABC):

    @abstractmethod
    async def get_config(self) -> dict: ...

    @abstractmethod
    async def update_config(self, config: dict) -> None: ...
