import asyncio
from datetime import datetime, timedelta

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from jose import jwt

from api.auth import ALGORITHM, SECRET_KEY, TOKEN_EXPIRE_MINUTES, TokenModel, cryptctx
from api.models import UserPass
from api.models.base import db
from api.routers import acmerelay, users
from api.routers.acmerelay.request import OVHRequest

app = FastAPI(title="Dodobox External API")
app.include_router(acmerelay.router)
app.include_router(users.router)


@app.on_event("startup")
async def startup():
    exception = None
    for retries in range(5):
        try:
            await db.connect()
            break
        except ConnectionRefusedError as e:
            exception = e
            backoff = 2 ** retries / 10
            print(f"Couldn't connect to the database. Retrying in {backoff}s.")
            await asyncio.sleep(backoff)
    else:
        raise exception

    # Check for ENV variables. If one is missing, prevent from starting.
    if SECRET_KEY is None:
        raise ValueError("'SECRET_KEY' env variable is not set. Use `os.urandom(32)` to create a strong key.")

    for key in ("APPLICATION_KEY", "APPLICATION_SECRET", "CONSUMER_KEY"):
        key = f"OVH_{key}"
        if getattr(OVHRequest, key) is None:
            raise ValueError(f'{key!r} env variable is required but not set.')


@app.on_event("shutdown")
async def shutdown():
    await db.disconnect()


@app.post("/token", tags=["security"], response_model=TokenModel)
async def create_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await UserPass.get(form_data.username)
    if user is None or not cryptctx.verify(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    expire = datetime.now() + timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    data = {"sub": user.username, "exp": expire}
    return {"access_token": jwt.encode(data, SECRET_KEY, ALGORITHM)}
