from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# ── Farmer ──────────────────────────────────────────────
class FarmerRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str
    location: str
    farm_size: Optional[float] = None


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