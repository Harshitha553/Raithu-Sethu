from datetime import datetime, timedelta, timezone
from utils.supabase_client import get_supabase


def get_suggested_price(crop_name: str) -> dict:
    """
    Calculate a suggested price based on recent completed bookings.
    Falls back to average listed price if no booking data.
    """
    supabase = get_supabase()
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()

    # Fetch recent bookings for this crop type
    bookings = (
        supabase.table("bookings")
        .select("total_price, quantity")
        .eq("crop_name", crop_name)
        .gte("created_at", thirty_days_ago)
        .eq("status", "completed")
        .execute()
    )

    if bookings.data:
        prices = [b["total_price"] / b["quantity"] for b in bookings.data if b["quantity"] > 0]
        avg_price = sum(prices) / len(prices)
        return {
            "crop_name": crop_name,
            "suggested_price": round(avg_price, 2),
            "basis": "completed_bookings",
            "data_points": len(prices),
        }

    # Fall back to active listings
    listings = (
        supabase.table("crops")
        .select("price_per_unit")
        .ilike("name", f"%{crop_name}%")
        .eq("status", "active")
        .execute()
    )

    if listings.data:
        prices = [l["price_per_unit"] for l in listings.data]
        avg_price = sum(prices) / len(prices)
        return {
            "crop_name": crop_name,
            "suggested_price": round(avg_price, 2),
            "basis": "active_listings",
            "data_points": len(prices),
        }

    return {"crop_name": crop_name, "suggested_price": None, "basis": "no_data", "data_points": 0}


def get_demand_trend(crop_name: str) -> dict:
    """
    Analyse request volume per week to determine demand trend.
    """
    supabase = get_supabase()
    now = datetime.now(timezone.utc)
    weeks = []

    for i in range(4):
        week_start = (now - timedelta(weeks=i + 1)).isoformat()
        week_end = (now - timedelta(weeks=i)).isoformat()
        result = (
            supabase.table("purchase_requests")
            .select("id", count="exact")
            .ilike("crop_name", f"%{crop_name}%")
            .gte("created_at", week_start)
            .lt("created_at", week_end)
            .execute()
        )
        weeks.append({"week": f"Week -{i + 1}", "requests": result.count or 0})

    weeks.reverse()

    # Simple trend: compare last week vs previous week
    if len(weeks) >= 2 and weeks[-2]["requests"] > 0:
        change = ((weeks[-1]["requests"] - weeks[-2]["requests"]) / weeks[-2]["requests"]) * 100
        trend = "rising" if change > 5 else "falling" if change < -5 else "stable"
    else:
        trend = "insufficient_data"
        change = 0

    return {
        "crop_name": crop_name,
        "trend": trend,
        "change_percent": round(change, 2),
        "weekly_data": weeks,
    }


def update_all_market_prices():
    """Called by the scheduler to refresh pricing data."""
    supabase = get_supabase()
    crops = supabase.table("crops").select("name").eq("status", "active").execute()
    unique_names = list({c["name"] for c in (crops.data or [])})
    for name in unique_names:
        get_suggested_price(name)  # triggers recalculation / caching if needed
    return len(unique_names)