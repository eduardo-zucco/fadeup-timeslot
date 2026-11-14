import os
import sys

import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

os.environ.setdefault("USER_MYSQL_FADEUP", "root")
os.environ.setdefault("PASS_MYSQL_FADEUP", "placeholder")
os.environ.setdefault("HOST_MYSQL_FADEUP", "localhost")
os.environ.setdefault("PORT_MYSQL_FADEUP", "3306")
os.environ.setdefault("BASE_MYSQL_FADEUP", "fadeup")
os.environ.setdefault("JWT_SECRET", "segredo-de-teste-bem-grande-32bytes-xx")
os.environ.setdefault("PASSWORD_PEPPER", "KANVOASJO1239BLAS01238995N")
os.environ.setdefault("FRONT_ORIGINS", "http://127.0.0.1:5173")

CLIENT_ID = "front-test"
CLIENT_SECRET = "segredo-app-de-teste"
ADMIN_EMAIL = "admin@fadeup.com"
ADMIN_PASSWORD = "senhaDeTeste1"


def future_weekday(days_ahead: int = 1) -> str:
    from datetime import datetime, timedelta
    from zoneinfo import ZoneInfo

    now = datetime.now(ZoneInfo("America/Sao_Paulo"))
    for offset in range(days_ahead, days_ahead + 14):
        cand = now + timedelta(days=offset)
        if cand.weekday() != 6:
            return cand.strftime("%Y-%m-%d")
    raise AssertionError("não achei dia útil")


@pytest.fixture()
def client():
    import asyncio
    import tempfile
    import uuid

    from infrastructure.database.mysql.settings import connection as connection_module
    from infrastructure.database.mysql.settings.base import Base
    import app.entities.mysql.models  # noqa: F401
    import app.entities.mysql.auth_models as auth_models
    from app.services.hashing_service import hash_client_secret, hash_password

    db_path = os.path.join(tempfile.gettempdir(), f"fadeup-test-{uuid.uuid4().hex}.sqlite")
    engine = create_async_engine(f"sqlite+aiosqlite:///{db_path}")
    test_session_make = async_sessionmaker(bind=engine, expire_on_commit=False)

    async def prepare():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        async with test_session_make() as session:
            session.add(auth_models.TypeDocument(id=1, name="CPF"))
            session.add(
                auth_models.Administrator(
                    id=1, active=True, name="Dono", mobile_number="14999999999",
                    type_document_id=1, document_number="12345678900",
                )
            )
            session.add(
                auth_models.User(
                    id=1, active=True, administrator_id=1,
                    email=ADMIN_EMAIL, password=hash_password(ADMIN_PASSWORD),
                )
            )
            session.add(
                auth_models.ServiceCredential(
                    id=1, client_id=CLIENT_ID,
                    client_secret=hash_client_secret(CLIENT_SECRET), active=True,
                )
            )
            await session.commit()

    asyncio.new_event_loop().run_until_complete(prepare())

    original = connection_module.session_make
    connection_module.session_make = test_session_make

    from fastapi.testclient import TestClient
    import main

    with TestClient(main.app) as test_client:
        yield test_client

    connection_module.session_make = original
    asyncio.new_event_loop().run_until_complete(engine.dispose())
    if os.path.exists(db_path):
        os.remove(db_path)


@pytest.fixture()
def app_headers(client):
    r = client.post("/api/auth/app-token", json={"client_id": CLIENT_ID, "client_secret": CLIENT_SECRET})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.fixture()
def admin_headers(client, app_headers):
    app_token = app_headers["Authorization"].split(" ", 1)[1]
    r = client.post(
        "/api/auth/login",
        headers=app_headers,
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
    )
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}", "X-App-Token": app_token}
