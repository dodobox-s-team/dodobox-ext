import os

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

from api.models import User

TOKEN_EXPIRE_MINUTES = int(os.getenv("TOKEN_EXPIRE_MINUTES", 15))
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

cryptctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TokenModel(BaseModel):
    access_token: str
    token_type = "bearer"


async def is_connected(token: str = Depends(OAuth2PasswordBearer(tokenUrl="/token"))):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if (username := payload.get("sub")) is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    if (user := await User.get(username)) is None:
        raise credentials_exception

    return user
