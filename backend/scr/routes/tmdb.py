from fastapi import APIRouter, Depends, HTTPException, Query, status

from auth.dependencies import get_current_organizer
from scr.schemas.tmdb import MovieResponse, NowPlayingResponse
from scr.services.tmdb import TmdbError, now_playing_movies, search_movies

router = APIRouter(prefix="/tmdb", tags=["tmdb"])


@router.get("/now-playing", response_model=NowPlayingResponse, status_code=status.HTTP_200_OK)
async def now_playing(page: int = Query(default=1, ge=1),_: dict = Depends(get_current_organizer)) -> dict:
    try:
        return await now_playing_movies(page)
    except TmdbError as error:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(error)) from error


@router.get("/search", response_model=list[MovieResponse], status_code=status.HTTP_200_OK)
async def search(
    query: str = Query(min_length=1, max_length=100),
    _: dict = Depends(get_current_organizer),
) -> list[dict]:
    try:
        return await search_movies(query.strip())
    except TmdbError as error:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(error)) from error