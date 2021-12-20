import json

from api.models import User, UserPass
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, constr

from . import jwt, totp
from .constant import TOKEN_EXPIRE_MINUTES
from .login import TokenModel, cryptctx, is_connected, is_connected_pass, oauth2_scheme

__all__ = ["router"]

router = APIRouter(
    prefix="/auth",
    tags=["security"],
)


def login(user: User, expires: int = TOKEN_EXPIRE_MINUTES, req_2fa: bool = False) -> TokenModel:
    return TokenModel(access_token=jwt.encode(user.username, expires, requires_2fa=req_2fa), requires_2fa=req_2fa)


class Create2FA(BaseModel):
    uri: str
    token: str


class Code2FA(BaseModel):
    code: constr(regex=r"^\d{6}$")  # noqa: F722

    def verify(self, user: UserPass) -> bool:
        otp = totp.TotpFactory.from_json(user.totp)
        return totp.verify(otp, self.code)


class Validate2FA(Code2FA):
    token: str


@router.post("", response_model=TokenModel)
async def authenticate(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await UserPass.get(form_data.username)
    if user is None or not cryptctx.verify(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.totp is not None:
        result = login(user, expires=20, req_2fa=True)

        # This is a hack to allow 2FA authentication in swagger ui
        # Set `Client credentials location` to `request body` then put your TOTP code in the `client_id` field
        # This should be only allowed in the dev environnement
        if form_data.client_id is not None:
            return await verify_2fa(Code2FA(code=form_data.client_id), result.access_token)

        return result

    return login(user)


@router.get("/2fa/new")
async def new_2fa(user: User = Depends(is_connected)):
    otp = totp.TotpFactory.new()
    uri = otp.to_uri(label=user.username)

    # The token expires in 20 minutes
    return Create2FA(uri=uri, token=jwt.encode({"uri": uri, "uid": user.id}, 20))


@router.post("/2fa/enable")
async def enable_2fa(twofa: Validate2FA, user: UserPass = Depends(is_connected_pass)):
    try:
        data = json.loads(jwt.decode(twofa.token)[1])
    except jwt.TokenError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, str(e))

    if data.get("uid") != user.id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token invalide")

    if user.totp is not None:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "L'authentification à double facteur est déjà activée sur ce compte."
        )

    otp = totp.TotpFactory.from_uri(data.get("uri"))
    if totp.verify(otp, twofa.code):
        # Enable 2FA on this account
        await user.enable_2fa(otp.to_json())


@router.post("/2fa/disable")
async def disable_2fa(twofa: Code2FA, user: UserPass = Depends(is_connected_pass)):
    if user.totp is None:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "L'authentification à double facteur n'est déjà activée sur ce compte."
        )

    if twofa.verify(user):
        # Disable 2FA on this account
        await user.disable_2fa()


@router.post("/2fa/verify")
async def verify_2fa(twofa: Code2FA, token: str = Depends(oauth2_scheme)):
    try:
        req_2fa, username = jwt.decode(token)
        if not req_2fa or (user := await UserPass.get(username)) is None:
            raise jwt.TokenError("Wrong State")
    except jwt.TokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if twofa.verify(user):
        return login(user)
