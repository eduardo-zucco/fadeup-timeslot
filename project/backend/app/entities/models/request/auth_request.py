from pydantic import BaseModel


class AppTokenRequest(BaseModel):
    client_id: str
    client_secret: str


class AppRefreshRequest(BaseModel):
    refresh_token: str


class LoginRequest(BaseModel):
    email: str
    password: str


class UserRefreshRequest(BaseModel):
    refresh_token: str
