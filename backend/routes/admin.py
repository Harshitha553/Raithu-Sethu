from fastapi import APIRouter, Depends, HTTPException
from utils.decorators import require_admin
from utils.supabase_client import get_supabase

router = APIRouter()


# ── Dashboard Stats ──────────────────────────────────────
@router.get("/dashboard")
async def dashboard(_: dict = Depends(require_admin)):
    supabase = get_supabase()

    farmers = supabase.table("users").select("id", count="exact").eq("role", "farmer").execute()
    buyers = supabase.table("users").select("id", count="exact").eq("role", "buyer").execute()
    crops = supabase.table("crops").select("id", count="exact").eq("status", "active").execute()
    bookings = supabase.table("bookings").select("id", count="exact").execute()
    pending_bookings = supabase.table("bookings").select("id", count="exact").eq("status", "confirmed").execute()

    return {
        "total_farmers": farmers.count or 0,
        "total_buyers": buyers.count or 0,
        "active_crops": crops.count or 0,
        "total_bookings": bookings.count or 0,
        "pending_bookings": pending_bookings.count or 0,
    }


# ── Manage Farmers ───────────────────────────────────────
@router.get("/farmers")
async def get_farmers(_: dict = Depends(require_admin)):
    supabase = get_supabase()
    result = (
        supabase.table("users")
        .select("id, name, email, phone, location, is_verified, created_at")
        .eq("role", "farmer")
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


# ── Manage Buyers ────────────────────────────────────────
@router.get("/buyers")
async def get_buyers(_: dict = Depends(require_admin)):
    supabase = get_supabase()
    result = (
        supabase.table("users")
        .select("id, name, email, phone, company_name, is_verified, created_at")
        .eq("role", "buyer")
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


# ── Verify User ──────────────────────────────────────────
@router.put("/verify-user/{user_id}")
async def verify_user(user_id: str, _: dict = Depends(require_admin)):
    supabase = get_supabase()
    existing = supabase.table("users").select("id").eq("id", user_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="User not found")

    result = supabase.table("users").update({"is_verified": True}).eq("id", user_id).execute()
    return {"message": "User verified", "user": result.data[0]}


# ── Remove Listing ───────────────────────────────────────
@router.delete("/crops/{crop_id}")
async def remove_listing(crop_id: str, _: dict = Depends(require_admin)):
    supabase = get_supabase()
    existing = supabase.table("crops").select("id").eq("id", crop_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Crop not found")

    supabase.table("crops").delete().eq("id", crop_id).execute()
    return {"message": "Crop listing removed"}


# ── Analytics ────────────────────────────────────────────
@router.get("/analytics")
async def analytics(_: dict = Depends(require_admin)):
    supabase = get_supabase()

    # Revenue from completed bookings
    completed = supabase.table("bookings").select("total_price").eq("status", "completed").execute()
    total_revenue = sum(b["total_price"] for b in (completed.data or []))

    # Top crops by booking count
    all_bookings = supabase.table("bookings").select("crop_id, crops(name)").execute()
    crop_counts: dict = {}
    for b in all_bookings.data or []:
        name = b.get("crops", {}).get("name", "Unknown")
        crop_counts[name] = crop_counts.get(name, 0) + 1

    top_crops = sorted(crop_counts.items(), key=lambda x: x[1], reverse=True)[:10]

    # Flash sales count
    flash_sales = supabase.table("flash_sales").select("id", count="exact").execute()

    return {
        "total_revenue": round(total_revenue, 2),
        "completed_bookings": len(completed.data or []),
        "top_crops": [{"name": n, "bookings": c} for n, c in top_crops],
        "total_flash_sales": flash_sales.count or 0,
    }