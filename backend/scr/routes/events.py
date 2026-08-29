from fastapi import APIRouter, HTTPException, status

from scr.schemas.events import EventCreateRequest, EventResponse, EventUpdateRequest
from scr.services.events_services import (
    EventNotFoundError,
    create_event,
    delete_event,
    get_event,
    list_events,
    list_events_by_organizer,
    update_event,
)


router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=list[EventResponse], status_code=status.HTTP_200_OK)
async def all_events() -> list[EventResponse]:
    try:
        return await list_events()
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao buscar eventos",
        ) from error


@router.get("/organizer/{organizer_id}", response_model=list[EventResponse], status_code=status.HTTP_200_OK)
async def events_by_organizer(organizer_id: int) -> list[EventResponse]:
    try:
        return await list_events_by_organizer(organizer_id)
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao buscar eventos do organizador",
        ) from error


@router.get("/{event_id}", response_model=EventResponse, status_code=status.HTTP_200_OK)
async def event_by_id(event_id: int) -> EventResponse:
    try:
        return await get_event(event_id)
    except EventNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao buscar evento",
        ) from error


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event_route(payload: EventCreateRequest) -> EventResponse:
    try:
        return await create_event(payload.model_dump())
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao criar evento",
        ) from error


@router.put("/{event_id}", response_model=EventResponse, status_code=status.HTTP_200_OK)
async def update_event_route(event_id: int, payload: EventUpdateRequest) -> EventResponse:
    try:
        return await update_event(event_id, payload.model_dump(exclude_unset=True, exclude_none=True))
    except EventNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao atualizar evento",
        ) from error


@router.delete("/{event_id}", status_code=status.HTTP_200_OK)
async def delete_event_route(event_id: int) -> dict[str, str | int]:
    try:
        return await delete_event(event_id)
    except EventNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao remover evento",
        ) from error
