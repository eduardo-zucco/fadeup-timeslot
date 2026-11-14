import copy
import re

_SERVICE_ID_RE = re.compile(r"^[a-z0-9-]{1,30}$")
DURATIONS = [15, 30, 45, 60, 75, 90, 120]

DEFAULTS = {
    "name": "fadeUp Barbearia",
    "open": 540,
    "close": 1080,
    "interval": 0,
    "days": [1, 2, 3, 4, 5, 6],
    "services": [
        {"id": "corte", "name": "Corte", "price": 4000, "duration": 30},
        {"id": "barba", "name": "Barba", "price": 3000, "duration": 30},
        {"id": "combo", "name": "Corte + barba", "price": 6500, "duration": 60},
    ],
}


def default_config() -> dict:
    return copy.deepcopy(DEFAULTS)


def _is_int(value) -> bool:
    return isinstance(value, int) and not isinstance(value, bool)


def valid_config(config) -> bool:
    if not isinstance(config, dict):
        return False
    name = config.get("name")
    if not isinstance(name, str) or len(name.strip()) <= 1 or len(name) > 80:
        return False
    open_, close = config.get("open"), config.get("close")
    if not (_is_int(open_) and _is_int(close)):
        return False
    if not (0 <= open_ and close <= 1440 and open_ % 15 == 0 and close % 15 == 0 and close > open_):
        return False
    if config.get("interval") not in (0, 15, 30):
        return False
    days = config.get("days")
    if not isinstance(days, list) or len(days) == 0:
        return False
    if not all(_is_int(day) and 0 <= day <= 6 for day in days):
        return False
    services = config.get("services")
    if not isinstance(services, list) or not (1 <= len(services) <= 20):
        return False
    for service in services:
        if not isinstance(service, dict):
            return False
        sid = service.get("id")
        sname = service.get("name")
        price = service.get("price")
        duration = service.get("duration")
        if not isinstance(sid, str) or not _SERVICE_ID_RE.match(sid):
            return False
        if not isinstance(sname, str) or len(sname.strip()) <= 1 or len(sname) > 80:
            return False
        if not _is_int(price) or price < 0 or price > 1_000_000:
            return False
        if duration not in DURATIONS:
            return False
    ids = [service["id"] for service in services]
    if len(set(ids)) != len(ids):
        return False
    return True
