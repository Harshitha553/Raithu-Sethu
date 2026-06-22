import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status

from models.crop import FlashSaleCreate, FlashSaleUpdate
from utils.decorators import require_farmer
from utils.supabase_client import get_supabase
from services.notification_service import notify_flash_sale

router = APIRouter()


# ── List Flash Sales (Marketplace) ───────────────────────
@router.get("/")
async def list_flash_sales(active_only: bool = Query(True, description="Only show currently running sales")):
    supabase = get_supabase()
    query = supabase.table("flash_sales").select(
        "*, crops(id, name, category, price_per_unit, unit, quantity, location, farmer_id, "
        "users!farmer_id(name, location))"
    )
    now = datetime.now(timezone.utc).isoformat()
    query = query.eq("is_active", True).gte("end_time", now)

    result = query.order("created_at", desc=True).execute()
    return result.data or []


# ── Get Single Flash Sale ─────────────────────────────────
@router.get("/{flash_sale_id}")
async def get_flash_sale(flash_sale_id: str):
    supabase = get_supabase()
    result = (
        supabase.table("flash_sales")
        .select("*, crops(*, users!farmer_id(name, location, phone))")
        .eq("id", flash_sale_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Flash sale not found")
    return result.data[0]


# ── Create Flash Sale (Farmer) ────────────────────────────
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_flash_sale(body: FlashSaleCreate, current_user: dict = Depends(require_farmer)):
    supabase = get_supabase()

    # Ownership + status check on the crop
    crop = (
        supabase.table("crops")
        .select("*")
        .eq("id", body.crop_id)
        .eq("farmer_id", current_user["sub"])
        .execute()
    )
    if not crop.data:
        raise HTTPException(status_code=404, detail="Crop not found")

    c = crop.data[0]
    if c["status"] != "active":
        raise HTTPException(status_code=400, detail="Only active crops can have a flash sale")

    if body.end_time <= body.start_time:
        raise HTTPException(status_code=400, detail="end_time must be after start_time")

    # Validate flash sale start_time >= crop harvest_date
    if c.get("harvest_date"):
        from datetime import datetime
        harvest = datetime.fromisoformat(c["harvest_date"]) if isinstance(c["harvest_date"], str) else c["harvest_date"]
        if body.start_time < harvest:
            raise HTTPException(
                status_code=400,
                detail="Flash sale start date must be on or after the crop harvest date",
            )

    # Prevent duplicate active sales on the same crop
    existing = (
        supabase.table("flash_sales")
        .select("id")
        .eq("crop_id", body.crop_id)
        .eq("is_active", True)
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=400, detail="An active flash sale already exists for this crop")

    sale = {
        "id": str(uuid.uuid4()),
        "crop_id": body.crop_id,
        "discount_percentage": body.discount_percentage,
        "start_time": body.start_time.isoformat(),
        "end_time": body.end_time.isoformat(),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = supabase.table("flash_sales").insert(sale).execute()
    created = result.data[0] if result.data else sale

    # Notify buyers
    buyers = supabase.table("users").select("id").eq("role", "buyer").execute()
    buyer_ids = [b["id"] for b in (buyers.data or [])]
    notify_flash_sale(buyer_ids, c["name"], body.discount_percentage, created["id"])

    return created


# ── Update Flash Sale (Farmer) ────────────────────────────
@router.put("/{flash_sale_id}")
async def update_flash_sale(
    flash_sale_id: str, body: FlashSaleUpdate, current_user: dict = Depends(require_farmer)
):
    supabase = get_supabase()

    existing = (
        supabase.table("flash_sales")
        .select("*, crops(farmer_id)")
        .eq("id", flash_sale_id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Flash sale not found")

    sale = existing.data[0]
    crop_info = sale.get("crops") or {}
    if crop_info.get("farmer_id") != current_user["sub"]:
        raise HTTPException(status_code=403, detail="You do not own this flash sale")

    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    if "end_time" in updates:
        updates["end_time"] = body.end_time.isoformat()

    # Validate end_time > start_time on update
    new_end = body.end_time if body.end_time else None
    current_start = sale.get("start_time")
    if new_end and current_start:
        from datetime import datetime
        start = datetime.fromisoformat(current_start) if isinstance(current_start, str) else current_start
        if new_end <= start:
            raise HTTPException(status_code=400, detail="end_time must be after start_time")

    result = supabase.table("flash_sales").update(updates).eq("id", flash_sale_id).execute()
    return result.data[0]