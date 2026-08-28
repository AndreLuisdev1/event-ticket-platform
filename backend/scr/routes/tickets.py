from fastapi import APIRouter, HTTPException, Query, status

from scr.schemas.tickets import (
    TicketCheckoutRequest,
    TicketCheckoutResponse,
    TicketResponse,
    TicketShareResponse,
    TicketValidateRequest,
    TicketValidationResponse,
)
from scr.services.tickets_service import (
    SeatNotHeldError,
    TicketAlreadyUsedError,
    TicketCancelledError,
    TicketNotFoundError,
    checkout_ticket,
    get_ticket,
    list_user_tickets,
    share_ticket,
    validate_ticket,
)


router = APIRouter(prefix="/tickets", tags=["tickets"])


@router.post(
    "/checkout",
    response_model=TicketCheckoutResponse,
    status_code=status.HTTP_201_CREATED,
)
async def checkout(payload: TicketCheckoutRequest) -> TicketCheckoutResponse:
    try:
        return await checkout_ticket(payload.event_id, payload.seat_id, payload.user_id)
    except TicketNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except SeatNotHeldError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao processar compra do ingresso",
        ) from error


@router.get("/me", response_model=list[TicketResponse])
async def my_tickets(user_id: int = Query(gt=0)) -> list[TicketResponse]:
    try:
        return await list_user_tickets(user_id)
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao buscar ingressos",
        ) from error


@router.get("/share/{ticket_code}", response_model=TicketShareResponse)
async def shared_ticket(ticket_code: str) -> TicketShareResponse:
    try:
        return await share_ticket(ticket_code)
    except TicketNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao buscar ingresso compartilhado",
        ) from error


@router.get("/{ticket_id}", response_model=TicketResponse)
async def ticket_by_id(ticket_id: int) -> TicketResponse:
    try:
        return await get_ticket(ticket_id)
    except TicketNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao buscar ingresso",
        ) from error


@router.post("/validate", response_model=TicketValidationResponse)
async def validate(payload: TicketValidateRequest) -> TicketValidationResponse:
    try:
        return await validate_ticket(payload.ticket_code)
    except TicketNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except (TicketAlreadyUsedError, TicketCancelledError) as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao validar ingresso",
        ) from error