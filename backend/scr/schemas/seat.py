from datetime import datetime

from pydantic import BaseModel, Field


class SeatResponse(BaseModel):
    id: int
    event_id: int
    seat_number: str
    status: str
    held_by_user_id: int | None = None
    held_until: datetime | None = None


class SeatHoldRequest(BaseModel):
    seat_id: int = Field(gt=0)
    user_id: int = Field(gt=0)


class SeatHoldResponse(BaseModel):
    message: str
    seat_id: int
    status: str
    held_until: datetime | None = None


class SeatReleaseResponse(BaseModel):
    message: str
    seat_id: int
    status: str