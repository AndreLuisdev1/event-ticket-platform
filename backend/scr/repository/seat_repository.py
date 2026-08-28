from typing import Any
from db import execute_update, fetch_all, fetch_one


async def expire_held_seats(event_id: int) -> None:
    await execute_update(
        """
        UPDATE seats
        SET status = 'AVAILABLE', held_by_user_id = NULL, held_until = NULL
        WHERE event_id = %s AND status = 'HELD'
          AND (held_until IS NULL OR held_until <= NOW())
        """,
        (event_id,),
    )


async def find_by_event(event_id: int) -> list[dict[str, Any]]:
    return await fetch_all(
        """
        SELECT id, event_id, seat_number, status, held_by_user_id, held_until
        FROM seats
        WHERE event_id = %s
        ORDER BY seat_number ASC
        """,
        (event_id,),
    )


async def find_by_id(seat_id: int) -> dict[str, Any] | None:
    return await fetch_one(
        """
        SELECT id, event_id, seat_number, status, held_by_user_id, held_until
        FROM seats
        WHERE id = %s
        """,
        (seat_id,),
    )


async def hold_if_available(seat_id: int, user_id: int) -> bool:
    affected_rows = await execute_update(
        """
        UPDATE seats
        SET status = 'HELD', held_by_user_id = %s,
            held_until = DATE_ADD(NOW(), INTERVAL 10 MINUTE)
        WHERE id = %s
          AND (
              status = 'AVAILABLE'
              OR (status = 'HELD' AND (held_until IS NULL OR held_until <= NOW()))
          )
        """,
        (user_id, seat_id),
    )
    return affected_rows == 1


async def release_for_user(seat_id: int, user_id: int) -> int:
    return await execute_update(
        """
        UPDATE seats
        SET status = 'AVAILABLE', held_by_user_id = NULL, held_until = NULL
        WHERE id = %s AND status = 'HELD' AND held_by_user_id = %s
        """,
        (seat_id, user_id),
    )