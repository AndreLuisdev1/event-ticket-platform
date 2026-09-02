from typing import Literal
from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(min_length=6)
    role: Literal["CLIENT", "ORGANIZER"] = "CLIENT"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class UserPublicResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublicResponse
