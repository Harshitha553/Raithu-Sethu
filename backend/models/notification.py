from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class NotificationOut(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    type: str  # crop_request | booking | flash_sale | requirement_match | system
    reference_id: Optional[str]
    is_read: bool
    created_at: datetime