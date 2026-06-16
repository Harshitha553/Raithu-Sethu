"""
Module 2: Farmer APIs
Routes:
  POST   /api/farmer/crops                          – Create crop
  GET    /api/farmer/crops                          – View my crops
  PUT    /api/farmer/crops/<crop_id>                – Update crop
  DELETE /api/farmer/crops/<crop_id>                – Delete crop
  GET    /api/farmer/requests                       – View purchase requests
  POST   /api/farmer/requests/<id>/accept           – Accept request
  POST   /api/farmer/requests/<id>/reject           – Reject request
  GET    /api/farmer/buyer-requirements             – View buyer requirements
  POST   /api/farmer/requirement-response           – Respond to a requirement
"""

import uuid
from datetime import datetime, timezone

from flask import Blueprint, request, jsonify

from utils.decorators import token_required, farmer_required
from utils.supabase_client import get_supabase
from services.notification_service import send_notification

farmer_bp = Blueprint("farmer", __name__, url_prefix="/api/farmer")


# ─────────────────────────────────────────────
# Shared helpers
# ─────────────────────────────────────────────

def _json(data, status=200):
    return jsonify(data), status


def _error(msg, status=400):
    return _json({"success": False, "message": msg}, status)


def _success(msg, **extra):
    return _json({"success": True, "message": msg, **extra})


def _now():
    return datetime.now(timezone.utc).isoformat()


# ─────────────────────────────────────────────
# Crop Management
# ─────────────────────────────────────────────

@farmer_bp.route("/crops", methods=["POST"])
@token_required
@farmer_required
def create_crop(current_user):
    """
    Create a new crop listing.

    Request Body:
        crop_name      (str, required)
        quantity       (float, required)  – kg / units
        unit           (str, required)    – 'kg' | 'quintal' | 'ton' | 'piece'
        price_per_unit (float, required)
        description    (str, optional)
        category       (str, optional)    – 'vegetable' | 'fruit' | 'grain' | 'spice' | 'other'
        harvest_date   (str, optional)    – ISO date
        expiry_date    (str, optional)    – ISO date; used for flash-sale trigger
        location       (str, optional)
        images         (list, optional)   – list of image URLs

    Returns:
        201  { success, message, crop }
        400  validation error
    """
    data = request.get_json(silent=True) or {}

    for field in ("crop_name", "quantity", "price_per_unit", "unit"):
        if data.get(field) in (None, ""):
            return _error(f"'{field}' is required.")

    try:
        quantity = float(data["quantity"])
        price = float(data["price_per_unit"])
    except (ValueError, TypeError):
        return _error("'quantity' and 'price_per_unit' must be numbers.")

    if quantity <= 0 or price <= 0:
        return _error("'quantity' and 'price_per_unit' must be positive.")

    crop_id = str(uuid.uuid4())
    now = _now()

    crop_row = {
        "id": crop_id,
        "farmer_id": current_user["id"],
        "crop_name": data["crop_name"].strip(),
        "quantity": quantity,
        "unit": data["unit"].strip(),
        "price_per_unit": price,
        "description": (data.get("description") or "").strip(),
        "category": (data.get("category") or "other").strip(),
        "harvest_date": data.get("harvest_date"),
        "expiry_date": data.get("expiry_date"),
        "location": (data.get("location") or "").strip(),
        "images": data.get("images", []),
        "status": "available",          # available | sold | expired | flash_sale
        "is_flash_sale": False,
        "flash_sale_price": None,
        "created_at": now,
        "updated_at": now,
    }

    supabase = get_supabase()
    result = supabase.table("crops").insert(crop_row).execute()

    if not result.data:
        return _error("Failed to create crop listing.", 500)

    return _success("Crop listed successfully.", crop=result.data[0]), 201


