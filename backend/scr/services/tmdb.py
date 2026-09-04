import os
from typing import Any

import httpx

from dotenv import load_dotenv

load_dotenv()

TMDB_API_KEY = os.getenv("TMDB_API_KEY")
TMDB_BASE_URL = "https://api.themoviedb.org/3"
IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"


class TmdbError(Exception):
	pass


def _map_movie(item: dict[str, Any]) -> dict[str, Any]:
	poster_path = item.get("poster_path")
	return {
		"tmdb_id": item.get("id"),
		"title": item.get("title", "Sem título"),
		"overview": item.get("overview"),
		"release_date": item.get("release_date"),
		"vote_average": item.get("vote_average"),
		"poster_url": f"{IMAGE_BASE_URL}{poster_path}" if poster_path else None,
	}


async def _get_movies(endpoint: str, params: dict[str, str | int]) -> dict[str, Any]:
	if not TMDB_API_KEY:
		raise TmdbError("TMDB_API_KEY não configurada")

	try:
		async with httpx.AsyncClient(timeout=10) as client:
			response = await client.get(endpoint, params=params)
			response.raise_for_status()
			return response.json()
	except (httpx.HTTPError, ValueError) as error:
		raise TmdbError("Falha ao consultar o TMDb") from error


async def now_playing_movies(page: int = 1) -> dict[str, Any]:
	data = await _get_movies(
		f"{TMDB_BASE_URL}/movie/now_playing",
		{"api_key": TMDB_API_KEY or "", "language": "pt-BR", "region": "BR", "page": page},
	)
	return {
		"results": [_map_movie(item) for item in data.get("results", [])],
		"page": data.get("page", page),
		"total_pages": data.get("total_pages", page),
	}


async def search_movies(query: str) -> list[dict[str, Any]]:
	data = await _get_movies(
		f"{TMDB_BASE_URL}/search/movie",
		{"api_key": TMDB_API_KEY or "", "language": "pt-BR", "query": query},
	)
	return [_map_movie(item) for item in data.get("results", [])]

