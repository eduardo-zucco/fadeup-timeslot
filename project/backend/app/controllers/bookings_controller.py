from fastapi import APIRouter, Depends, status

from app.controllers.middleware.headers import booking_token, require_app
from app.dependencies.usecase.agenda_dependencies import get_agenda_usecase
from app.entities.models.request.booking_request import BookingCreateRequest, MoveRequest
from app.entities.models.response.booking_response import BookingCreatedResponse, BookingResponse
from app.entities.models.response.common_response import OkResponse, SlotsResponse
from app.interfaces.entities.agenda.agenda_usecase_interface import IAgendaUsecase

router = APIRouter(prefix="/api", tags=["Bookings"], dependencies=[Depends(require_app)])


@router.get("/slots", status_code=status.HTTP_200_OK, response_model=SlotsResponse)
async def list_slots(
    date: str,
    service: str,
    agenda_usecase: IAgendaUsecase = Depends(get_agenda_usecase),
) -> dict:
    return {"slots": await agenda_usecase.list_slots(date, service, None, operator=False)}


@router.post("/bookings", status_code=status.HTTP_201_CREATED, response_model=BookingCreatedResponse)
async def create_booking(
    body: BookingCreateRequest,
    agenda_usecase: IAgendaUsecase = Depends(get_agenda_usecase),
) -> dict:
    return await agenda_usecase.create_booking(body.model_dump(), operator=False)


@router.get("/bookings/{booking_id}", status_code=status.HTTP_200_OK, response_model=BookingResponse)
async def get_booking(
    booking_id: str,
    token: str | None = Depends(booking_token),
    agenda_usecase: IAgendaUsecase = Depends(get_agenda_usecase),
) -> dict:
    return await agenda_usecase.get_booking(booking_id, token, operator=False)


@router.get("/bookings/{booking_id}/slots", status_code=status.HTTP_200_OK, response_model=SlotsResponse)
async def booking_slots(
    booking_id: str,
    date: str,
    token: str | None = Depends(booking_token),
    agenda_usecase: IAgendaUsecase = Depends(get_agenda_usecase),
) -> dict:
    return {"slots": await agenda_usecase.booking_slots(booking_id, date, token, operator=False)}


@router.patch("/bookings/{booking_id}", status_code=status.HTTP_200_OK, response_model=OkResponse)
async def move_booking(
    booking_id: str,
    body: MoveRequest,
    token: str | None = Depends(booking_token),
    agenda_usecase: IAgendaUsecase = Depends(get_agenda_usecase),
) -> dict:
    await agenda_usecase.move_booking(booking_id, body.model_dump(), token, operator=False)
    return {"ok": True}


@router.delete("/bookings/{booking_id}", status_code=status.HTTP_200_OK, response_model=OkResponse)
async def cancel_booking(
    booking_id: str,
    token: str | None = Depends(booking_token),
    agenda_usecase: IAgendaUsecase = Depends(get_agenda_usecase),
) -> dict:
    await agenda_usecase.cancel_booking(booking_id, token, operator=False)
    return {"ok": True}
