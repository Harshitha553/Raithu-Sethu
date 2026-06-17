from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ConversationCreate(BaseModel):
    participant_id: str  # the other user (farmer or buyer)


class ConversationOut(BaseModel):
    id: str
    participant_one_id: str
    participant_two_id: str
    last_message: Optional[str]
    updated_at: datetime
    created_at: datetime


class MessageOut(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    content: str
    is_read: bool
    created_at: datetime