from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class EventCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(None, max_length=1000)
    date: datetime
    location: str = Field(min_length=1, max_length=255)
    price: float = Field(gt=0, le=999999.99)
    capacity: int = Field(gt=0, le=10000)
    tmdb_id: int | None = None
    poster_url: str | None = Field(None, max_length=500)
    
    @field_validator("date")
    @classmethod
    def validate_date_future(cls, v):
        if v <= datetime.now():
            raise ValueError("Data do evento deve ser no futuro")
        return v
    
    @field_validator("title", "location")
    @classmethod
    def validate_not_only_spaces(cls, v):
        if v and not v.strip():
            raise ValueError("Campo não pode conter apenas espaços")
        return v


class EventUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(None, max_length=1000)
    date: datetime | None = None
    location: str | None = Field(default=None, min_length=1, max_length=255)
    price: float | None = Field(default=None, gt=0, le=999999.99)
    capacity: int | None = Field(default=None, gt=0, le=10000)
    tmdb_id: int | None = None
    poster_url: str | None = Field(None, max_length=500)
    
    @field_validator("date")
    @classmethod
    def validate_date_future(cls, v):
        if v and v <= datetime.now():
            raise ValueError("Data do evento deve ser no futuro")
        return v
    
    @field_validator("title", "location")
    @classmethod
    def validate_not_only_spaces(cls, v):
        if v and not v.strip():
            raise ValueError("Campo não pode conter apenas espaços")
        return v


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
