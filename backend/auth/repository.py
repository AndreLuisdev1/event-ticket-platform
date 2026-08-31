from typing import Any
from db import execute_query, fetch_one


async def get_user_by_email(email: str) -> dict[str, Any] | None:
    return await fetch_one(
        """
        SELECT id, name, email, password, role, created_at
        FROM users
        WHERE email = %s
        """,
        (email)
    )


async def get_user_by_id(user_id: int) -> dict[str, Any] | None:
    return await fetch_one(
        """
        SELECT id, name, email, password, role, created_at
        FROM users
        WHERE id = %s
        """,
        (user_id)
    )


async def create_user(name: str, email: str, password: str, role: str = "CLIENT") -> int:
    return await execute_query(
        """
        INSERT INTO users (name, email, password, role)
        VALUES (%s, %s, %s, %s)
        """,
        (name, email, password, role)
    )