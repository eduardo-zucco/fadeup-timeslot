from fastapi import APIRouter, status

router = APIRouter(prefix="/healthy_check", tags=["Healthy Check"])


@router.get("", status_code=status.HTTP_200_OK)
async def healthy_check():
    pass
