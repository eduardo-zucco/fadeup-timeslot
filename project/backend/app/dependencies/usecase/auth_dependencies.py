from app.usecases.auth_usecase import AuthUsecase
from infrastructure.database.mysql.repositories.auth.auth_repository import AuthRepository


def get_auth_usecase() -> AuthUsecase:
    return AuthUsecase(repository=AuthRepository())
