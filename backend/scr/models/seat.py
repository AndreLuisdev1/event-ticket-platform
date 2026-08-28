from dataclasses import dataclass
from datetime import datetime


@dataclass
class Seat:
    id: int
    event_id: int
    seat_number: str
    status: str
    held_by_user_id: int | None = None
    held_until: datetime | None = None