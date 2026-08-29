from typing import Any

from scr.repository import events_repository


class EventNotFoundError(Exception):
    pass


async def list_events() -> list[dict[str, Any]]:
    return await events_repository.list_events()


async def list_events_by_organizer(organizer_id: int) -> list[dict[str, Any]]:
    return await events_repository.list_by_organizer(organizer_id)


async def get_event(event_id: int) -> dict[str, Any]:
    event = await events_repository.get_by_id(event_id)
    if not event:
        raise EventNotFoundError("Evento não encontrado")
    return event


async def create_event(payload: dict[str, Any]) -> dict[str, Any]:
    event_id = await events_repository.create_event(
        title=payload["title"],
        description=payload.get("description"),
        date=payload["date"],
        location=payload["location"],
        price=payload["price"],
        capacity=payload["capacity"],
        organizer_id=payload["organizer_id"],
        tmdb_id=payload.get("tmdb_id"),
        poster_url=payload.get("poster_url"),
    )
    return await get_event(event_id)


async def update_event(event_id: int, payload: dict[str, Any]) -> dict[str, Any]:
    existing_event = await events_repository.get_by_id(event_id)
    if not existing_event:
        raise EventNotFoundError("Evento não encontrado")

    if not payload:
        return existing_event

    await events_repository.update_event(event_id, payload)
    return await get_event(event_id)


async def delete_event(event_id: int) -> dict[str, Any]:
    event = await events_repository.get_by_id(event_id)
    if not event:
        raise EventNotFoundError("Evento não encontrado")

    await events_repository.delete_event(event_id)
    return {
        "message": "Evento removido com sucesso",
        "event_id": event_id,
    }
