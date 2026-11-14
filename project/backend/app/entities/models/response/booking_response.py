from pydantic import BaseModel


class BookingResponse(BaseModel):
    id: str
    name: str
    phone: str
    service: str
    price: int
    duration: int
    date: str
    start: int
    status: str
    kind: str
    token: str | None = None


class BookingCreatedResponse(BookingResponse):
    token: str
