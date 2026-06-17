import uuid
from datetime import datetime, timedelta, timezone
from utils.supabase_client import get_supabase
from services.notification_service import notify_flash_sale


def create_flash_sale_for_crop(crop: dict, discount: float = 20.0) -> dict:
    """Create a flash sale entry for an expiring crop."""
    supabase = get_supabase()
    now = datetime.now(timezone.utc)
    sale = {
        "id": str(uuid.uuid4()),
        "crop_id": crop["id"],
        "discount_percentage": discount,
        "start_time": now.isoformat(),
        "end_time": crop["expiry_date"],
        "is_active": True,
        "created_at": now.isoformat(),
    }
    result = supabase.table("flash_sales").insert(sale).execute()

    # Notify all buyers
    buyers = supabase.table("users").select("id").eq("role", "buyer").execute()
    buyer_ids = [b["id"] for b in (buyers.data or [])]
    notify_flash_sale(buyer_ids, crop["name"], discount, sale["id"])

    return result.data[0] if result.data else sale


def trigger_expiring_flash_sales():
    """
    Called hourly by the scheduler.
    Find crops expiring within 24 hours with no active flash sale → create one.
    """
    supabase = get_supabase()
    now = datetime.now(timezone.utc)
    in_24h = (now + timedelta(hours=24)).isoformat()

    expiring = (
        supabase.table("crops")
        .select("*")
        .eq("status", "active")
        .lte("expiry_date", in_24h)
        .gte("expiry_date", now.isoformat())
        .execute()
    )

    created = 0
    for crop in expiring.data or []:
        # Check if flash sale already exists
        existing = (
            supabase.table("flash_sales")
            .select("id")
            .eq("crop_id", crop["id"])
            .eq("is_active", True)
            .execute()
        )
        if not existing.data:
            create_flash_sale_for_crop(crop)
            created += 1

    return created