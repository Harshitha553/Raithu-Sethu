"""
Module 1: Authentication APIs
Routes:
  POST /api/auth/farmer/register
  POST /api/auth/farmer/login
  POST /api/auth/buyer/register
  POST /api/auth/buyer/login
  POST /api/auth/forgot-password
  POST /api/auth/reset-password
"""

import uuid
import secrets
from datetime import datetime, timedelta, timezone

from flask import Blueprint, request, jsonify

from services.auth_service import hash_password, verify_password, generate_jwt
from utils.supabase_client import get_supabase
from services.notification_service import send_notification

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────

def _missing(*fields):
    """Return the first missing required field name, or None if all present."""
    data = request.get_json(silent=True) or {}
    for f in fields:
        if not data.get(f):
            return f
    return None


def _json(data, status=200):
    return jsonify(data), status


def _error(msg, status=400):
    return _json({"success": False, "message": msg}, status)


def _success(msg, **extra):
    return _json({"success": True, "message": msg, **extra})


# ─────────────────────────────────────────────
# Farmer Registration
# ─────────────────────────────────────────────

@auth_bp.route("/farmer/register", methods=["POST"])
def farmer_register():
    """
    Register a new farmer account.

    Request Body:
        name        (str, required)
        email       (str, required)
        password    (str, required, min 8 chars)
        phone       (str, required)
        address     (str, optional)
        aadhar_no   (str, optional) – national ID for KYC

    Returns:
        201  { success, message, farmer_id, token }
        400  validation error
        409  email already registered
    """
    data = request.get_json(silent=True) or {}

    # Validate required fields
    for field in ("name", "email", "password", "phone"):
        if not data.get(field):
            return _error(f"'{field}' is required.")

    if len(data["password"]) < 8:
        return _error("Password must be at least 8 characters.")

    supabase = get_supabase()

    # Check duplicate email
    existing = (
        supabase.table("farmers")
        .select("id")
        .eq("email", data["email"].lower().strip())
        .execute()
    )
    if existing.data:
        return _error("An account with this email already exists.", 409)

    farmer_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    farmer_row = {
        "id": farmer_id,
        "name": data["name"].strip(),
        "email": data["email"].lower().strip(),
        "password_hash": hash_password(data["password"]),
        "phone": data.get("phone", "").strip(),
        "address": data.get("address", "").strip(),
        "aadhar_no": data.get("aadhar_no", "").strip(),
        "role": "farmer",
        "is_verified": False,
        "created_at": now,
        "updated_at": now,
    }

    result = supabase.table("farmers").insert(farmer_row).execute()
    if not result.data:
        return _error("Registration failed. Please try again.", 500)

    token = generate_jwt({"id": farmer_id, "role": "farmer"})

    # Welcome notification
    send_notification(
        user_id=farmer_id,
        user_type="farmer",
        title="Welcome to AgriConnect!",
        message="Your farmer account has been created. Complete your profile to start listing crops.",
        notification_type="welcome",
    )

    return _success(
        "Farmer registered successfully.",
        farmer_id=farmer_id,
        token=token,
    ), 201


# ─────────────────────────────────────────────
# Farmer Login
# ─────────────────────────────────────────────

@auth_bp.route("/farmer/login", methods=["POST"])
def farmer_login():
    """
    Authenticate a farmer and return a JWT.

    Request Body:
        email     (str, required)
        password  (str, required)

    Returns:
        200  { success, message, token, farmer }
        400  missing fields
        401  invalid credentials
    """
    data = request.get_json(silent=True) or {}

    if not data.get("email") or not data.get("password"):
        return _error("'email' and 'password' are required.")

    supabase = get_supabase()
    result = (
        supabase.table("farmers")
        .select("id, name, email, password_hash, phone, is_verified, role")
        .eq("email", data["email"].lower().strip())
        .execute()
    )

    if not result.data:
        return _error("Invalid email or password.", 401)

    farmer = result.data[0]

    if not verify_password(data["password"], farmer["password_hash"]):
        return _error("Invalid email or password.", 401)

    token = generate_jwt({"id": farmer["id"], "role": "farmer"})

    farmer_public = {k: v for k, v in farmer.items() if k != "password_hash"}

    return _success("Login successful.", token=token, farmer=farmer_public)


# ─────────────────────────────────────────────
# Buyer Registration
# ─────────────────────────────────────────────

@auth_bp.route("/buyer/register", methods=["POST"])
def buyer_register():
    """
    Register a new buyer account.

    Request Body:
        name          (str, required)
        email         (str, required)
        password      (str, required, min 8 chars)
        phone         (str, required)
        company_name  (str, optional)
        address       (str, optional)

    Returns:
        201  { success, message, buyer_id, token }
        400  validation error
        409  email already registered
    """
    data = request.get_json(silent=True) or {}

    for field in ("name", "email", "password", "phone"):
        if not data.get(field):
            return _error(f"'{field}' is required.")

    if len(data["password"]) < 8:
        return _error("Password must be at least 8 characters.")

    supabase = get_supabase()

    existing = (
        supabase.table("buyers")
        .select("id")
        .eq("email", data["email"].lower().strip())
        .execute()
    )
    if existing.data:
        return _error("An account with this email already exists.", 409)

    buyer_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    buyer_row = {
        "id": buyer_id,
        "name": data["name"].strip(),
        "email": data["email"].lower().strip(),
        "password_hash": hash_password(data["password"]),
        "phone": data.get("phone", "").strip(),
        "company_name": data.get("company_name", "").strip(),
        "address": data.get("address", "").strip(),
        "role": "buyer",
        "is_verified": False,
        "created_at": now,
        "updated_at": now,
    }

    result = supabase.table("buyers").insert(buyer_row).execute()
    if not result.data:
        return _error("Registration failed. Please try again.", 500)

    token = generate_jwt({"id": buyer_id, "role": "buyer"})

    send_notification(
        user_id=buyer_id,
        user_type="buyer",
        title="Welcome to AgriConnect!",
        message="Your buyer account is ready. Browse the marketplace to find fresh produce.",
        notification_type="welcome",
    )

    return _success(
        "Buyer registered successfully.",
        buyer_id=buyer_id,
        token=token,
    ), 201


