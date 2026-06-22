from datetime import datetime, timezone
from utils.supabase_client import get_supabase


def remove_expired_crops():
    """Mark crops past expiry_date as 'expired' and hide from marketplace."""
    supabase = get_supabase()
    now = datetime.now(timezone.utc).isoformat()

    result = (
        supabase.table("crops")
        .update({"status": "expired"})
        .eq("status", "active")
        .lt("expiry_date", now)
        .execute()
    )
    count = len(result.data) if result.data else 0
    print(f"[Scheduler] Expired {count} crop(s) at {now}")
    return count


def remove_expired_flash_sales():
    """Mark flash sales past their end_time as inactive so they disappear from all views."""
    supabase = get_supabase()
    now = datetime.now(timezone.utc).isoformat()

    result = (
        supabase.table("flash_sales")
        .update({"is_active": False})
        .eq("is_active", True)
        .lt("end_time", now)
        .execute()
    )
    count = len(result.data) if result.data else 0
    if count:
        print(f"[Scheduler] Deactivated {count} expired flash sale(s) at {now}")
    return count


def trigger_flash_sales():
    """Create flash sales for crops expiring within 24 hours."""
    from services.flash_sale_service import trigger_expiring_flash_sales
    count = trigger_expiring_flash_sales()
    print(f"[Scheduler] Created {count} flash sale(s)")
    return count


def run_all_hourly_jobs():
    remove_expired_crops()
    remove_expired_flash_sales()
    trigger_flash_sales()