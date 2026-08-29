from datetime import datetime

from pydantic import BaseModel, Field


class EventCreateRequest(BaseModel):
    title: str = Field(min_length=1)
    description: str | None = None
    date: datetime
    location: str = Field(min_length=1)
    price: float = Field(gt=0)
    capacity: int = Field(gt=0)
    tmdb_id: int | None = None
    poster_url: str | None = None
    organizer_id: int = Field(gt=0)


class EventUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1)
    description: str | None = None
    date: datetime | None = None
    location: str | None = Field(default=None, min_length=1)
    price: float | None = Field(default=None, gt=0)
    capacity: int | None = Field(default=None, gt=0)
    tmdb_id: int | None = None
    poster_url: str | None = None
    organizer_id: int | None = Field(default=None, gt=0)


class EventResponse(BaseModel):
    id: int
    title: str
    description: str | None = None
    date: datetime
    location: str
    price: float
    capacity: int
    tmdb_id: int | None = None
    poster_url: str | None = None
    organizer_id: int
    created_at: datetime | None = None
