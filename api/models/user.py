from typing import Optional, Union

from pydantic import BaseModel, EmailStr, constr
from sqlalchemy import Column, Integer, String, Table, select

from .base import db, metadata

users = Table(
    "users",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("email", String(320), nullable=False),
    Column("username", String(20), unique=True, nullable=False),
    Column("password", String, nullable=False),
)


class UserBase(BaseModel):
    email: EmailStr
    username: constr(min_length=3, max_length=20)


class UserCreation(UserBase):
    password: constr()

    async def create(user: "UserCreation") -> "User":
        """
        Create a new user in the database.
        Raise `asyncpg.UniqueViolationError` if the username already exists.
        """
        query = users.insert().values(**user.dict()).returning(users.c.id, users.c.email, users.c.username)
        return User(**await db.fetch_one(query))


class User(UserBase):
    id: int

    async def delete(self) -> Optional["User"]:
        if user := await db.fetch_one(users.delete().where(users.c.id == self.id).returning(users)):
            return User(**user)

    @staticmethod
    async def get(username_or_id: Union[int, str]) -> Optional["User"]:
        query = select(users.c.id, users.c.email, users.c.username).select_from(users)
        if isinstance(username_or_id, int):
            query = query.where(users.c.id == username_or_id)
        elif isinstance(username_or_id, str):
            query = query.where(users.c.username == username_or_id)
        else:
            raise TypeError(f"must be int or str, not {type(username_or_id)}")

        if user := await db.fetch_one(query):
            return User(**user)

    @staticmethod
    async def get_all() -> list["User"]:
        """Return a list of all users"""
        return [User(**u) for u in await db.fetch_all(users.select())]


class UserPass(User, UserCreation):
    @staticmethod
    async def get(username: str) -> "UserPass":
        if user := await db.fetch_one(users.select().where(users.c.username == username)):
            return UserPass(**user)
