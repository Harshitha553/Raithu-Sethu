from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ── Purchase Request (Buyer → Farmer) ────────────────────
class PurchaseRequestCreate(BaseModel):
    crop_id: str
    quantity: float
    message: Optional[str] = None
    proposed_price: Optional[float] = None


class PurchaseRequestOut(BaseModel):
    id: str
    crop_id: str
    buyer_id: str
    farmer_id: str
    quantity: float
    message: Optional[str]
    proposed_price: Optional[float]
    status: str  # pending | accepted | rejected
    created_at: datetime


# ── Buyer Requirement (Buyer posts what they need) ────────
class BuyerRequirementCreate(BaseModel):
    crop_name: str
    category: str
    quantity: float
    unit: str
    max_price: float
    location: Optional[str] = None
    required_by: Optional[datetime] = None
    description: Optional[str] = None


class BuyerRequirementUpdate(BaseModel):
    quantity: Optional[float] = None
    max_price: Optional[float] = None
    required_by: Optional[datetime] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class BuyerRequirementOut(BaseModel):
    id: str
    buyer_id: str
    crop_name: str
    category: str
    quantity: float
    unit: str
    max_price: float
    location: Optional[str]
    required_by: datetime
    description: Optional[str]
    is_active: bool
    created_at: datetime


# ── Farmer Response to Requirement ───────────────────────
class RequirementResponseCreate(BaseModel):
    requirement_id: str
    crop_id: str
    offered_price: float
    message: Optional[str] = None