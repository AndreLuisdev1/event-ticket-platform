from datetime import datetime

from pydantic import BaseModel, Field


class TicketCheckoutRequest(BaseModel):
	event_id: int = Field(gt=0)
	seat_id: int = Field(gt=0)
	user_id: int = Field(gt=0)


class TicketResponse(BaseModel):
	id: int
	event_id: int
	seat_id: int | None
	user_id: int
	ticket_code: str
	status: str
	created_at: datetime
	used_at: datetime | None = None
	event_title: str
	event_date: datetime
	event_location: str
	seat_number: str | None = None
	user_name: str


class TicketCheckoutResponse(BaseModel):
	message: str
	ticket_id: int
	ticket_code: str
	qr_code_hash: str
	status: str


class TicketValidateRequest(BaseModel):
	ticket_code: str = Field(min_length=1)


class TicketShareResponse(BaseModel):
	ticket_code: str
	status: str
	event_title: str
	event_date: datetime
	event_location: str
	seat_number: str | None = None


class TicketValidationResponse(BaseModel):
	status: str
	message: str
	event: str
	attendee: str
	seat: str | None = None
