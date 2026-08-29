from dataclasses import dataclass
from datetime import datetime


@dataclass
class Event:
    id: int
    title: str
    description: str | None
    date: datetime
    location: str
    price: float
    capacity: int
    tmdb_id: int | None = None
    poster_url: str | None = None
    organizer_id: int = 0
    created_at: datetime | None = None
