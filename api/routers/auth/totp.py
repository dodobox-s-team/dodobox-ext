from fastapi import HTTPException, status
from passlib.exc import MalformedTokenError, TokenError
from passlib.totp import TOTP

from .constant import API_DOMAIN_NAME, OTP_SECRET

__all__ = ["TotpFactory", "verify"]

TotpFactory: TOTP = TOTP.using(digits=6, issuer=API_DOMAIN_NAME, secrets={"1": OTP_SECRET})


def verify(totp: TOTP, code: str) -> bool:
    try:
        totp.match(code)
        # TODO: Prevent replay attacks using a cache
    except MalformedTokenError:
        # It should never happen thanks to pydantic validation
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Code malformé")
    except TokenError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Code 2FA invalide")

    return True
