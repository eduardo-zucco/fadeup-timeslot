from fastapi import APIRouter, Depends, status

from app.controllers.middleware.headers import require_app
from app.dependencies.usecase.agenda_dependencies import get_config_usecase
from app.entities.models.response.config_response import ConfigResponse
from app.interfaces.entities.config.config_usecase_interface import IConfigUsecase

router = APIRouter(prefix="/api/config", tags=["Config"], dependencies=[Depends(require_app)])


@router.get("", status_code=status.HTTP_200_OK, response_model=ConfigResponse)
async def get_config(config_usecase: IConfigUsecase = Depends(get_config_usecase)) -> dict:
    return await config_usecase.get_config()
