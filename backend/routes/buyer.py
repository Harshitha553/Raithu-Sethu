"""
Module 3: Buyer APIs
Routes:
  GET    /api/marketplace/crops              – Browse listings
  GET    /api/marketplace/crops/<crop_id>    – Crop detail
  POST   /api/buyer/request-crop             – Request to buy a crop
  GET    /api/buyer/requests                 – My purchase requests
  POST   /api/buyer/requirements             – Create requirement
  GET    /api/buyer/requirements             – View my requirements
  PUT    /api/buyer/requirements/<id>        – Update requirement
"""

import uuid
from datetime import datetime, timezone

from flask import Blueprint, request, jsonify

from utils.decorators import token_required, buyer_required
from utils.supabase_client import get_supabase
from services.notification_service import send_notification
from services.pricing_service import get_suggested_price

buyer_bp = Blueprint("buyer", __name__)


# ─────────────────────────────────────────────
# Helpers
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
# Marketplace – Public (no auth required)
# ─────────────────────────────────────────────

@buyer_bp.route("/api/marketplace/crops", methods=["GET"])
def marketplace_listings():
    """
    Browse all available crop listings (public endpoint).

    Query Params:
        search      (str)   – keyword match on crop_name / description
        category    (str)   – filter by category
        min_price   (float) – minimum price_per_unit
        max_price   (float) – maximum price_per_unit
        unit        (str)   – 'kg' | 'quintal' | 'ton' | 'piece'
        location    (str)   – partial match on location
        sort_by     (str)   – 'price_asc' | 'price_desc' | 'newest' | 'expiry'
        flash_only  (bool)  – '1' to show only flash sales
        page        (int, default 1)
        per_page    (int, default 20, max 100)

    Returns:
        200  { success, crops, total, page, per_page, filters_applied }
    """
    supabase = get_supabase()

    page = max(1, int(request.args.get("page", 1)))
    per_page = min(100, max(1, int(request.args.get("per_page", 20))))
    offset = (page - 1) * per_page

    query = (
        supabase.table("crops")
        .select("*, farmers(name, location, is_verified)", count="exact")
        .in_("status", ["available", "flash_sale"])
        .order("created_at", desc=True)
        .range(offset, offset + per_page - 1)
    )

    filters_applied = {}

    search = request.args.get("search")
    if search:
        query = query.ilike("crop_name", f"%{search}%")
        filters_applied["search"] = search

    category = request.args.get("category")
    if category:
        query = query.eq("category", category)
        filters_applied["category"] = category

    min_price = request.args.get("min_price")
    if min_price:
        query = query.gte("price_per_unit", float(min_price))
        filters_applied["min_price"] = float(min_price)

    max_price = request.args.get("max_price")
    if max_price:
        query = query.lte("price_per_unit", float(max_price))
        filters_applied["max_price"] = float(max_price)

    unit = request.args.get("unit")
    if unit:
        query = query.eq("unit", unit)
        filters_applied["unit"] = unit

    location = request.args.get("location")
    if location:
        query = query.ilike("location", f"%{location}%")
        filters_applied["location"] = location

    if request.args.get("flash_only") == "1":
        query = query.eq("is_flash_sale", True)
        filters_applied["flash_only"] = True

    # Re-order based on sort_by (must come after all filters)
    sort_by = request.args.get("sort_by", "newest")
    if sort_by == "price_asc":
        query = query.order("price_per_unit", desc=False)
    elif sort_by == "price_desc":
        query = query.order("price_per_unit", desc=True)
    elif sort_by == "expiry":
        query = query.order("expiry_date", desc=False)
    # default: newest (already set)

    result = query.execute()

    return _json({
        "success": True,
        "crops": result.data,
        "total": result.count,
        "page": page,
        "per_page": per_page,
        "filters_applied": filters_applied,
    })


@buyer_bp.route("/api/marketplace/crops/<crop_id>", methods=["GET"])
def crop_detail(crop_id):
    """
    Get full details of a single crop listing including suggested market price.

    Returns:
        200  { success, crop, suggested_price }
        404  not found
    """
    supabase = get_supabase()

    result = (
        supabase.table("crops")
        .select("*, farmers(id, name, phone, location, is_verified, created_at)")
        .eq("id", crop_id)
        .not_.eq("status", "deleted")
        .execute()
    )

    if not result.data:
        return _error("Crop not found.", 404)

    crop = result.data[0]

    # Attach suggested market price for buyer context
    suggested = get_suggested_price(crop["crop_name"])

    return _json({
        "success": True,
        "crop": crop,
        "suggested_price": suggested,
    })


# ─────────────────────────────────────────────
# Buyer – Crop Requests
# ─────────────────────────────────────────────

