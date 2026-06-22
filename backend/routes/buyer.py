import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from models.request import PurchaseRequestCreate, BuyerRequirementCreate, BuyerRequirementUpdate
from utils.decorators import require_buyer
from utils.supabase_client import get_supabase
from services.notification_service import notify_crop_request

router = APIRouter()


# ── Marketplace Listings ─────────────────────────────────
@router.get("/marketplace/crops")
async def marketplace_crops(
    category: str = Query(None),
    location: str = Query(None),
    min_price: float = Query(None),
    max_price: float = Query(None),
    search: str = Query(None),
):
    supabase = get_supabase()
    query = supabase.table("crops").select("*, users!farmer_id(name, location, phone)").eq("status", "active")

    if category:
        query = query.eq("category", category)
    if location:
        query = query.ilike("location", f"%{location}%")
    if min_price is not None:
        query = query.gte("price_per_unit", min_price)
    if max_price is not None:
        query = query.lte("price_per_unit", max_price)
    if search:
        query = query.ilike("name", f"%{search}%")

    result = query.order("created_at", desc=True).execute()
    return result.data or []


# ── Crop Details ─────────────────────────────────────────
@router.get("/marketplace/crops/{crop_id}")
async def get_crop_details(crop_id: str):
    supabase = get_supabase()
    result = (
        supabase.table("crops")
        .select("*, users!farmer_id(name, location, phone, is_verified)")
        .eq("id", crop_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Crop not found")
    return result.data[0]


# ── Request Crop ─────────────────────────────────────────
@router.post("/buyer/request-crop", status_code=status.HTTP_201_CREATED)
async def request_crop(body: PurchaseRequestCreate, current_user: dict = Depends(require_buyer)):
    supabase = get_supabase()

    crop = supabase.table("crops").select("*").eq("id", body.crop_id).eq("status", "active").execute()
    if not crop.data:
        raise HTTPException(status_code=404, detail="Crop not found or unavailable")

    c = crop.data[0]

    # Validate requested quantity does not exceed available
    if body.quantity > c["quantity"]:
        raise HTTPException(
            status_code=400,
            detail=f"Requested quantity ({body.quantity}) exceeds available stock ({c['quantity']})",
        )

    # Validate proposed price does not exceed listed price
    if body.proposed_price is not None and body.proposed_price > c["price_per_unit"]:
        raise HTTPException(
            status_code=400,
            detail=f"Proposed price (₹{body.proposed_price}) cannot exceed the listed price (₹{c['price_per_unit']})",
        )

    purchase_request = {
        "id": str(uuid.uuid4()),
        "crop_id": body.crop_id,
        "crop_name": c["name"],
        "buyer_id": current_user["sub"],
        "farmer_id": c["farmer_id"],
        "quantity": body.quantity,
        "message": body.message,
        "proposed_price": body.proposed_price,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = supabase.table("purchase_requests").insert(purchase_request).execute()

    buyer = supabase.table("users").select("name").eq("id", current_user["sub"]).execute()
    buyer_name = buyer.data[0]["name"] if buyer.data else "A buyer"
    notify_crop_request(c["farmer_id"], buyer_name, c["name"], purchase_request["id"])

    return result.data[0]


# ── My Requests ──────────────────────────────────────────
@router.get("/buyer/requests")
async def get_my_requests(current_user: dict = Depends(require_buyer)):
    supabase = get_supabase()
    result = (
        supabase.table("purchase_requests")
        .select("*, crops(*)")
        .eq("buyer_id", current_user["sub"])
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


# ── Create Requirement ───────────────────────────────────
@router.post("/buyer/requirements", status_code=status.HTTP_201_CREATED)
async def create_requirement(body: BuyerRequirementCreate, current_user: dict = Depends(require_buyer)):
    supabase = get_supabase()
    req = {
        "id": str(uuid.uuid4()),
        "buyer_id": current_user["sub"],
        "crop_name": body.crop_name,
        "category": body.category,
        "quantity": body.quantity,
        "unit": body.unit,
        "max_price": body.max_price,
        "location": body.location,
        "required_by": body.required_by.isoformat() if body.required_by else None,
        "description": body.description,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = supabase.table("buyer_requirements").insert(req).execute()

    try:
        from services.matching_service import match_requirements_to_crops
        match_requirements_to_crops()
    except Exception:
        pass

    return result.data[0]


# ── View My Requirements ─────────────────────────────────
@router.get("/buyer/requirements")
async def get_my_requirements(current_user: dict = Depends(require_buyer)):
    supabase = get_supabase()
    result = (
        supabase.table("buyer_requirements")
        .select("*")
        .eq("buyer_id", current_user["sub"])
        .eq("is_active", True)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


# ── Update Requirement ───────────────────────────────────
@router.put("/buyer/requirements/{requirement_id}")
async def update_requirement(
    requirement_id: str,
    body: BuyerRequirementUpdate,
    current_user: dict = Depends(require_buyer),
):
    supabase = get_supabase()
    existing = (
        supabase.table("buyer_requirements")
        .select("id")
        .eq("id", requirement_id)
        .eq("buyer_id", current_user["sub"])
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Requirement not found")

    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = supabase.table("buyer_requirements").update(updates).eq("id", requirement_id).execute()
    return result.data[0]


# ── Delete Requirement ────────────────────────────────────
@router.delete("/buyer/requirements/{requirement_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_requirement(requirement_id: str, current_user: dict = Depends(require_buyer)):
    supabase = get_supabase()
    existing = (
        supabase.table("buyer_requirements")
        .select("id")
        .eq("id", requirement_id)
        .eq("buyer_id", current_user["sub"])
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Requirement not found")

    supabase.table("buyer_requirements").delete().eq("id", requirement_id).execute()


# ── Get Responses to My Requirements ──────────────────────
@router.get("/buyer/requirements/responses")
async def get_requirement_responses(current_user: dict = Depends(require_buyer)):
    supabase = get_supabase()
    # Get all requirements for this buyer
    reqs = (
        supabase.table("buyer_requirements")
        .select("id")
        .eq("buyer_id", current_user["sub"])
        .execute()
    )
    if not reqs.data:
        return []

    req_ids = [r["id"] for r in reqs.data]
    responses = (
        supabase.table("requirement_responses")
        .select("*, requirement:requirement_id(*), farmer:farmer_id(id, name, phone)")
        .in_("requirement_id", req_ids)
        .order("created_at", desc=True)
        .execute()
    )
    return responses.data or []


# ── Accept a Farmer's Response to a Requirement ──────────
@router.post("/buyer/requirements/accept-response/{response_id}")
async def accept_requirement_response(
    response_id: str, current_user: dict = Depends(require_buyer)
):
    supabase = get_supabase()
    # Get the response
    resp = (
        supabase.table("requirement_responses")
        .select("*, requirement:requirement_id(*)")
        .eq("id", response_id)
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Response not found")

    r = resp.data[0]
    req = r.get("requirement") or {}

    # Verify the requirement belongs to this buyer
    if req.get("buyer_id") != current_user["sub"]:
        raise HTTPException(status_code=403, detail="Access denied")

    # Mark the requirement as inactive (removes from both dashboards)
    supabase.table("buyer_requirements").update({"is_active": False}).eq("id", r["requirement_id"]).execute()

    return {"message": "Response accepted, requirement removed from dashboards"}