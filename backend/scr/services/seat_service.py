from typing import Any

from scr.repository import seat_repository


class SeatNotFoundError(Exception):
    pass


class SeatUnavailableError(Exception):
    pass


class SeatReleaseNotAllowedError(Exception):
    pass


async def list_event_seats(event_id: int) -> list[dict[str, Any]]:
    await seat_repository.expire_held_seats(event_id)
    return await seat_repository.find_by_event(event_id)


async def hold_seat(seat_id: int, user_id: int) -> dict[str, Any]:
    seat = await seat_repository.find_by_id(seat_id)
    if not seat:
        raise SeatNotFoundError("Assento não encontrado")

    if not await seat_repository.hold_if_available(seat_id, user_id):
        raise SeatUnavailableError("Assento indisponível para reserva")

    updated_seat = await seat_repository.find_by_id(seat_id)
    return {
        "message": "Assento reservado temporariamente com sucesso",
        "seat_id": seat_id,
        "status": "HELD",
        "held_until": updated_seat["held_until"],
    }


async def release_seat(seat_id: int, user_id: int) -> dict[str, str | int]:
    seat = await seat_repository.find_by_id(seat_id)
    if not seat:
        raise SeatNotFoundError("Assento não encontrado")

    if seat["status"] != "HELD" or seat["held_by_user_id"] != user_id:
        raise SeatReleaseNotAllowedError("Você não pode liberar este assento")

    await seat_repository.release_for_user(seat_id, user_id)
    return {
        "message": "Assento liberado com sucesso",
        "seat_id": seat_id,
        "status": "AVAILABLE",
    }