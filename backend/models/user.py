from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime


def _require_non_blank(v: str, field_label: str) -> str:
    """Reject empty/whitespace-only values for required string fields; trim valid ones."""
    if v is None or not v.strip():
        raise ValueError(f"{field_label} cannot be empty or contain only spaces")
    return v.strip()


def _clean_optional(v: Optional[str]) -> Optional[str]:
    """For optional string fields: trim, and treat whitespace-only as not provided (None)."""
    if v is None:
        return None
    v = v.strip()
    return v or None


# ── Farmer ──────────────────────────────────────────────
class FarmerRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str
    location: str
    farm_size: Optional[float] = None

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, v):
        return _require_non_blank(v, "Name")

    @field_validator("phone")
    @classmethod
    def phone_must_not_be_blank(cls, v):
        return _require_non_blank(v, "Phone")

    @field_validator("location")
    @classmethod
    def location_must_not_be_blank(cls, v):
        return _require_non_blank(v, "Location")


class FarmerLogin(BaseModel):
    email: EmailStr
    password: str


class FarmerProfile(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    location: str
    farm_size: Optional[float]
    is_verified: bool
    created_at: datetime


# ── Buyer ────────────────────────────────────────────────
class BuyerRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str
    company_name: Optional[str] = None

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, v):
        return _require_non_blank(v, "Name")

    @field_validator("phone")
    @classmethod
    def phone_must_not_be_blank(cls, v):
        return _require_non_blank(v, "Phone")

    @field_validator("company_name")
    @classmethod
    def company_name_clean(cls, v):
        return _clean_optional(v)


class BuyerLogin(BaseModel):
    email: EmailStr
    password: str


class BuyerProfile(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    company_name: Optional[str]
    is_verified: bool
    created_at: datetime


# ── Password Reset ───────────────────────────────────────
class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str