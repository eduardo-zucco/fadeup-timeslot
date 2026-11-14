from pydantic import BaseModel

from app.entities.models.response.booking_response import BookingResponse


class SlotsResponse(BaseModel):
    slots: list[int]


class AgendaResponse(BaseModel):
    records: list[BookingResponse]


class OkResponse(BaseModel):
    ok: bool = True


class SessionResponse(BaseModel):
    authenticated: bool = True
