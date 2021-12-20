from typing import Optional

from api.models import User, UserCreation, UserPass
from api.routers.auth import Code2FA, hash_password, is_connected
from api.routers.auth.login import is_connected_pass
from asyncpg.exceptions import UniqueViolationError
from fastapi import APIRouter, Depends, HTTPException, status

router = APIRouter(
    prefix="/users",
    tags=["users"],
)


@router.get("")
async def get_all() -> list[User]:
    """Return user's info"""
    return await User.get_all()


@router.get("/me")
async def me(user: User = Depends(is_connected)) -> User:
    """Return current user's info"""
    return user


@router.delete("/me")
async def delete_me(twofa: Optional[Code2FA], user: UserPass = Depends(is_connected_pass)) -> User:
    """Delete your user."""
    if user.totp is not None:
        if twofa is None or not twofa.verify(user):
            raise HTTPException(
                status.HTTP_401_UNAUTHORIZED,
                "Un code de double authentification valide est requis pour effecteur cette action",
            )

    return await user.delete()


@router.get("/{id}")
async def get_user(id: int) -> User:
    """Return a user's info from its id"""
    if user := await User.get(id):
        return user

    raise HTTPException(status.HTTP_404_NOT_FOUND, "Cet utilisateur n'existe pas.")


@router.post("/create")
async def create_account(user: UserCreation) -> User:
    try:
        user.password = hash_password(user.password)
        user = await user.create()
    except UniqueViolationError:
        raise HTTPException(status.HTTP_409_CONFLICT, "Ce nom d'utilisateur existe déjà.")

    return user