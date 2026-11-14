from pydantic import BaseModel


class AppTokenResponse(BaseModel):
    access_token: str
    refresh_token: str


class UserTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    userId: int
