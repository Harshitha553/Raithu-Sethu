import uuid
from fastapi import APIRouter, HTTPException, status
from models.user import FarmerRegister, FarmerLogin, BuyerRegister, BuyerLogin, ForgotPasswordRequest, ResetPasswordRequest
from services.auth_service import hash_password, verify_password, create_token, create_password_reset_token, verify_reset_token
from utils.supabase_client import get_supabase

router = APIRouter()


# ── Farmer Register ──────────────────────────────────────
@router.post("/farmer/register", status_code=status.HTTP_201_CREATED)
async def farmer_register(body: FarmerRegister):
    supabase = get_supabase()
    existing = supabase.table("users").select("id").eq("email", body.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = {
        "id": str(uuid.uuid4()),
        "name": body.name,
        "email": body.email,
        "password_hash": hash_password(body.password),
        "phone": body.phone,
        "location": body.location,
        "farm_size": body.farm_size,
        "role": "farmer",
        "is_verified": False,
    }
    supabase.table("users").insert(user).execute()
    token = create_token(user["id"], "farmer")
    return {"message": "Farmer registered successfully", "token": token, "user_id": user["id"]}


# ── Farmer Login ─────────────────────────────────────────
@router.post("/farmer/login")
async def farmer_login(body: FarmerLogin):
    supabase = get_supabase()
    result = supabase.table("users").select("*").eq("email", body.email).eq("role", "farmer").execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user = result.data[0]
    if not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(user["id"], "farmer")
    return {"token": token, "user": {k: v for k, v in user.items() if k != "password_hash"}}


# ── Buyer Register ───────────────────────────────────────
@router.post("/buyer/register", status_code=status.HTTP_201_CREATED)
async def buyer_register(body: BuyerRegister):
    supabase = get_supabase()
    existing = supabase.table("users").select("id").eq("email", body.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = {
        "id": str(uuid.uuid4()),
        "name": body.name,
        "email": body.email,
        "password_hash": hash_password(body.password),
        "phone": body.phone,
        "company_name": body.company_name,
        "role": "buyer",
        "is_verified": False,
    }
    supabase.table("users").insert(user).execute()
    token = create_token(user["id"], "buyer")
    return {"message": "Buyer registered successfully", "token": token, "user_id": user["id"]}


# ── Buyer Login ──────────────────────────────────────────
@router.post("/buyer/login")
async def buyer_login(body: BuyerLogin):
    supabase = get_supabase()
    result = supabase.table("users").select("*").eq("email", body.email).eq("role", "buyer").execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user = result.data[0]
    if not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(user["id"], "buyer")
    return {"token": token, "user": {k: v for k, v in user.items() if k != "password_hash"}}


# ── Forgot Password ──────────────────────────────────────
@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest):
    supabase = get_supabase()
    result = supabase.table("users").select("id").eq("email", body.email).execute()
    if not result.data:
        # Return 200 to avoid email enumeration
        return {"message": "If the email exists, a reset link has been sent."}

    reset_token = create_password_reset_token(body.email)
    # TODO: Send reset_token via email (integrate with email service)
    return {"message": "If the email exists, a reset link has been sent.", "debug_token": reset_token}


# ── Reset Password ───────────────────────────────────────
@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest):
    email = verify_reset_token(body.token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    supabase = get_supabase()
    new_hash = hash_password(body.new_password)
    supabase.table("users").update({"password_hash": new_hash}).eq("email", email).execute()
    return {"message": "Password updated successfully"}