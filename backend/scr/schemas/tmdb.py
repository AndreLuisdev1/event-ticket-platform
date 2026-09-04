from pydantic import BaseModel


class MovieResponse(BaseModel):
    tmdb_id: int
    title: str
    overview: str | None = None
    release_date: str | None = None
    vote_average: float | None = None
    poster_url: str | None = None


class NowPlayingResponse(BaseModel):
    results: list[MovieResponse]
    page: int
    total_pages: int
