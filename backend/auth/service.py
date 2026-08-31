from passlib.context import CryptContext
from auth.auth import create_access_token
from auth.repository import create_user, get_user_by_email, get_user_by_id

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserAlreadyExistsError(Exception):
    pass


class InvalidCredentialsError(Exception):
    pass


class UserNotFoundError(Exception):
    pass


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)


async def register_user(name: str, email: str, password: str, role: str = "CLIENT") -> dict:
    existing_user = await get_user_by_email(email)

    if existing_user:
        raise UserAlreadyExistsError("Usuário já cadastrado")

    hashed_password = hash_password(password)
    user_id = await create_user(name=name, email=email, password=hashed_password, role=role)

    user = await get_user_by_id(user_id)
    if user is None:
        raise UserNotFoundError("Usuário não encontrado após cadastro")

    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"]
    }


async def login_user(email: str, password: str) -> dict:
    user = await get_user_by_email(email)

    if not user:
        raise InvalidCredentialsError("Credenciais inválidas")

    if not verify_password(password, user["password"]):
        raise InvalidCredentialsError("Credenciais inválidas")

    token = create_access_token({"sub": str(user["id"]), "email": user["email"], "role": user["role"]})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        },
    }