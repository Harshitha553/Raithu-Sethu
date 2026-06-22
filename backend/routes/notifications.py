from fastapi import APIRouter, Depends, HTTPException
from utils.decorators import get_current_user
from utils.supabase_client import get_supabase

router = APIRouter()


# ── Get Notifications ────────────────────────────────────
@router.get("")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    result = (
        supabase.table("notifications")
        .select("*")
        .eq("user_id", current_user["sub"])
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


# ── Mark All Notifications as Read ──────────────────────
@router.put("/read-all")
async def mark_all_read(current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    supabase.table("notifications").update({"is_read": True}).eq("user_id", current_user["sub"]).eq("is_read", False).execute()
    return {"message": "All notifications marked as read"}


# ── Mark Single Notification as Read ────────────────────
@router.put("/{notification_id}/read")
async def mark_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    existing = (
        supabase.table("notifications")
        .select("id")
        .eq("id", notification_id)
        .eq("user_id", current_user["sub"])
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Notification not found")

    result = (
        supabase.table("notifications")
        .update({"is_read": True})
        .eq("id", notification_id)
        .execute()
    )
    return result.data[0]