@farmer_bp.route("/crops", methods=["GET"])
@token_required
@farmer_required
def get_my_crops(current_user):
    """
    Retrieve all crop listings belonging to the authenticated farmer.

    Query Params:
        status   (str, optional) – filter by status
        page     (int, optional, default 1)
        per_page (int, optional, default 20, max 100)

    Returns:
        200  { success, crops, total, page, per_page }
    """
    supabase = get_supabase()

    status_filter = request.args.get("status")
    page = max(1, int(request.args.get("page", 1)))
    per_page = min(100, max(1, int(request.args.get("per_page", 20))))
    offset = (page - 1) * per_page

    query = (
        supabase.table("crops")
        .select("*", count="exact")
        .eq("farmer_id", current_user["id"])
        .order("created_at", desc=True)
        .range(offset, offset + per_page - 1)
    )

    if status_filter:
        query = query.eq("status", status_filter)

    result = query.execute()

    return _json({
        "success": True,
        "crops": result.data,
        "total": result.count,
        "page": page,
        "per_page": per_page,
    })


@farmer_bp.route("/crops/<crop_id>", methods=["PUT"])
@token_required
@farmer_required
def update_crop(current_user, crop_id):
    """
    Update an existing crop listing.

    Updatable fields:
        crop_name, quantity, unit, price_per_unit, description,
        category, harvest_date, expiry_date, location, images, status

    Returns:
        200  { success, message, crop }
        403  not the owner
        404  crop not found
    """
    supabase = get_supabase()

    existing = (
        supabase.table("crops")
        .select("id, farmer_id, status")
        .eq("id", crop_id)
        .execute()
    )
    if not existing.data:
        return _error("Crop not found.", 404)

    crop = existing.data[0]
    if crop["farmer_id"] != current_user["id"]:
        return _error("You do not have permission to update this crop.", 403)

    data = request.get_json(silent=True) or {}

    ALLOWED = {
        "crop_name", "quantity", "unit", "price_per_unit",
        "description", "category", "harvest_date", "expiry_date",
        "location", "images", "status",
    }

    updates = {k: v for k, v in data.items() if k in ALLOWED}

    if not updates:
        return _error("No valid fields provided for update.")

    # Type coercions
    if "quantity" in updates:
        try:
            updates["quantity"] = float(updates["quantity"])
        except (ValueError, TypeError):
            return _error("'quantity' must be a number.")

    if "price_per_unit" in updates:
        try:
            updates["price_per_unit"] = float(updates["price_per_unit"])
        except (ValueError, TypeError):
            return _error("'price_per_unit' must be a number.")

    updates["updated_at"] = _now()

    result = (
        supabase.table("crops")
        .update(updates)
        .eq("id", crop_id)
        .execute()
    )

    if not result.data:
        return _error("Failed to update crop.", 500)

    return _success("Crop updated successfully.", crop=result.data[0])


@farmer_bp.route("/crops/<crop_id>", methods=["DELETE"])
@token_required
@farmer_required
def delete_crop(current_user, crop_id):
    """
    Soft-delete a crop listing (sets status = 'deleted').

    Returns:
        200  { success, message }
        403  not the owner
        404  crop not found
    """
    supabase = get_supabase()

    existing = (
        supabase.table("crops")
        .select("id, farmer_id")
        .eq("id", crop_id)
        .execute()
    )
    if not existing.data:
        return _error("Crop not found.", 404)

    if existing.data[0]["farmer_id"] != current_user["id"]:
        return _error("You do not have permission to delete this crop.", 403)

    supabase.table("crops").update(
        {"status": "deleted", "updated_at": _now()}
    ).eq("id", crop_id).execute()

    return _success("Crop listing removed successfully.")


# ─────────────────────────────────────────────
# Purchase Requests
# ─────────────────────────────────────────────

@farmer_bp.route("/requests", methods=["GET"])
@token_required
@farmer_required
def get_purchase_requests(current_user):
    """
    List all purchase requests made on the farmer's crops.

    Query Params:
        status   (str, optional) – 'pending' | 'accepted' | 'rejected'
        page     (int, optional, default 1)
        per_page (int, optional, default 20)

    Returns:
        200  { success, requests, total, page, per_page }
    """
    supabase = get_supabase()

    status_filter = request.args.get("status")
    page = max(1, int(request.args.get("page", 1)))
    per_page = min(100, max(1, int(request.args.get("per_page", 20))))
    offset = (page - 1) * per_page

    # Join with crops to get crop info; join with buyers for buyer info
    query = (
        supabase.table("purchase_requests")
        .select(
            "*, crops(crop_name, unit, price_per_unit), buyers(name, phone, company_name)",
            count="exact",
        )
        .eq("farmer_id", current_user["id"])
        .order("created_at", desc=True)
        .range(offset, offset + per_page - 1)
    )

    if status_filter:
        query = query.eq("status", status_filter)

    result = query.execute()

    return _json({
        "success": True,
        "requests": result.data,
        "total": result.count,
        "page": page,
        "per_page": per_page,
    })


