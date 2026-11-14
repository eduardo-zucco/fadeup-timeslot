from tests.conftest import future_weekday


def _first_slot(client, headers, date, service="corte"):
    slots = client.get(f"/api/slots?date={date}&service={service}", headers=headers).json()["slots"]
    assert slots, "esperava horários livres em dia útil"
    return slots


def test_config_sem_auth_401(client):
    assert client.get("/api/config").status_code == 401


def test_get_config_default(client, app_headers):
    response = client.get("/api/config", headers=app_headers)
    assert response.status_code == 200
    assert response.json()["name"] == "fadeUp Barbearia"


def test_slots_dia_util_tem_horarios(client, app_headers):
    date = future_weekday()
    assert _first_slot(client, app_headers, date)


def test_slots_data_invalida_400(client, app_headers):
    response = client.get("/api/slots?date=2000-01-01&service=corte", headers=app_headers)
    assert response.status_code == 400


def test_criar_consultar_cancelar(client, app_headers):
    date = future_weekday()
    start = _first_slot(client, app_headers, date)[0]
    created = client.post(
        "/api/bookings",
        headers=app_headers,
        json={"service": "corte", "date": date, "start": start,
              "name": "Fulano Teste", "phone": "(14) 99999-9999", "consent": True},
    )
    assert created.status_code == 201
    booking = created.json()
    assert len(booking["token"]) == 72
    bid, token = booking["id"], booking["token"]

    # sem booking token -> 404
    assert client.get(f"/api/bookings/{bid}", headers=app_headers).status_code == 404

    # com booking token -> 200 e sem token no corpo
    got = client.get(f"/api/bookings/{bid}", headers={**app_headers, "X-Booking-Token": token})
    assert got.status_code == 200
    assert got.json().get("token") is None

    deleted = client.delete(f"/api/bookings/{bid}", headers={**app_headers, "X-Booking-Token": token})
    assert deleted.status_code == 200 and deleted.json() == {"ok": True}


def test_conflito_horario_409(client, app_headers):
    date = future_weekday()
    start = _first_slot(client, app_headers, date)[0]
    payload = {"service": "corte", "date": date, "start": start,
               "name": "Cliente Um", "phone": "11988887777", "consent": True}
    assert client.post("/api/bookings", headers=app_headers, json=payload).status_code == 201
    segundo = client.post("/api/bookings", headers=app_headers, json={**payload, "name": "Cliente Dois"})
    assert segundo.status_code == 409


def test_validacao_fields_400(client, app_headers):
    date = future_weekday()
    start = _first_slot(client, app_headers, date)[0]
    response = client.post(
        "/api/bookings",
        headers=app_headers,
        json={"service": "corte", "date": date, "start": start, "name": "X", "phone": "abc"},
    )
    assert response.status_code == 400
    assert set(response.json()["fields"].keys()) == {"name", "phone", "consent"}


def test_admin_sem_auth_401(client, app_headers):
    date = future_weekday()
    # só com app token (sem usuário) -> 401
    assert client.get(f"/api/admin/agenda?date={date}", headers=app_headers).status_code == 401
    # sem nenhum token -> 401
    assert client.get(f"/api/admin/agenda?date={date}").status_code == 401


def test_admin_fluxo_completo(client, app_headers, admin_headers):
    date = future_weekday()
    assert client.get("/api/admin/session", headers=admin_headers).json() == {"authenticated": True}

    start = _first_slot(client, app_headers, date)[0]
    client.post(
        "/api/bookings",
        headers=app_headers,
        json={"service": "corte", "date": date, "start": start,
              "name": "Agenda Teste", "phone": "11988887777", "consent": True},
    )
    agenda = client.get(f"/api/admin/agenda?date={date}", headers=admin_headers)
    assert agenda.status_code == 200
    records = agenda.json()["records"]
    assert len(records) >= 1
    assert all(rec.get("token") is None for rec in records)


def test_admin_cria_bloqueio(client, admin_headers):
    date = future_weekday()
    slots = client.get(f"/api/admin/slots?date={date}&duration=60", headers=admin_headers).json()["slots"]
    assert slots
    created = client.post(
        "/api/admin/bookings",
        headers=admin_headers,
        json={"kind": "block", "name": "Almoço", "date": date, "start": slots[0], "duration": 60},
    )
    assert created.status_code == 201
    body = created.json()
    assert body["kind"] == "block" and body["price"] == 0 and body["phone"] == ""


def test_reagendar(client, app_headers):
    date = future_weekday()
    slots = _first_slot(client, app_headers, date)
    start, outro = slots[0], slots[1]
    created = client.post(
        "/api/bookings",
        headers=app_headers,
        json={"service": "corte", "date": date, "start": start,
              "name": "Mover Teste", "phone": "11988887777", "consent": True},
    ).json()
    moved = client.patch(
        f"/api/bookings/{created['id']}",
        headers={**app_headers, "X-Booking-Token": created["token"]},
        json={"date": date, "start": outro},
    )
    assert moved.status_code == 200 and moved.json() == {"ok": True}


def test_healthy_check(client):
    assert client.get("/healthy_check").status_code == 200
