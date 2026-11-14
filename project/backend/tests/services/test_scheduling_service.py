import pytest

from app.services.config_service import DEFAULTS, default_config, valid_config
from app.services.customer_service import customer
from app.services.errors import ValidationError
from app.services.scheduling_service import (
    agenda_range_ok,
    cells,
    is_calendar_date,
    time_label,
    weekday_sun0,
)


def test_time_label():
    assert time_label(540) == "09:00"
    assert time_label(1080) == "18:00"
    assert time_label(75) == "01:15"


def test_is_calendar_date():
    assert is_calendar_date("2026-11-16")
    assert not is_calendar_date("2026-13-01")
    assert not is_calendar_date("16/11/2026")
    assert not is_calendar_date("2026-02-30")


def test_cells_cobre_duracao_e_intervalo():
    assert cells(540, 30, 0) == [540, 555]
    assert cells(540, 60, 0) == [540, 555, 570, 585]
    assert cells(540, 30, 15) == [540, 555, 570]


def test_weekday_sun0():
    # 2026-11-15 é domingo
    assert weekday_sun0("2026-11-15") == 0
    # 2026-11-16 é segunda
    assert weekday_sun0("2026-11-16") == 1


def test_agenda_range_ok():
    assert agenda_range_ok("2026-11-16", "2026-11-16")
    assert agenda_range_ok("2026-11-16", "2026-12-16")  # 30 dias
    assert not agenda_range_ok("2026-11-16", "2026-12-20")  # > 31 dias
    assert not agenda_range_ok("2026-11-16", "2026-11-15")  # end < date


def test_default_config_e_valid_config():
    cfg = default_config()
    assert cfg == DEFAULTS
    cfg["name"] = "Outro Nome"
    assert DEFAULTS["name"] == "fadeUp Barbearia"  # deepcopy, não muta default
    assert valid_config(default_config())


@pytest.mark.parametrize(
    "mutate",
    [
        lambda c: c.update(open=7),  # não múltiplo de 15
        lambda c: c.update(close=100000),  # > 1440
        lambda c: c.update(interval=10),  # inválido
        lambda c: c.update(days=[]),  # vazio
        lambda c: c.update(services=[]),  # vazio
    ],
)
def test_valid_config_rejeita(mutate):
    cfg = default_config()
    mutate(cfg)
    assert not valid_config(cfg)


def test_valid_config_rejeita_id_duplicado():
    cfg = default_config()
    cfg["services"][1]["id"] = cfg["services"][0]["id"]
    assert not valid_config(cfg)


def test_customer_normaliza_telefone():
    result = customer({"name": "Fulano", "phone": "(14) 99999-9999", "consent": True})
    assert result == {"name": "Fulano", "phone": "14999999999"}


def test_customer_valida_campos():
    with pytest.raises(ValidationError) as exc:
        customer({"name": "X", "phone": "abc", "consent": False})
    assert set(exc.value.fields.keys()) == {"name", "phone", "consent"}