@buyer_bp.route("/api/buyer/request-crop", methods=["POST"])
@token_required
@buyer_required
def request_crop(current_user):
    """
    Send a purchase request to a farmer for a specific crop.

    Request Body:
        crop_id        (str, required)
        quantity       (float, required)  – quantity the buyer wants
        offered_price  (float, optional)  – buyer's price offer; defaults to listed price
        message        (str, optional)    – note to farmer
        delivery_date  (str, optional)    – preferred delivery date (ISO)

    Returns:
        201  { success, message, request_id }
        400  validation
        404  crop not found / unavailable
        409  duplicate request
    """
    data = request.get_json(silent=True) or {}

    for field in ("crop_id", "quantity"):
        if data.get(field) in (None, ""):
            return _error(f"'{field}' is required.")

    try:
        quantity = float(data["quantity"])
    except (ValueError, TypeError):
        return _error("'quantity' must be a number.")

    if quantity <= 0:
        return _error("'quantity' must be greater than zero.")

    supabase = get_supabase()

    # Validate crop exists and is available
    crop_result = (
        supabase.table("crops")
        .select("id, farmer_id, crop_name, price_per_unit, quantity, unit, status")
        .eq("id", data["crop_id"])
        .execute()
    )

    if not crop_result.data:
        return _error("Crop not found.", 404)

    crop = crop_result.data[0]

    if crop["status"] not in ("available", "flash_sale"):
        return _error("This crop is no longer available for purchase.", 404)

    if crop["farmer_id"] == current_user["id"]:
        return _error("You cannot purchase your own crop listing.", 400)

    if quantity > crop["quantity"]:
        return _error(
            f"Requested quantity ({quantity} {crop['unit']}) exceeds available "
            f"stock ({crop['quantity']} {crop['unit']}).",
            400,
        )

    # Prevent duplicate pending request from same buyer for same crop
    dup = (
        supabase.table("purchase_requests")
        .select("id")
        .eq("crop_id", data["crop_id"])
        .eq("buyer_id", current_user["id"])
        .eq("status", "pending")
        .execute()
    )
    if dup.data:
        return _error(
            "You already have a pending request for this crop. "
            "Please wait for the farmer to respond.",
            409,
        )

    offered_price = data.get("offered_price")
    try:
        offered_price = float(offered_price) if offered_price is not None else crop["price_per_unit"]
    except (ValueError, TypeError):
        return _error("'offered_price' must be a number.")

    total_price = round(offered_price * quantity, 2)
    request_id = str(uuid.uuid4())
    now = _now()

    request_row = {
        "id": request_id,
        "crop_id": crop["id"],
        "farmer_id": crop["farmer_id"],
        "buyer_id": current_user["id"],
        "quantity": quantity,
        "offered_price": offered_price,
        "total_price": total_price,
        "message": (data.get("message") or "").strip(),
        "delivery_date": data.get("delivery_date"),
        "status": "pending",    # pending | accepted | rejected | cancelled
        "created_at": now,
        "updated_at": now,
    }

    result = supabase.table("purchase_requests").insert(request_row).execute()
    if not result.data:
        return _error("Failed to send purchase request.", 500)

    # Notify farmer
    send_notification(
        user_id=crop["farmer_id"],
        user_type="farmer",
        title="New Purchase Request",
        message=(
            f"{current_user.get('name', 'A buyer')} wants to buy "
            f"{quantity} {crop['unit']} of {crop['crop_name']}."
        ),
        notification_type="purchase_request",
        reference_id=request_id,
    )

    return _success("Purchase request sent successfully.", request_id=request_id), 201


