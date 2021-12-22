from ipaddress import IPv4Address
from typing import Optional

from pydantic import BaseModel, constr
from sqlalchemy import Column, Integer, String, Table, func, select
from sqlalchemy.sql.schema import ForeignKey

from .base import db, metadata

domains = Table(
    "domains",
    metadata,
    Column("name", String, primary_key=True),
    Column("ipv4", String, nullable=False),
    Column("uid", Integer, ForeignKey("users.id"), nullable=False),
)


class DomainEdit(BaseModel):
    ipv4: IPv4Address


class DomainBase(DomainEdit):
    name: constr(min_length=3, max_length=20)

    async def create(self, uid: int) -> Optional["Domain"]:
        values = self.dict()
        values['ipv4'] = str(self.ipv4)

        if domain := await db.fetch_one(domains.insert().values(uid=uid, **values).returning(domains)):
            return Domain(**domain)


class Domain(DomainBase):
    uid: int

    async def edit(self, ipv4: str) -> Optional["Domain"]:
        query = domains.update().values(ipv4=ipv4).where(domains.c.name == self.name).returning(domains)
        if domain := await db.fetch_one(query):
            return Domain(**domain)

    async def delete(self) -> Optional["Domain"]:
        if domain := await db.fetch_one(domains.delete().where(domains.c.name == self.name).returning(domains)):
            return Domain(**domain)

    @staticmethod
    async def get(domain: str) -> Optional["Domain"]:
        if domain := await db.fetch_one(domains.select().where(domains.c.name == domain)):
            return Domain(**domain)

    @staticmethod
    async def get_all() -> list["Domain"]:
        """Return a list of all domains"""
        return [Domain(**d) for d in await db.fetch_all(domains.select())]

    @staticmethod
    async def get_from(uid: int) -> list[str]:
        """Return the list of domain owned by an user"""
        return [Domain(**d) for d in await db.fetch_all(domains.select().where(domains.c.uid == uid))]

    @staticmethod
    async def count(uid: int) -> int:
        """Return the number of domain owned by an user"""
        return await db.execute(select([func.count()]).select_from(domains).where(domains.c.uid == uid))
