from app.interfaces.entities.agenda.agenda_usecase_interface import IAgendaUsecase
from app.interfaces.entities.config.config_usecase_interface import IConfigUsecase
from app.usecases.agenda_usecase import AgendaUsecase
from app.usecases.config_usecase import ConfigUsecase
from infrastructure.database.mysql.repositories.agenda.agenda_repository import AgendaRepository


def get_config_usecase() -> IConfigUsecase:
    return ConfigUsecase(repository=AgendaRepository())


def get_agenda_usecase() -> IAgendaUsecase:
    repository = AgendaRepository()
    return AgendaUsecase(repository=repository, config_usecase=ConfigUsecase(repository=repository))
