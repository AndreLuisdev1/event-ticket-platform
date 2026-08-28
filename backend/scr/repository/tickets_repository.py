from typing import Any

from db import execute_query, execute_update, fetch_all, fetch_one


TICKET_DETAILS_QUERY = """
	SELECT t.id, t.event_id, t.seat_id, t.user_id, t.ticket_code,
		   t.status, t.created_at, t.used_at,
		   e.title AS event_title, e.date AS event_date,
		   e.location AS event_location, s.seat_number,
		   u.name AS user_name
	FROM tickets t
	JOIN events e ON t.event_id = e.id
	LEFT JOIN seats s ON t.seat_id = s.id
	JOIN users u ON t.user_id = u.id
"""


async def find_seat_for_checkout(seat_id: int, event_id: int) -> dict[str, Any] | None:
	await execute_update(
		"""
		UPDATE seats
		SET status = 'AVAILABLE', held_by_user_id = NULL, held_until = NULL
		WHERE id = %s AND status = 'HELD'
		  AND (held_until IS NULL OR held_until <= NOW())
		""",
		(seat_id,),
	)
	return await fetch_one(
		"""
		SELECT id, status, held_by_user_id
		FROM seats
		WHERE id = %s AND event_id = %s
		""",
		(seat_id, event_id),
	)


async def mark_seat_sold(seat_id: int, user_id: int) -> bool:
	affected_rows = await execute_update(
		"""
		UPDATE seats
		SET status = 'SOLD', held_by_user_id = NULL, held_until = NULL
		WHERE id = %s AND status = 'HELD' AND held_by_user_id = %s
		""",
		(seat_id, user_id),
	)
	return affected_rows == 1


async def create_ticket(
	event_id: int,
	seat_id: int,
	user_id: int,
	ticket_code: str,
	qr_code_hash: str,
) -> int:
	return await execute_query(
		"""
		INSERT INTO tickets
			(event_id, seat_id, user_id, ticket_code, qr_code_hash, status)
		VALUES (%s, %s, %s, %s, %s, 'VALID')
		""",
		(event_id, seat_id, user_id, ticket_code, qr_code_hash),
	)


async def find_user_tickets(user_id: int) -> list[dict[str, Any]]:
	return await fetch_all(
		TICKET_DETAILS_QUERY + " WHERE t.user_id = %s ORDER BY t.created_at DESC",
		(user_id,),
	)


async def find_ticket_by_id(ticket_id: int) -> dict[str, Any] | None:
	return await fetch_one(TICKET_DETAILS_QUERY + " WHERE t.id = %s", (ticket_id,))


async def find_ticket_to_share(ticket_code: str) -> dict[str, Any] | None:
	return await fetch_one(
		"""
		SELECT t.ticket_code, t.status, e.title AS event_title,
			   e.date AS event_date, e.location AS event_location,
			   s.seat_number
		FROM tickets t
		JOIN events e ON t.event_id = e.id
		LEFT JOIN seats s ON t.seat_id = s.id
		WHERE t.ticket_code = %s
		""",
		(ticket_code,),
	)


async def find_ticket_for_validation(ticket_code: str) -> dict[str, Any] | None:
	return await fetch_one(
		"""
		SELECT t.id, t.status, t.ticket_code, e.title AS event_title,
			   s.seat_number, u.name AS user_name
		FROM tickets t
		JOIN events e ON t.event_id = e.id
		LEFT JOIN seats s ON t.seat_id = s.id
		JOIN users u ON t.user_id = u.id
		WHERE t.ticket_code = %s OR t.qr_code_hash = %s
		""",
		(ticket_code, ticket_code),
	)


async def mark_ticket_used(ticket_id: int) -> bool:
	affected_rows = await execute_update(
		"""
		UPDATE tickets
		SET status = 'USED', used_at = NOW()
		WHERE id = %s AND status = 'VALID'
		""",
		(ticket_id,),
	)
	return affected_rows == 1