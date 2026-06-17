import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from models.booking import BookingCreate
from utils.decorators import require_buyer, get_current_user
from utils.supabase_client import get_supabase

router = APIRouter()


# ── Create Booking ───────────────────────────────────────
@router.post("", status_code=status.HTTP_201_CREATED)
async def create_booking(body: BookingCreate, current_user: dict = Depends(require_buyer)):
    supabase = get_supabase()

    crop = supabase.table("crops").select("*").eq("id", body.crop_id).eq("status", "active").execute()
    if not crop.data:
        raise HTTPException(status_code=404, detail="Crop not found or unavailable")

    c = crop.data[0]
    if body.quantity > c["quantity"]:
        raise HTTPException(status_code=400, detail="Requested quantity exceeds available stock")

    total_price = body.quantity * c["price_per_unit"]
    booking = {
        "id": str(uuid.uuid4()),
        "crop_id": body.crop_id,
        "buyer_id": current_user["sub"],
        "farmer_id": c["farmer_id"],
        "quantity": body.quantity,
        "total_price": total_price,
        "delivery_address": body.delivery_address,
        "delivery_date": body.delivery_date.isoformat(),
        "payment_method": body.payment_method,
        "status": "confirmed",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = supabase.table("bookings").insert(booking).execute()

    # Reduce crop quantity
    new_qty = c["quantity"] - body.quantity
    new_status = "sold" if new_qty <= 0 else "active"
    supabase.table("crops").update({"quantity": new_qty, "status": new_status}).eq("id", body.crop_id).execute()

    return result.data[0]


# ── My Bookings ──────────────────────────────────────────
@router.get("")
async def get_bookings(current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    role = current_user.get("role")
    uid = current_user["sub"]

    query = supabase.table("bookings").select("*, crops(*)")
    if role == "buyer":
        query = query.eq("buyer_id", uid)
    elif role == "farmer":
        query = query.eq("farmer_id", uid)

    result = query.order("created_at", desc=True).execute()
    return result.data or []


# ── Booking Details ──────────────────────────────────────
@router.get("/{booking_id}")
async def get_booking_details(booking_id: str, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    result = supabase.table("bookings").select("*, crops(*)").eq("id", booking_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking = result.data[0]
    uid = current_user["sub"]
    if booking["buyer_id"] != uid and booking["farmer_id"] != uid and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    return booking


# ── Complete Booking ─────────────────────────────────────
@router.post("/{booking_id}/complete")
async def complete_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    booking = supabase.table("bookings").select("*").eq("id", booking_id).execute()

    if not booking.data:
        raise HTTPException(status_code=404, detail="Booking not found")

    b = booking.data[0]
    uid = current_user["sub"]
    if b["farmer_id"] != uid and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only the farmer or admin can complete a booking")

    if b["status"] == "completed":
        raise HTTPException(status_code=400, detail="Booking already completed")

    result = supabase.table("bookings").update({"status": "completed"}).eq("id", booking_id).execute()
    return result.data[0]