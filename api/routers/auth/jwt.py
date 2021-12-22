import json
from datetime import datetime, timedelta
from typing import Optional, Union

from jose import JWTError, jwt

from .constant import ALGORITHM, SECRET_KEY

__all__ = ["TokenError", "InvalidToken", "ExpiredToken", "decode", "encode"]


class TokenError(Exception):
    """Base exception class for JWT-related errors."""


class InvalidToken(TokenError):
    """Raise when the JWT is invalid."""


class ExpiredToken(TokenError):
    """Raise when the JWT has expired."""


def encode(data: Union[str, dict], expire: Optional[int] = 15, requires_2fa: bool = False) -> str:
    """
    Creates a JWT token with an expire time.
    :param data: subject data. If the provided data is a dict, it will be encoded as json.
    :param expire: expire delta in minutes.
    :param requires_2fa: True if the user is not yet connected and
        requires a second factor for the full authentification.
    :return: a Json Web Token
    """
    if isinstance(data, dict):
        data = json.dumps(data)

    exp = datetime.max if expire is None else datetime.now() + timedelta(minutes=expire)
    data = {"sub": data, "exp": exp}
    if requires_2fa:
        data["2fa"] = True

    return jwt.encode(data, SECRET_KEY, ALGORITHM)


def decode(token: str) -> tuple[bool, str]:
    """
    Decode the provided JSON Web Token and return the subject.
    :param token: the JWT to decode
    :raises InvalidToken: The token is not valid
    :raises Expiredtoken: The token has expired
    :return: a tuple containing:
        - True if the user requires a 2fa
        - the JWT's subject
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if (expires := payload.get("exp")) is None or (subject := payload.get("sub")) is None:
            raise InvalidToken("This token is invalid.")

        if datetime.fromtimestamp(expires) < datetime.now():
            raise ExpiredToken("This token has expired.")
    except JWTError:
        raise InvalidToken("This token is invalid.")

    if payload.get("2fa", False):
        return True, subject

    return False, subject