@farmer_bp.route("/requests/<request_id>/accept", methods=["POST"])
@token_required
@farmer_required
def accept_request(current_user, request_id):
    """
    Accept a purchase request and create a booking automatically.

    Returns:
        200  { success, message, booking_id }
        403  not your request
        404  request not found
        409  already actioned
    """
    supabase = get_supabase()

    req = (
        supabase.table("purchase_requests")
        .select("*")
        .eq("id", request_id)
        .execute()
    )
    if not req.data:
        return _error("Request not found.", 404)

    purchase = req.data[0]

    if purchase["farmer_id"] != current_user["id"]:
        return _error("You do not have permission to action this request.", 403)

    if purchase["status"] != "pending":
        return _error(f"Request is already '{purchase['status']}'.", 409)

    now = _now()

    # Update request status
    supabase.table("purchase_requests").update(
        {"status": "accepted", "updated_at": now}
    ).eq("id", request_id).execute()

    # Auto-create booking
    booking_id = str(uuid.uuid4())
    booking_row = {
        "id": booking_id,
        "request_id": request_id,
        "crop_id": purchase["crop_id"],
        "farmer_id": current_user["id"],
        "buyer_id": purchase["buyer_id"],
        "quantity": purchase["quantity"],
        "total_price": purchase["offered_price"] or purchase.get("total_price", 0),
        "status": "confirmed",
        "created_at": now,
        "updated_at": now,
    }
    supabase.table("bookings").insert(booking_row).execute()

    # Notify buyer
    send_notification(
        user_id=purchase["buyer_id"],
        user_type="buyer",
        title="Purchase Request Accepted!",
        message=f"Your request has been accepted by the farmer. Booking #{booking_id[:8]} created.",
        notification_type="request_accepted",
        reference_id=booking_id,
    )

    return _success("Request accepted and booking created.", booking_id=booking_id)


@farmer_bp.route("/requests/<request_id>/reject", methods=["POST"])
@token_required
@farmer_required
def reject_request(current_user, request_id):
    """
    Reject a purchase request with an optional reason.

    Request Body (optional):
        reason  (str) – rejection reason shown to buyer

    Returns:
        200  { success, message }
        403  not your request
        404  not found
        409  already actioned
    """
    supabase = get_supabase()

    req = (
        supabase.table("purchase_requests")
        .select("*")
        .eq("id", request_id)
        .execute()
    )
    if not req.data:
        return _error("Request not found.", 404)

    purchase = req.data[0]

    if purchase["farmer_id"] != current_user["id"]:
        return _error("You do not have permission to action this request.", 403)

    if purchase["status"] != "pending":
        return _error(f"Request is already '{purchase['status']}'.", 409)

    data = request.get_json(silent=True) or {}
    reason = (data.get("reason") or "").strip()
    now = _now()

    supabase.table("purchase_requests").update(
        {"status": "rejected", "rejection_reason": reason, "updated_at": now}
    ).eq("id", request_id).execute()

    # Notify buyer
    send_notification(
        user_id=purchase["buyer_id"],
        user_type="buyer",
        title="Purchase Request Declined",
        message=f"Your request was declined by the farmer. {reason}" if reason else
                "Your request was declined by the farmer.",
        notification_type="request_rejected",
        reference_id=request_id,
    )

    return _success("Request rejected.")


# ─────────────────────────────────────────────
# Buyer Requirements
# ─────────────────────────────────────────────

