from sqlalchemy.ext.asyncio import (
    async_sessionmaker,
    create_async_engine
)

from config import get_environment_variables


env = get_environment_variables()

connection_string = "mysql+aiomysql://{}:{}@{}:{}/{}".format(
    env.USER_MYSQL_FADEUP,
    env.PASS_MYSQL_FADEUP,
    env.HOST_MYSQL_FADEUP,
    env.PORT_MYSQL_FADEUP,
    env.BASE_MYSQL_FADEUP,
)

engine = create_async_engine(
    connection_string,
    pool_size=20,
    max_overflow=30,
    pool_timeout=60,
    pool_recycle=3600,
    echo=False,
    pool_pre_ping=True,
    pool_reset_on_return="commit",
)

session_make = async_sessionmaker(bind=engine, expire_on_commit=False)


class MySqlAsyncConnectionHandler:
    def __init__(self) -> None:
        self.session = None

    async def __aenter__(self):
        self.session = session_make()
        return self.session

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            await self.session.rollback()
        await self.session.close()


async def get_db():
    async with MySqlAsyncConnectionHandler() as db:
        yield db
