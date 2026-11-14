from pydantic import BaseModel, ConfigDict


class BookingCreateRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    service: str | None = None
    date: str
    start: int
    name: str | None = None
    phone: str | None = None
    consent: bool | None = None


class BlockCreateRequest(BaseModel):
    kind: str = "block"
    name: str
    date: str
    start: int
    duration: int


class MoveRequest(BaseModel):
    date: str
    start: int
