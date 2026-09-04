import asyncio
import sys

from auth.repository import create_user, get_user_by_email
from auth.service import hash_password
from db import close_db, init_db


SEED_USERS = (
    {
        "name": "Cliente Demo",
        "email": "cliente.demo@cinepass.local",
        "password": "Cliente@123",
        "role": "CLIENT",
    },
    {
        "name": "Organizador Demo",
        "email": "organizador.demo@cinepass.local",
        "password": "Organizador@123",
        "role": "ORGANIZER",
    },
)


async def seed_users() -> None:
    await init_db()
    try:
        for user in SEED_USERS:
            existing_user = await get_user_by_email(user["email"])
            if existing_user:
                print(f"Usuário já existe: {user['email']}")
                continue

            await create_user(
                name=user["name"],
                email=user["email"],
                password=hash_password(user["password"]),
                role=user["role"],
            )
            print(f"Usuário criado: {user['email']} ({user['role']})")
    finally:
        await close_db()


if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

    asyncio.run(seed_users())