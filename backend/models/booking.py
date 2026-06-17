from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class BookingCreate(BaseModel):
    crop_id: str
    quantity: float
    delivery_address: str
    delivery_date: datetime
    payment_method: Optional[str] = "cod"


class BookingOut(BaseModel):
    id: str
    crop_id: str
    buyer_id: str
    farmer_id: str
    quantity: float
    total_price: float
    delivery_address: str
    delivery_date: datetime
    payment_method: str
    status: str  # pending | confirmed | completed | cancelled
    created_at: datetime