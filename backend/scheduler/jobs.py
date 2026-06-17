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


def trigger_flash_sales():
    """Create flash sales for crops expiring within 24 hours."""
    from services.flash_sale_service import trigger_expiring_flash_sales
    count = trigger_expiring_flash_sales()
    print(f"[Scheduler] Created {count} flash sale(s)")
    return count


def update_market_prices():
    """Recalculate dynamic pricing data for all active crops."""
    from services.pricing_service import update_all_market_prices
    count = update_all_market_prices()
    print(f"[Scheduler] Updated prices for {count} crop type(s)")
    return count


def run_all_hourly_jobs():
    remove_expired_crops()
    trigger_flash_sales()
    update_market_prices()