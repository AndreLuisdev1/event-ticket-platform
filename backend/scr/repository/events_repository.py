from typing import Any

from db import execute_query, execute_update, fetch_all, fetch_one


async def list_events() -> list[dict[str, Any]]:
    return await fetch_all(
        """
        SELECT id, title, description, date, location, price, capacity,
               tmdb_id, poster_url, organizer_id, created_at
        FROM events
        ORDER BY date ASC
        """
    )


async def list_by_organizer(organizer_id: int) -> list[dict[str, Any]]:
    return await fetch_all(
        """
        SELECT id, title, description, date, location, price, capacity,
               tmdb_id, poster_url, organizer_id, created_at
        FROM events
        WHERE organizer_id = %s
        ORDER BY date ASC
        """,
        (organizer_id,),
    )


async def get_by_id(event_id: int) -> dict[str, Any] | None:
    return await fetch_one(
        """
        SELECT id, title, description, date, location, price, capacity,
               tmdb_id, poster_url, organizer_id, created_at
        FROM events
        WHERE id = %s
        """,
        (event_id,),
    )


async def create_event(
    title: str,
    description: str | None,
    date,
    location: str,
    price: float,
    capacity: int,
    organizer_id: int,
    tmdb_id: int | None,
    poster_url: str | None,
) -> int:
    return await execute_query(
        """
        INSERT INTO events (
            title, description, date, location, price, capacity,
            tmdb_id, poster_url, organizer_id
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (title, description, date, location, price, capacity, tmdb_id, poster_url, organizer_id),
    )


async def create_event_seats(event_id: int, capacity: int) -> None:
    for seat_number in range(1, capacity + 1):
        await execute_query(
            """
            INSERT INTO seats (event_id, seat_number, status)
            VALUES (%s, %s, 'AVAILABLE')
            """,
            (event_id, str(seat_number)),
        )


async def update_event(event_id: int, data: dict[str, Any]) -> int:
    if not data:
        return 0

    set_clauses = [f"{key} = %s" for key in data.keys()]
    values = list(data.values())
    values.append(event_id)

    query = f"""
        UPDATE events
        SET {', '.join(set_clauses)}
        WHERE id = %s
    """
    return await execute_update(query, tuple(values))


async def delete_event(event_id: int) -> int:
    return await execute_update(
        "DELETE FROM events WHERE id = %s",
        (event_id,),
    )
