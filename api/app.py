import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.models.base import db
from api.ovh import OVHRequest
from api.routers import acmerelay, auth, domains, users

app = FastAPI(title="Dodobox External API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(acmerelay.router)
app.include_router(auth.router)
app.include_router(domains.router)
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
    for key in ("API_DOMAIN_NAME", "OTP_SECRET", "SECRET_KEY"):
        if getattr(auth, key) is None:
            raise ValueError(f"{key!r} env variable is required but not set.")

    for key in ("APPLICATION_KEY", "APPLICATION_SECRET", "CONSUMER_KEY"):
        key = f"OVH_{key}"
        if getattr(OVHRequest, key) is None:
            raise ValueError(f"{key!r} env variable is required but not set.")


@app.on_event("shutdown")
async def shutdown():
    await db.disconnect()
