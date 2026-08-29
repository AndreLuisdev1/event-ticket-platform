from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db import close_db, init_db
from scr.routes.events import router as events_router
from scr.routes.seats import router as seats_router
from scr.routes.tickets import router as tickets_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_db()
    yield
    await close_db()


app = FastAPI(
    title="Projeto-1 - Plataforma de Eventos e Ingressos",
    description="API para Plataforma de Eventos e Ingressos",
    version="1.0.0",
    lifespan=lifespan,
)

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(events_router)
app.include_router(seats_router)
app.include_router(tickets_router)


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "Elite Dev API is running"}


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}