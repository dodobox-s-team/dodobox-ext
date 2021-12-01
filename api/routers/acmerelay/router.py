from aiohttp import ClientResponseError, ClientSession
from api.auth import is_connected
from api.routers.acmerelay.request import OVH_API_BASE_URL, get_session
from fastapi import APIRouter, Depends
from pydantic import BaseModel, constr

router = APIRouter(
    prefix="/acmerelay",
    tags=["acmerelay"],
)


class Record(BaseModel):
    subdomain: constr(regex=r'[_0-9a-z](?:[-_0-9a-z]{0,61}[_0-9a-z])?')  # noqa: F722
    target: str
    ttl: int


@router.post("/", dependencies=[Depends(is_connected)])
async def add_record(record: Record, session: ClientSession = Depends(get_session)):
    data = {
        "fieldType": "TXT",
        "subDomain": record.subdomain,
        "target": record.target,
        "ttl": record.ttl
    }

    try:
        async with session.post(f'{OVH_API_BASE_URL}/domain/zone/dodobox.site/record', json=data) as r:
            r.raise_for_status()
            async with session.post(f'{OVH_API_BASE_URL}/domain/zone/dodobox.site/refresh') as r:
                r.raise_for_status()
    except ClientResponseError:
        return {"success": False}

    return {"success": True}


@router.delete("/", dependencies=[Depends(is_connected)])
async def delete_record(subdomain: str, session: ClientSession = Depends(get_session)):
    data = {
        "fieldType": "TXT",
        "subDomain": subdomain,
    }

    try:
        async with session.get(f'{OVH_API_BASE_URL}/domain/zone/dodobox.site/record', json=data) as r:
            for id_ in await r.json():
                async with session.delete(f'{OVH_API_BASE_URL}/domain/zone/dodobox.site/record/{id_}') as r:
                    r.raise_for_status()

            async with session.post(f'{OVH_API_BASE_URL}/domain/zone/dodobox.site/refresh') as r:
                r.raise_for_status()
    except ClientResponseError:
        return {"success": False}

    return {"sucess": True}
