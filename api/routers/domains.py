import traceback

from aiohttp import ClientResponseError, ClientSession
from api.models import Domain, User
from api.models.domain import DomainBase, DomainEdit
from api.ovh import add_record, delete_record, edit_record, get_session
from api.routers.auth import jwt
from api.routers.auth.login import is_connected
from asyncpg.exceptions import UniqueViolationError
from fastapi import APIRouter, Depends, HTTPException, status

router = APIRouter(
    prefix="/domains",
    tags=["domains"],
)


@router.get("", response_model=list[Domain])
async def get_all() -> list[Domain]:
    """Return the list of all domains"""
    return await Domain.get_all()


@router.post("/create", response_model=Domain)
async def create_domain(
    domain: DomainBase, user: User = Depends(is_connected), session: ClientSession = Depends(get_session)
) -> Domain:
    if (await Domain.count(user.id)) >= 3:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Nombre maximal de domaines atteint.")

    subdomain = domain.name.removesuffix(".dodobox.site")
    if not domain.name.endswith(".dodobox.site") or "." in subdomain:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Nom de domaine invalide.")

    # Denylist
    if subdomain in ["api", "local", "www"]:
        raise HTTPException(status.HTTP_409_CONFLICT, "Ce nom de domaine existe déjà.")

    try:
        # Add a DNS record for the newly added subdomain
        await add_record(session, domain.name.split(".", 1)[0], str(domain.ipv4))
    except ClientResponseError:
        traceback.print_exc()
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR, "Une erreur est survenue lors de la modification DNS"
        )

    try:
        domain = await domain.create(user.id)
    except UniqueViolationError:
        raise HTTPException(status.HTTP_409_CONFLICT, "Ce nom de domaine existe déjà.")

    return domain


@router.get("/{name}/token")
async def get_token(name: str, user: User = Depends(is_connected)):
    domain = await Domain.get(name)
    if domain.uid != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Ce nom de domaine ne vous appartient pas.")

    return {"token": jwt.encode(domain.name, None)}


@router.put("/{name}", response_model=Domain)
async def edit_domain(
    name: str, edit: DomainEdit, user: User = Depends(is_connected), session: ClientSession = Depends(get_session)
) -> Domain:
    domain = await Domain.get(name)
    if domain.uid != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Ce nom de domaine ne vous appartient pas.")

    try:
        # Edit the DNS record
        await edit_record(session, domain.name.split(".", 1)[0], str(edit.ipv4))
    except ClientResponseError:
        traceback.print_exc()
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR, "Une erreur est survenue lors de la modification DNS"
        )

    return await domain.edit(str(edit.ipv4))


@router.delete("/{name}", response_model=Domain)
async def delete_domain(
    name: str, user: User = Depends(is_connected), session: ClientSession = Depends(get_session)
) -> Domain:
    domain = await Domain.get(name)
    if domain.uid != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Ce nom de domaine ne vous appartient pas.")

    try:
        # Delete the DNS record
        await delete_record(session, domain.name.split(".", 1)[0])
    except ClientResponseError:
        traceback.print_exc()
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR, "Une erreur est survenue lors de la modification DNS"
        )

    return await domain.delete()
