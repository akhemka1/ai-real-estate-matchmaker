from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class APIMessage(BaseModel):
    message: str


class PaginatedResponse(BaseModel, Generic[T]):
    data: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)
