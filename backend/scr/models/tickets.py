from dataclasses import dataclass
from datetime import datetime


@dataclass
class Ticket:
	id: int
	event_id: int
	seat_id: int | None
	user_id: int
	ticket_code: str
	qr_code_hash: str
	status: str
	created_at: datetime
	used_at: datetime | None = None
