import uuid
from datetime import datetime, timedelta

from app.services.scheduling_service import OFFSET, time_label


def notifications(booking: dict, types: list[str], now_iso: str) -> list[dict]:
    records = []
    for kind in types:
        if kind == "reminder":
            start = datetime.strptime(
                f"{booking['date']} {time_label(booking['start'])}", "%Y-%m-%d %H:%M"
            ).replace(tzinfo=OFFSET)
            scheduled = (start - timedelta(hours=2)).astimezone().isoformat()
        else:
            scheduled = now_iso
        records.append(
            {
                "id": str(uuid.uuid4()),
                "booking": booking["id"],
                "type": kind,
                "created": now_iso,
                "scheduled": scheduled,
            }
        )
    return records