# ─────────────────────────────────────────────
# Buyer Login
# ─────────────────────────────────────────────

@auth_bp.route("/buyer/login", methods=["POST"])
def buyer_login():
    """
    Authenticate a buyer and return a JWT.

    Request Body:
        email     (str, required)
        password  (str, required)

    Returns:
        200  { success, message, token, buyer }
        400  missing fields
        401  invalid credentials
    """
    data = request.get_json(silent=True) or {}

    if not data.get("email") or not data.get("password"):
        return _error("'email' and 'password' are required.")

    supabase = get_supabase()
    result = (
        supabase.table("buyers")
        .select("id, name, email, password_hash, phone, company_name, is_verified, role")
        .eq("email", data["email"].lower().strip())
        .execute()
    )

    if not result.data:
        return _error("Invalid email or password.", 401)

    buyer = result.data[0]

    if not verify_password(data["password"], buyer["password_hash"]):
        return _error("Invalid email or password.", 401)

    token = generate_jwt({"id": buyer["id"], "role": "buyer"})

    buyer_public = {k: v for k, v in buyer.items() if k != "password_hash"}

    return _success("Login successful.", token=token, buyer=buyer_public)


# ─────────────────────────────────────────────
# Forgot Password
# ─────────────────────────────────────────────

@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    """
    Initiate password reset: generate a token and (in production) email it.

    Request Body:
        email      (str, required)
        user_type  (str, required) – 'farmer' | 'buyer'

    Returns:
        200  { success, message }           always (don't reveal if email exists)
        400  missing fields / invalid type
    """
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").lower().strip()
    user_type = (data.get("user_type") or "").lower().strip()

    if not email:
        return _error("'email' is required.")

    if user_type not in ("farmer", "buyer"):
        return _error("'user_type' must be 'farmer' or 'buyer'.")

    supabase = get_supabase()
    table = "farmers" if user_type == "farmer" else "buyers"

    result = supabase.table(table).select("id, name").eq("email", email).execute()

    # Always return 200 to avoid email enumeration
    if not result.data:
        return _success("If that email is registered, a reset link has been sent.")

    user = result.data[0]
    reset_token = secrets.token_urlsafe(32)
    expires_at = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()

    # Upsert reset token (one active token per email at a time)
    supabase.table("password_reset_tokens").upsert(
        {
            "user_id": user["id"],
            "user_type": user_type,
            "token": reset_token,
            "expires_at": expires_at,
            "used": False,
        },
        on_conflict="user_id",
    ).execute()

    # TODO: In production, send email via SendGrid / SES with:
    # reset_url = f"{config.FRONTEND_URL}/reset-password?token={reset_token}"
    # For now, include in response only in dev mode / log it.
    print(f"[DEV] Password reset token for {email}: {reset_token}")

    return _success("If that email is registered, a reset link has been sent.")


# ─────────────────────────────────────────────
# Reset Password
# ─────────────────────────────────────────────

@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    """
    Complete password reset using the token from forgot-password.

    Request Body:
        token         (str, required) – the reset token from email
        new_password  (str, required, min 8 chars)

    Returns:
        200  { success, message }
        400  missing fields / weak password / invalid or expired token
    """
    data = request.get_json(silent=True) or {}
    token = (data.get("token") or "").strip()
    new_password = data.get("new_password") or ""

    if not token:
        return _error("'token' is required.")

    if not new_password or len(new_password) < 8:
        return _error("'new_password' must be at least 8 characters.")

    supabase = get_supabase()

    token_row = (
        supabase.table("password_reset_tokens")
        .select("*")
        .eq("token", token)
        .eq("used", False)
        .execute()
    )

    if not token_row.data:
        return _error("Invalid or expired reset token.", 400)

    record = token_row.data[0]

    expires_at = datetime.fromisoformat(record["expires_at"])
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if datetime.now(timezone.utc) > expires_at:
        return _error("Reset token has expired. Please request a new one.", 400)

    table = "farmers" if record["user_type"] == "farmer" else "buyers"
    new_hash = hash_password(new_password)
    now = datetime.now(timezone.utc).isoformat()

    supabase.table(table).update(
        {"password_hash": new_hash, "updated_at": now}
    ).eq("id", record["user_id"]).execute()

    # Mark token as used
    supabase.table("password_reset_tokens").update({"used": True}).eq(
        "token", token
    ).execute()

    return _success("Password has been reset successfully. You can now log in.")