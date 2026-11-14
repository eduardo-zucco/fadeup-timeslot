from app.interfaces.entities.config.config_usecase_interface import IConfigUsecase
from app.interfaces.entities.agenda.agenda_repository_interface import IAgendaRepository
from app.services.config_service import default_config, valid_config
from app.services.errors import ValidationError


class ConfigUsecase(IConfigUsecase):
    def __init__(self, repository: IAgendaRepository):
        self._repository = repository

    async def get_config(self) -> dict:
        return await self._repository.get_config() or default_config()

    async def update_config(self, config: dict) -> None:
        if not valid_config(config):
            raise ValidationError(
                "Confira serviços, dias e expediente. Use horários em múltiplos de 15 minutos."
            )
        clean = {
            "name": config["name"].strip(),
            "open": config["open"],
            "close": config["close"],
            "interval": config["interval"],
            "days": list(dict.fromkeys(config["days"])),
            "services": [
                {
                    "id": service["id"],
                    "name": service["name"].strip(),
                    "price": service["price"],
                    "duration": service["duration"],
                }
                for service in config["services"]
            ],
        }
        await self._repository.save_config(clean)
