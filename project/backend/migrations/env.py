from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from config import get_environment_variables
from infrastructure.database.mysql.settings.base import Base
import app.entities.mysql.models  # noqa: F401  (registra as tabelas em Base.metadata)
import app.entities.mysql.auth_models  # noqa: F401  (tabelas de autenticação)

alembic_config = context.config

if alembic_config.config_file_name is not None:
    fileConfig(alembic_config.config_file_name)

env = get_environment_variables()
sync_url = "mysql+pymysql://{}:{}@{}:{}/{}".format(
    env.USER_MYSQL_FADEUP,
    env.PASS_MYSQL_FADEUP,
    env.HOST_MYSQL_FADEUP,
    env.PORT_MYSQL_FADEUP,
    env.BASE_MYSQL_FADEUP,
)
alembic_config.set_main_option("sqlalchemy.url", sync_url)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=sync_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        alembic_config.get_section(alembic_config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
