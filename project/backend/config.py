import os

from pydantic_settings import BaseSettings


def get_env_filename():
    return ".env" if os.path.exists(".env") else ".env.example"


class EnvironmentVariables(BaseSettings):
    PORT_MYSQL_FADEUP: str
    USER_MYSQL_FADEUP: str
    PASS_MYSQL_FADEUP: str
    BASE_MYSQL_FADEUP: str
    HOST_MYSQL_FADEUP: str

    JWT_SECRET: str = "troque-por-um-segredo-forte"
    PASSWORD_PEPPER: str = ""
    ACCESS_TOKEN_MINUTES: int = 30
    REFRESH_USER_HOURS: int = 2
    APP_REFRESH_DAYS: int = 7

    HOST: str = "127.0.0.1"
    PORT: int = 8000

    FRONT_ORIGINS: str = "http://127.0.0.1:5173,http://localhost:5173"

    class Config:
        env_file = get_env_filename()
        env_file_encoding = "utf-8"
        populate_by_name = True

    @property
    def front_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.FRONT_ORIGINS.split(",") if origin.strip()]


def get_environment_variables() -> EnvironmentVariables:
    return EnvironmentVariables()
