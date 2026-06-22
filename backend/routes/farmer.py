import uuid, os, shutil
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
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

    # Validate expiry_date > harvest_date
    if body.harvest_date and body.expiry_date:
        if body.expiry_date <= body.harvest_date:
            raise HTTPException(
                status_code=400,
                detail="Expiry date must be greater than harvest date",
            )

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
        "harvest_date": body.harvest_date.isoformat() if body.harvest_date else None,
        "expiry_date": body.expiry_date.isoformat() if body.expiry_date else None,
        "status": "active",
        "images": body.images,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = supabase.table("crops").insert(crop).execute()
    # Trigger matching for buyer requirements (non-blocking)
    try:
        match_requirements_to_crops()
    except Exception:
        pass
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

    # Validate expiry_date > harvest_date on update
    harvest = body.harvest_date if body.harvest_date else (
        existing.data[0].get("harvest_date") if existing.data else None
    )
    expiry = body.expiry_date if body.expiry_date else (
        existing.data[0].get("expiry_date") if existing.data else None
    )
    if harvest and expiry:
        from datetime import datetime
        h = harvest if isinstance(harvest, datetime) else datetime.fromisoformat(harvest)
        e = expiry if isinstance(expiry, datetime) else datetime.fromisoformat(expiry)
        if e <= h:
            raise HTTPException(
                status_code=400,
                detail="Expiry date must be greater than harvest date",
            )
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


# ── View My Requirement Responses ─────────────────────────
@router.get("/my-responses")
async def get_my_responses(current_user: dict = Depends(require_farmer)):
    supabase = get_supabase()
    result = (
        supabase.table("requirement_responses")
        .select("requirement_id")
        .eq("farmer_id", current_user["sub"])
        .execute()
    )
    return [r["requirement_id"] for r in (result.data or [])]


# ── Upload Crop Image ─────────────────────────────────────
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "crops")
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

@router.post("/upload-image", status_code=status.HTTP_201_CREATED)
async def upload_image(file: UploadFile = File(...), current_user: dict = Depends(require_farmer)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Invalid file type. Allowed: JPG, PNG, WEBP")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB")

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(contents)

    url = f"/uploads/crops/{filename}"
    return {"url": url}