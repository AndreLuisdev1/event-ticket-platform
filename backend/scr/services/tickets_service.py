import hashlib
import uuid
from typing import Any

from scr.repository import tickets_repository


class TicketNotFoundError(Exception):
	pass


class SeatNotHeldError(Exception):
	pass


class TicketAlreadyUsedError(Exception):
	pass


class TicketCancelledError(Exception):
	pass


async def checkout_ticket(event_id: int, seat_id: int, user_id: int) -> dict[str, Any]:
	seat = await tickets_repository.find_seat_for_checkout(seat_id, event_id)
	if not seat:
		raise TicketNotFoundError("Assento não encontrado para este evento")
	if seat["status"] == "SOLD":
		raise SeatNotHeldError("Este assento já foi comprado por outro usuário")
	if seat["status"] != "HELD" or seat["held_by_user_id"] != user_id:
		raise SeatNotHeldError("Selecione e reserve este assento antes de finalizar a compra")

	if not await tickets_repository.mark_seat_sold(seat_id, user_id):
		raise SeatNotHeldError("O assento não está mais reservado por este usuário")

	ticket_code = f"TKT-{uuid.uuid4().hex[:10].upper()}"
	qr_code_hash = hashlib.sha256(
		f"{ticket_code}-{event_id}-{user_id}".encode()
	).hexdigest()
	ticket_id = await tickets_repository.create_ticket(
		event_id, seat_id, user_id, ticket_code, qr_code_hash
	)
	return {
		"message": "Compra confirmada com sucesso!",
		"ticket_id": ticket_id,
		"ticket_code": ticket_code,
		"qr_code_hash": qr_code_hash,
		"status": "VALID",
	}


async def list_user_tickets(user_id: int) -> list[dict[str, Any]]:
	return await tickets_repository.find_user_tickets(user_id)


async def get_ticket(ticket_id: int) -> dict[str, Any]:
	ticket = await tickets_repository.find_ticket_by_id(ticket_id)
	if not ticket:
		raise TicketNotFoundError("Ingresso não encontrado")
	return ticket


async def share_ticket(ticket_code: str) -> dict[str, Any]:
	ticket = await tickets_repository.find_ticket_to_share(ticket_code)
	if not ticket:
		raise TicketNotFoundError("Ingresso não encontrado")
	return ticket


async def validate_ticket(ticket_code: str) -> dict[str, str | None]:
	ticket = await tickets_repository.find_ticket_for_validation(ticket_code)
	if not ticket:
		raise TicketNotFoundError("QR Code inválido: Ingresso não encontrado no sistema")
	if ticket["status"] == "USED":
		raise TicketAlreadyUsedError(
			f"Este ingresso já foi utilizado ({ticket['user_name']} - Assento {ticket['seat_number']})"
		)
	if ticket["status"] == "CANCELLED":
		raise TicketCancelledError("Este ingresso foi cancelado e não permite entrada")
	if not await tickets_repository.mark_ticket_used(ticket["id"]):
		raise TicketAlreadyUsedError("Este ingresso já foi utilizado por outra validação")
	return {
		"status": "AUTHORIZED",
		"message": "Entrada Liberada!",
		"event": ticket["event_title"],
		"attendee": ticket["user_name"],
		"seat": ticket["seat_number"],
	}
