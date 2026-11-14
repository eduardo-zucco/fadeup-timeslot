from enum import Enum


class BookingKind(str, Enum):
    APPOINTMENT = "appointment"
    BLOCK = "block"
