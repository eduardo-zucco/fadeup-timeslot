from fastapi import APIRouter, Depends, status

from app.dependencies.usecase.auth_dependencies import get_auth_usecase
from app.entities.models.request.auth_request import (
    AppRefreshRequest,
    AppTokenRequest,
    LoginRequest,
    UserRefreshRequest,
)
from app.entities.models.response.auth_response import AppTokenResponse, UserTokenResponse
from app.usecases.auth_usecase import AuthUsecase

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/app-token", status_code=status.HTTP_200_OK, response_model=AppTokenResponse)
async def app_token(body: AppTokenRequest, usecase: AuthUsecase = Depends(get_auth_usecase)) -> dict:
    return await usecase.app_token(body.client_id, body.client_secret)


@router.post("/app-refresh", status_code=status.HTTP_200_OK, response_model=AppTokenResponse)
async def app_refresh(body: AppRefreshRequest, usecase: AuthUsecase = Depends(get_auth_usecase)) -> dict:
    return await usecase.app_refresh(body.refresh_token)


@router.post("/login", status_code=status.HTTP_200_OK, response_model=UserTokenResponse)
async def login(body: LoginRequest, usecase: AuthUsecase = Depends(get_auth_usecase)) -> dict:
    return await usecase.login(body.email, body.password)


@router.post("/refresh", status_code=status.HTTP_200_OK, response_model=UserTokenResponse)
async def refresh(body: UserRefreshRequest, usecase: AuthUsecase = Depends(get_auth_usecase)) -> dict:
    return await usecase.user_refresh(body.refresh_token)
