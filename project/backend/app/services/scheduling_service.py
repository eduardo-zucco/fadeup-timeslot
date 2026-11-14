import re
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

SAO_PAULO = ZoneInfo("America/Sao_Paulo")
OFFSET = timezone(timedelta(hours=-3))
_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def time_label(minutes: int) -> str:
    return f"{minutes // 60:02d}:{minutes % 60:02d}"


def today_in_sao_paulo(now: datetime | None = None) -> str:
    now = now or datetime.now(SAO_PAULO)
    return now.astimezone(SAO_PAULO).strftime("%Y-%m-%d")


def is_calendar_date(date: str) -> bool:
    if not isinstance(date, str) or not _DATE_RE.match(date):
        return False
    try:
        parsed = datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        return False
    return parsed.strftime("%Y-%m-%d") == date


def date_ok(date: str, now: datetime | None = None) -> bool:
    now = now or datetime.now(SAO_PAULO)
    if not is_calendar_date(date):
        return False
    last = today_in_sao_paulo(now + timedelta(days=90))
    return today_in_sao_paulo(now) <= date <= last


def agenda_range_ok(date: str, end: str) -> bool:
    if not is_calendar_date(date) or not is_calendar_date(end) or end < date:
        return False
    delta = datetime.strptime(end, "%Y-%m-%d") - datetime.strptime(date, "%Y-%m-%d")
    return delta <= timedelta(days=30)


def cells(start: int, duration: int, interval: int = 0) -> list[int]:
    count = -(-(duration + interval) // 15)
    return [start + index * 15 for index in range(count)]


def _slot_start_epoch(date: str, minute: int) -> datetime:
    base = datetime.strptime(date, "%Y-%m-%d").replace(tzinfo=OFFSET)
    return base + timedelta(minutes=minute)


def weekday_sun0(date: str) -> int:
    return (datetime.strptime(date, "%Y-%m-%d").weekday() + 1) % 7


def available(
    date: str,
    duration: int,
    config: dict,
    occupied: list[int] | None = None,
    now: datetime | None = None,
) -> list[int]:
    now = now or datetime.now(SAO_PAULO)
    occupied = occupied or []
    if not date_ok(date, now) or weekday_sun0(date) not in config["days"]:
        return []
    used = set(occupied)
    interval = config["interval"]
    slots: list[int] = []
    minute = config["open"]
    while minute + duration + interval <= config["close"]:
        if _slot_start_epoch(date, minute) > now.astimezone(OFFSET):
            if all(value not in used for value in cells(minute, duration, interval)):
                slots.append(minute)
        minute += 15
    return slots
