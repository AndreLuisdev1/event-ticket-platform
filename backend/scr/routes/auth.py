from fastapi import APIRouter, Depends, HTTPException, status
from auth.dependencies import get_current_user
from auth.service import (
    InvalidCredentialsError,
    UserAlreadyExistsError,
    login_user,
    register_user,
)
from auth.schemas import LoginRequest, RegisterRequest, TokenResponse, UserPublicResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserPublicResponse, status_code=status.HTTP_201_CREATED)
async def register_route(payload: RegisterRequest):
    try:
        return await register_user(
            name=payload.name,
            email=str(payload.email),
            password=payload.password,
            role=payload.role
        )
    except UserAlreadyExistsError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc)
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao registrar usuário"
        ) from exc


@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def login_route(payload: LoginRequest):
    try:
        return await login_user(email=str(payload.email), password=payload.password)
    except InvalidCredentialsError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc)
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao autenticar usuário",
        ) from exc


@router.get("/me", response_model=UserPublicResponse, status_code=status.HTTP_200_OK)
async def me_route(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "name": current_user["name"],
        "email": current_user["email"],
        "role": current_user["role"]
    }
