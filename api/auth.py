import os

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"


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
        if not payload.get("valid", False):
            raise credentials_exception
    except JWTError:
        raise credentials_exception
