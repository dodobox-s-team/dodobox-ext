import traceback

from aiohttp import ClientResponseError, ClientSession
from api import ovh
from api.models.domain import Domain
from api.ovh import get_session
from api.routers.auth import jwt
from api.routers.auth.login import oauth2_scheme
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, constr

router = APIRouter(
    prefix="/acmerelay",
    tags=["acmerelay"],
)


class Record(BaseModel):
    subdomain: constr(regex=r'[_0-9a-z](?:[-_0-9a-z]{0,61}[_0-9a-z])?')  # noqa: F722
    target: str
    ttl: int


def is_connected_acme(token: str = Depends(oauth2_scheme)) -> str:
    try:
        _, domain = jwt.decode(token)
        return domain
    except jwt.TokenError:
        pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


@router.post("")
async def add_record(
    record: Record,
    session: ClientSession = Depends(get_session),
    scope: str = Depends(is_connected_acme)
):
    domain = await Domain.get(record.subdomain)
    if domain is None or domain.name != scope:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Ce nom de domaine ne vous appartient pas.")

    try:
        await ovh.add_record(session, record.subdomain, record.target, record.ttl, "TXT")
    except ClientResponseError:
        traceback.print_exc()
        return {"success": False}

    return {"success": True}


@router.delete("")
async def delete_record(
    subdomain: str,
    session: ClientSession = Depends(get_session),
    scope: str = Depends(is_connected_acme)
):
    if subdomain != scope:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Ce nom de domaine ne vous appartient pas.")

    try:
        await ovh.delete_record(session, subdomain, "TXT")
    except ClientResponseError:
        traceback.print_exc()
        return {"success": False}

    return {"sucess": True}
