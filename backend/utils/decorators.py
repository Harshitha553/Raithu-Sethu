from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from services.auth_service import decode_token

bearer_scheme = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
    token = credentials.credentials
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    return payload


def require_farmer(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "farmer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Farmers only")
    return current_user


def require_buyer(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "buyer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Buyers only")
    return current_user


def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admins only")
    return current_user