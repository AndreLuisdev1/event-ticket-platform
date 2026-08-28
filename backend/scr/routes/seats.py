from fastapi import APIRouter, HTTPException, status

from scr.schemas.seat import (
	SeatHoldRequest,
	SeatHoldResponse,
	SeatReleaseResponse,
	SeatResponse,
)
from scr.services.seat_service import (
	SeatNotFoundError,
	SeatReleaseNotAllowedError,
	SeatUnavailableError,
	hold_seat,
	list_event_seats,
	release_seat,
)


router = APIRouter(tags=["seats"])


@router.get(
	"/events/{event_id}/seats",
	response_model=list[SeatResponse],
	status_code=status.HTTP_200_OK,
)
async def get_event_seats(event_id: int) -> list[SeatResponse]:
	try:
		return await list_event_seats(event_id)
	except Exception as error:
		raise HTTPException(
			status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
			detail="Erro interno ao buscar assentos do evento",
		) from error


@router.post(
	"/seats/hold",
	response_model=SeatHoldResponse,
	status_code=status.HTTP_200_OK,
)
async def hold_event_seat(payload: SeatHoldRequest) -> SeatHoldResponse:
	try:
		return await hold_seat(payload.seat_id, payload.user_id)
	except SeatNotFoundError as error:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
	except SeatUnavailableError as error:
		raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
	except Exception as error:
		raise HTTPException(
			status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
			detail="Erro interno ao bloquear assento",
		) from error


@router.post(
	"/seats/release",
	response_model=SeatReleaseResponse,
	status_code=status.HTTP_200_OK,
)
async def release_event_seat(payload: SeatHoldRequest) -> SeatReleaseResponse:
	try:
		return await release_seat(payload.seat_id, payload.user_id)
	except SeatNotFoundError as error:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
	except SeatReleaseNotAllowedError as error:
		raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error)) from error
	except Exception as error:
		raise HTTPException(
			status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
			detail="Erro interno ao liberar assento",
		) from error