@buyer_bp.route("/api/buyer/requests", methods=["GET"])
@token_required
@buyer_required
def get_my_requests(current_user):
    """
    List all purchase requests made by the authenticated buyer.

    Query Params:
        status   (str, optional) – 'pending' | 'accepted' | 'rejected' | 'cancelled'
        page     (int, default 1)
        per_page (int, default 20)

    Returns:
        200  { success, requests, total, page, per_page }
    """
    supabase = get_supabase()

    status_filter = request.args.get("status")
    page = max(1, int(request.args.get("page", 1)))
    per_page = min(100, max(1, int(request.args.get("per_page", 20))))
    offset = (page - 1) * per_page

    query = (
        supabase.table("purchase_requests")
        .select(
            "*, crops(crop_name, unit, images, location), farmers(name, phone)",
            count="exact",
        )
        .eq("buyer_id", current_user["id"])
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


# ─────────────────────────────────────────────
# Buyer – Requirements
# ─────────────────────────────────────────────

@buyer_bp.route("/api/buyer/requirements", methods=["POST"])
@token_required
@buyer_required
def create_requirement(current_user):
    """
    Post a buying requirement so farmers can find and respond to it.

    Request Body:
        crop_name      (str, required)
        quantity       (float, required)
        unit           (str, required)    – 'kg' | 'quintal' | 'ton' | 'piece'
        max_price      (float, optional)  – maximum budget per unit
        description    (str, optional)
        category       (str, optional)
        location       (str, optional)    – preferred pickup / delivery location
        required_by    (str, optional)    – ISO date deadline

    Returns:
        201  { success, message, requirement_id }
        400  validation
    """
    data = request.get_json(silent=True) or {}

    for field in ("crop_name", "quantity", "unit"):
        if data.get(field) in (None, ""):
            return _error(f"'{field}' is required.")

    try:
        quantity = float(data["quantity"])
    except (ValueError, TypeError):
        return _error("'quantity' must be a number.")

    max_price = None
    if data.get("max_price") is not None:
        try:
            max_price = float(data["max_price"])
        except (ValueError, TypeError):
            return _error("'max_price' must be a number.")

    requirement_id = str(uuid.uuid4())
    now = _now()

    row = {
        "id": requirement_id,
        "buyer_id": current_user["id"],
        "crop_name": data["crop_name"].strip(),
        "quantity": quantity,
        "unit": data["unit"].strip(),
        "max_price": max_price,
        "description": (data.get("description") or "").strip(),
        "category": (data.get("category") or "other").strip(),
        "location": (data.get("location") or "").strip(),
        "required_by": data.get("required_by"),
        "status": "open",   # open | fulfilled | closed | expired
        "created_at": now,
        "updated_at": now,
    }

    supabase = get_supabase()
    result = supabase.table("buyer_requirements").insert(row).execute()

    if not result.data:
        return _error("Failed to create requirement.", 500)

    return _success(
        "Requirement posted. Farmers will be notified.",
        requirement_id=requirement_id,
    ), 201


@buyer_bp.route("/api/buyer/requirements", methods=["GET"])
@token_required
@buyer_required
def get_my_requirements(current_user):
    """
    List all requirements posted by the authenticated buyer.

    Query Params:
        status   (str, optional) – 'open' | 'fulfilled' | 'closed' | 'expired'
        page     (int, default 1)
        per_page (int, default 20)

    Returns:
        200  { success, requirements, total, page, per_page }
    """
    supabase = get_supabase()

    status_filter = request.args.get("status")
    page = max(1, int(request.args.get("page", 1)))
    per_page = min(100, max(1, int(request.args.get("per_page", 20))))
    offset = (page - 1) * per_page

    # Fetch requirements with response count
    query = (
        supabase.table("buyer_requirements")
        .select("*, requirement_responses(count)", count="exact")
        .eq("buyer_id", current_user["id"])
        .order("created_at", desc=True)
        .range(offset, offset + per_page - 1)
    )

    if status_filter:
        query = query.eq("status", status_filter)

    result = query.execute()

    return _json({
        "success": True,
        "requirements": result.data,
        "total": result.count,
        "page": page,
        "per_page": per_page,
    })


@buyer_bp.route("/api/buyer/requirements/<requirement_id>", methods=["PUT"])
@token_required
@buyer_required
def update_requirement(current_user, requirement_id):
    """
    Update an existing buyer requirement.

    Updatable fields:
        crop_name, quantity, unit, max_price, description,
        category, location, required_by, status

    Returns:
        200  { success, message, requirement }
        403  not owner
        404  not found
        409  cannot edit fulfilled requirement
    """
    supabase = get_supabase()

    existing = (
        supabase.table("buyer_requirements")
        .select("id, buyer_id, status")
        .eq("id", requirement_id)
        .execute()
    )

    if not existing.data:
        return _error("Requirement not found.", 404)

    req = existing.data[0]

    if req["buyer_id"] != current_user["id"]:
        return _error("You do not have permission to update this requirement.", 403)

    if req["status"] == "fulfilled":
        return _error("A fulfilled requirement cannot be edited.", 409)

    data = request.get_json(silent=True) or {}

    ALLOWED = {
        "crop_name", "quantity", "unit", "max_price",
        "description", "category", "location", "required_by", "status",
    }

    VALID_STATUSES = {"open", "closed"}

    updates = {k: v for k, v in data.items() if k in ALLOWED}

    if not updates:
        return _error("No valid fields provided for update.")

    # Coercions and validation
    if "quantity" in updates:
        try:
            updates["quantity"] = float(updates["quantity"])
        except (ValueError, TypeError):
            return _error("'quantity' must be a number.")

    if "max_price" in updates and updates["max_price"] is not None:
        try:
            updates["max_price"] = float(updates["max_price"])
        except (ValueError, TypeError):
            return _error("'max_price' must be a number.")

    if "status" in updates and updates["status"] not in VALID_STATUSES:
        return _error(f"'status' must be one of: {', '.join(VALID_STATUSES)}.")

    updates["updated_at"] = _now()

    result = (
        supabase.table("buyer_requirements")
        .update(updates)
        .eq("id", requirement_id)
        .execute()
    )

    if not result.data:
        return _error("Failed to update requirement.", 500)

    return _success("Requirement updated successfully.", requirement=result.data[0])