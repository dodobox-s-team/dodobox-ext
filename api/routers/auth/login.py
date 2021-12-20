from api.models import User, UserPass
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from pydantic import BaseModel

from . import jwt

__all__ = ["oauth2_scheme", "cryptctx", "TokenModel", "hash_password", "is_connected_pass", "is_connected"]

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth")
cryptctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TokenModel(BaseModel):
    access_token: str
    requires_2fa: bool
    token_type: str = "bearer"


def hash_password(password: str) -> str:
    return cryptctx.hash(password)


async def is_connected_pass(token: str = Depends(oauth2_scheme)) -> UserPass:
    try:
        req_2fa, username = jwt.decode(token)
        if not req_2fa and (user := await UserPass.get(username)) is not None:
            return user
    except jwt.TokenError:
        pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def is_connected(user: UserPass = Depends(is_connected_pass)) -> User:
    return User(**user.dict())
