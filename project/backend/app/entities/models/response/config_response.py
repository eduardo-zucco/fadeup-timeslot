from pydantic import BaseModel


class ServiceModel(BaseModel):
    id: str
    name: str
    price: int
    duration: int


class ConfigResponse(BaseModel):
    name: str
    open: int
    close: int
    interval: int
    days: list[int]
    services: list[ServiceModel]
