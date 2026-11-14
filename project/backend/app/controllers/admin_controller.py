from fastapi import APIRouter, Body, Depends, status

from app.controllers.middleware.headers import require_user
from app.dependencies.usecase.agenda_dependencies import get_agenda_usecase, get_config_usecase

from app.entities.models.response.booking_response import BookingCreatedResponse
from app.entities.models.response.common_response import (
    AgendaResponse,
    OkResponse,
    SessionResponse,
    SlotsResponse,
)
from app.interfaces.entities.agenda.agenda_usecase_interface import IAgendaUsecase
from app.interfaces.entities.config.config_usecase_interface import IConfigUsecase

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"],
    dependencies=[Depends(require_user)],
)


@router.get("/session", status_code=status.HTTP_200_OK, response_model=SessionResponse)
async def session() -> dict:
    return {"authenticated": True}


@router.get("/config", status_code=status.HTTP_200_OK)
async def get_config(config_usecase: IConfigUsecase = Depends(get_config_usecase)) -> dict:
    return await config_usecase.get_config()


@router.put("/config", status_code=status.HTTP_200_OK, response_model=OkResponse)
async def update_config(
    body: dict = Body(...),
    config_usecase: IConfigUsecase = Depends(get_config_usecase),
) -> dict:
    await config_usecase.update_config(body)
    return {"ok": True}


@router.get("/agenda", status_code=status.HTTP_200_OK, response_model=AgendaResponse)
async def list_agenda(
    date: str,
    end: str | None = None,
    agenda_usecase: IAgendaUsecase = Depends(get_agenda_usecase),
) -> dict:
    return {"records": await agenda_usecase.list_agenda(date, end or date)}


@router.get("/slots", status_code=status.HTTP_200_OK, response_model=SlotsResponse)
async def list_slots(
    date: str,
    duration: int,
    agenda_usecase: IAgendaUsecase = Depends(get_agenda_usecase),
) -> dict:
    return {"slots": await agenda_usecase.list_slots(date, None, duration, operator=True)}


@router.post("/bookings", status_code=status.HTTP_201_CREATED, response_model=BookingCreatedResponse)
async def create_booking(
    body: dict = Body(...),
    agenda_usecase: IAgendaUsecase = Depends(get_agenda_usecase),
) -> dict:
    return await agenda_usecase.create_booking(body, operator=True)


@router.delete("/bookings/{booking_id}", status_code=status.HTTP_200_OK, response_model=OkResponse)
async def cancel_booking(
    booking_id: str,
    agenda_usecase: IAgendaUsecase = Depends(get_agenda_usecase),
) -> dict:
    await agenda_usecase.cancel_booking(booking_id, None, operator=True)
    return {"ok": True}