@farmer_bp.route("/buyer-requirements", methods=["GET"])
@token_required
@farmer_required
def get_buyer_requirements(current_user):
    """
    Browse open buyer requirements that may match what this farmer grows.

    Query Params:
        crop_name  (str, optional) – keyword filter on crop name
        category   (str, optional)
        page       (int, optional, default 1)
        per_page   (int, optional, default 20)

    Returns:
        200  { success, requirements, total, page, per_page }
    """
    supabase = get_supabase()

    page = max(1, int(request.args.get("page", 1)))
    per_page = min(100, max(1, int(request.args.get("per_page", 20))))
    offset = (page - 1) * per_page

    query = (
        supabase.table("buyer_requirements")
        .select("*, buyers(name, company_name, phone)", count="exact")
        .eq("status", "open")
        .order("created_at", desc=True)
        .range(offset, offset + per_page - 1)
    )

    crop_name = request.args.get("crop_name")
    if crop_name:
        query = query.ilike("crop_name", f"%{crop_name}%")

    category = request.args.get("category")
    if category:
        query = query.eq("category", category)

    result = query.execute()

    return _json({
        "success": True,
        "requirements": result.data,
        "total": result.count,
        "page": page,
        "per_page": per_page,
    })


@farmer_bp.route("/requirement-response", methods=["POST"])
@token_required
@farmer_required
def respond_to_requirement(current_user):
    """
    Respond to a buyer's open requirement with an offer.

    Request Body:
        requirement_id  (str, required)
        crop_id         (str, required)   – which of your crops fulfils it
        offered_price   (float, required) – price per unit you're offering
        quantity        (float, required) – quantity you can supply
        message         (str, optional)   – note to the buyer

    Returns:
        201  { success, message, response_id }
        400  validation
        404  requirement not found
        409  already responded
    """
    data = request.get_json(silent=True) or {}

    for field in ("requirement_id", "crop_id", "offered_price", "quantity"):
        if data.get(field) in (None, ""):
            return _error(f"'{field}' is required.")

    try:
        offered_price = float(data["offered_price"])
        quantity = float(data["quantity"])
    except (ValueError, TypeError):
        return _error("'offered_price' and 'quantity' must be numbers.")

    supabase = get_supabase()

    # Check requirement exists and is open
    req = (
        supabase.table("buyer_requirements")
        .select("id, buyer_id, crop_name, status")
        .eq("id", data["requirement_id"])
        .execute()
    )
    if not req.data:
        return _error("Requirement not found.", 404)

    requirement = req.data[0]
    if requirement["status"] != "open":
        return _error("This requirement is no longer open.", 409)

    # Check farmer hasn't already responded
    already = (
        supabase.table("requirement_responses")
        .select("id")
        .eq("requirement_id", data["requirement_id"])
        .eq("farmer_id", current_user["id"])
        .execute()
    )
    if already.data:
        return _error("You have already responded to this requirement.", 409)

    # Verify the crop belongs to this farmer
    crop = (
        supabase.table("crops")
        .select("id, farmer_id, status, quantity")
        .eq("id", data["crop_id"])
        .execute()
    )
    if not crop.data or crop.data[0]["farmer_id"] != current_user["id"]:
        return _error("Invalid crop_id or you do not own this crop.", 400)

    if crop.data[0]["status"] != "available":
        return _error("The selected crop is not available for offers.", 400)

    now = _now()
    response_id = str(uuid.uuid4())

    response_row = {
        "id": response_id,
        "requirement_id": data["requirement_id"],
        "farmer_id": current_user["id"],
        "crop_id": data["crop_id"],
        "offered_price": offered_price,
        "quantity": quantity,
        "message": (data.get("message") or "").strip(),
        "status": "pending",    # pending | accepted | rejected
        "created_at": now,
        "updated_at": now,
    }

    result = supabase.table("requirement_responses").insert(response_row).execute()
    if not result.data:
        return _error("Failed to submit response.", 500)

    # Notify buyer
    send_notification(
        user_id=requirement["buyer_id"],
        user_type="buyer",
        title="New Offer on Your Requirement",
        message=f"A farmer has responded to your requirement for '{requirement['crop_name']}'.",
        notification_type="requirement_response",
        reference_id=response_id,
    )

    return _success("Response submitted successfully.", response_id=response_id), 201