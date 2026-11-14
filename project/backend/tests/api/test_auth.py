from tests.conftest import ADMIN_EMAIL, ADMIN_PASSWORD, CLIENT_ID, CLIENT_SECRET, future_weekday


def test_app_token_ok(client):
    r = client.post("/api/auth/app-token", json={"client_id": CLIENT_ID, "client_secret": CLIENT_SECRET})
    assert r.status_code == 200
    body = r.json()
    assert body["access_token"] and body["refresh_token"]


def test_app_token_secret_errado_401(client):
    r = client.post("/api/auth/app-token", json={"client_id": CLIENT_ID, "client_secret": "errado"})
    assert r.status_code == 401


def test_app_token_client_inexistente_401(client):
    r = client.post("/api/auth/app-token", json={"client_id": "nao-existe", "client_secret": "x"})
    assert r.status_code == 401


def test_login_ok(client, app_headers):
    r = client.post(
        "/api/auth/login",
        headers=app_headers,
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["userId"] == 1 and body["access_token"] and body["refresh_token"]


def test_login_senha_errada_401(client, app_headers):
    r = client.post(
        "/api/auth/login",
        headers=app_headers,
        json={"email": ADMIN_EMAIL, "password": "errada"},
    )
    assert r.status_code == 401


def test_user_refresh_rotaciona(client, app_headers):
    login = client.post(
        "/api/auth/login",
        headers=app_headers,
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
    ).json()
    r = client.post("/api/auth/refresh", json={"refresh_token": login["refresh_token"]})
    assert r.status_code == 200
    novo = r.json()
    # rotação: novo par distinto do anterior
    assert novo["access_token"] != login["access_token"]
    assert novo["refresh_token"] != login["refresh_token"]


def test_user_refresh_token_invalido_401(client):
    assert client.post("/api/auth/refresh", json={"refresh_token": "lixo"}).status_code == 401


def test_app_refresh_ok(client):
    par = client.post(
        "/api/auth/app-token", json={"client_id": CLIENT_ID, "client_secret": CLIENT_SECRET}
    ).json()
    r = client.post("/api/auth/app-refresh", json={"refresh_token": par["refresh_token"]})
    assert r.status_code == 200
    assert r.json()["access_token"]


def test_admin_exige_app_e_user(client, app_headers, admin_headers):
    date = future_weekday()
    # app + user -> 200
    assert client.get(f"/api/admin/agenda?date={date}", headers=admin_headers).status_code == 200
    # user sem app (remove X-App-Token) -> 401
    sem_app = {"Authorization": admin_headers["Authorization"]}
    assert client.get(f"/api/admin/agenda?date={date}", headers=sem_app).status_code == 401
    # app sem user -> 401
    assert client.get(f"/api/admin/agenda?date={date}", headers=app_headers).status_code == 401
