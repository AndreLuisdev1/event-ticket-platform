from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class TicketCheckoutRequest(BaseModel):
    event_id: int = Field(gt=0)
    seat_id: int = Field(gt=0)
    
    @field_validator("event_id", "seat_id")
    @classmethod
    def validate_positive_ids(cls, v):
        if v <= 0:
            raise ValueError("ID deve ser um número positivo")
        return v


class TicketResponse(BaseModel):
	id: int
	event_id: int
	seat_id: int | None
	user_id: int
	ticket_code: str
	qr_code_hash: str
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
    ticket_code: str = Field(min_length=1, max_length=255)
    
    @field_validator("ticket_code")
    @classmethod
    def validate_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Código do ticket não pode ser vazio")
        return v


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
