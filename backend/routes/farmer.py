import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from models.crop import CropCreate, CropUpdate, CropOut
from models.request import RequirementResponseCreate
from utils.decorators import require_farmer
from utils.supabase_client import get_supabase
from services.matching_service import match_requirements_to_crops

router = APIRouter()


# ── Create Crop ──────────────────────────────────────────
@router.post("/crops", status_code=status.HTTP_201_CREATED)
async def create_crop(body: CropCreate, current_user: dict = Depends(require_farmer)):
    supabase = get_supabase()
    crop = {
        "id": str(uuid.uuid4()),
        "farmer_id": current_user["sub"],
        "name": body.name,
        "category": body.category,
        "quantity": body.quantity,
        "unit": body.unit,
        "price_per_unit": body.price_per_unit,
        "description": body.description,
        "location": body.location,
        "harvest_date": body.harvest_date.isoformat(),
        "expiry_date": body.expiry_date.isoformat(),
        "status": "active",
        "images": body.images,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = supabase.table("crops").insert(crop).execute()
    # Trigger matching for buyer requirements
    match_requirements_to_crops()
    return result.data[0]


# ── View My Crops ────────────────────────────────────────
@router.get("/crops")
async def get_my_crops(current_user: dict = Depends(require_farmer)):
    supabase = get_supabase()
    result = (
        supabase.table("crops")
        .select("*")
        .eq("farmer_id", current_user["sub"])
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


# ── Update Crop ──────────────────────────────────────────
@router.put("/crops/{crop_id}")
async def update_crop(crop_id: str, body: CropUpdate, current_user: dict = Depends(require_farmer)):
    supabase = get_supabase()
    existing = (
        supabase.table("crops")
        .select("id")
        .eq("id", crop_id)
        .eq("farmer_id", current_user["sub"])
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Crop not found")

    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = supabase.table("crops").update(updates).eq("id", crop_id).execute()
    return result.data[0]


# ── Delete Crop ──────────────────────────────────────────
@router.delete("/crops/{crop_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_crop(crop_id: str, current_user: dict = Depends(require_farmer)):
    supabase = get_supabase()
    existing = (
        supabase.table("crops")
        .select("id")
        .eq("id", crop_id)
        .eq("farmer_id", current_user["sub"])
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Crop not found")

    supabase.table("crops").delete().eq("id", crop_id).execute()


# ── View Purchase Requests ───────────────────────────────
@router.get("/requests")
async def get_purchase_requests(current_user: dict = Depends(require_farmer)):
    supabase = get_supabase()
    result = (
        supabase.table("purchase_requests")
        .select("*, crops(*), users!buyer_id(*)")
        .eq("farmer_id", current_user["sub"])
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


# ── Accept Request ───────────────────────────────────────
@router.post("/requests/{request_id}/accept")
async def accept_request(request_id: str, current_user: dict = Depends(require_farmer)):
    supabase = get_supabase()
    req = (
        supabase.table("purchase_requests")
        .select("*")
        .eq("id", request_id)
        .eq("farmer_id", current_user["sub"])
        .execute()
    )
    if not req.data:
        raise HTTPException(status_code=404, detail="Request not found")

    result = (
        supabase.table("purchase_requests")
        .update({"status": "accepted"})
        .eq("id", request_id)
        .execute()
    )

    from services.notification_service import notify_request_status
    r = req.data[0]
    notify_request_status(r["buyer_id"], "accepted", r.get("crop_name", ""), request_id)
    return result.data[0]


# ── Reject Request ───────────────────────────────────────
@router.post("/requests/{request_id}/reject")
async def reject_request(request_id: str, current_user: dict = Depends(require_farmer)):
    supabase = get_supabase()
    req = (
        supabase.table("purchase_requests")
        .select("*")
        .eq("id", request_id)
        .eq("farmer_id", current_user["sub"])
        .execute()
    )
    if not req.data:
        raise HTTPException(status_code=404, detail="Request not found")

    result = (
        supabase.table("purchase_requests")
        .update({"status": "rejected"})
        .eq("id", request_id)
        .execute()
    )

    from services.notification_service import notify_request_status
    r = req.data[0]
    notify_request_status(r["buyer_id"], "rejected", r.get("crop_name", ""), request_id)
    return result.data[0]


# ── View Buyer Requirements ──────────────────────────────
@router.get("/buyer-requirements")
async def get_buyer_requirements(current_user: dict = Depends(require_farmer)):
    supabase = get_supabase()
    result = (
        supabase.table("buyer_requirements")
        .select("*, users!buyer_id(name, phone)")
        .eq("is_active", True)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


# ── Respond to Requirement ───────────────────────────────
@router.post("/requirement-response", status_code=status.HTTP_201_CREATED)
async def respond_to_requirement(
    body: RequirementResponseCreate, current_user: dict = Depends(require_farmer)
):
    supabase = get_supabase()
    response = {
        "id": str(uuid.uuid4()),
        "requirement_id": body.requirement_id,
        "farmer_id": current_user["sub"],
        "crop_id": body.crop_id,
        "offered_price": body.offered_price,
        "message": body.message,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = supabase.table("requirement_responses").insert(response).execute()
    return result.data[0]