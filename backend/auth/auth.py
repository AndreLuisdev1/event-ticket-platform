from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone
from typing import Any
import jwt
import os


load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


def create_access_token(data: dict[str, Any]) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode["exp"] = expire
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


def verify_token(token: str) -> dict[str, Any]:
    try:
        return decode_token(token)
    except jwt.ExpiredSignatureError as exc:
        raise ValueError("Token expirado") from exc
    except jwt.InvalidTokenError as exc:
        raise ValueError("Token inválido") from exc