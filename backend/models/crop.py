from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CropCreate(BaseModel):
    name: str
    category: str
    quantity: float
    unit: str
    price_per_unit: float
    description: Optional[str] = None
    location: str
    harvest_date: datetime
    expiry_date: datetime
    images: Optional[list[str]] = []


class CropUpdate(BaseModel):
    name: Optional[str] = None
    quantity: Optional[float] = None
    price_per_unit: Optional[float] = None
    description: Optional[str] = None
    expiry_date: Optional[datetime] = None
    status: Optional[str] = None  # active | sold | expired


class CropOut(BaseModel):
    id: str
    farmer_id: str
    name: str
    category: str
    quantity: float
    unit: str
    price_per_unit: float
    description: Optional[str]
    location: str
    harvest_date: datetime
    expiry_date: datetime
    status: str
    images: Optional[list[str]]
    created_at: datetime


# ── Flash Sale ───────────────────────────────────────────
class FlashSaleCreate(BaseModel):
    crop_id: str
    discount_percentage: float
    start_time: datetime
    end_time: datetime


class FlashSaleUpdate(BaseModel):
    discount_percentage: Optional[float] = None
    end_time: Optional[datetime] = None
    is_active: Optional[bool] = None


class FlashSaleOut(BaseModel):
    id: str
    crop_id: str
    discount_percentage: float
    start_time: datetime
    end_time: datetime
    is_active: bool
    created_at: datetime