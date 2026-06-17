import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from models.chat import ConversationCreate
from utils.decorators import get_current_user
from utils.supabase_client import get_supabase

router = APIRouter()


# ── Create Conversation ──────────────────────────────────
@router.post("/conversation", status_code=status.HTTP_201_CREATED)
async def create_conversation(body: ConversationCreate, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    uid = current_user["sub"]
    other_id = body.participant_id

    # Check if conversation already exists between these two users
    existing = (
        supabase.table("conversations")
        .select("*")
        .or_(
            f"and(participant_one_id.eq.{uid},participant_two_id.eq.{other_id}),"
            f"and(participant_one_id.eq.{other_id},participant_two_id.eq.{uid})"
        )
        .execute()
    )
    if existing.data:
        return existing.data[0]

    conv = {
        "id": str(uuid.uuid4()),
        "participant_one_id": uid,
        "participant_two_id": other_id,
        "last_message": None,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = supabase.table("conversations").insert(conv).execute()
    return result.data[0]


# ── Get Conversations ────────────────────────────────────
@router.get("/conversations")
async def get_conversations(current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    uid = current_user["sub"]
    result = (
        supabase.table("conversations")
        .select("*")
        .or_(f"participant_one_id.eq.{uid},participant_two_id.eq.{uid}")
        .order("updated_at", desc=True)
        .execute()
    )
    return result.data or []


# ── Get Messages ─────────────────────────────────────────
@router.get("/messages/{conversation_id}")
async def get_messages(conversation_id: str, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    uid = current_user["sub"]

    # Verify user is part of the conversation
    conv = supabase.table("conversations").select("*").eq("id", conversation_id).execute()
    if not conv.data:
        raise HTTPException(status_code=404, detail="Conversation not found")

    c = conv.data[0]
    if c["participant_one_id"] != uid and c["participant_two_id"] != uid:
        raise HTTPException(status_code=403, detail="Access denied")

    messages = (
        supabase.table("messages")
        .select("*")
        .eq("conversation_id", conversation_id)
        .order("created_at")
        .execute()
    )

    # Mark messages as read
    supabase.table("messages").update({"is_read": True}).eq("conversation_id", conversation_id).neq("sender_id", uid).execute()

    return messages.data or []