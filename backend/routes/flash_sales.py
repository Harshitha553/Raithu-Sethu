from fastapi import APIRouter, Depends
from utils.decorators import get_current_user
from services.pricing_service import get_suggested_price, get_demand_trend

router = APIRouter()


# ── Get Suggested Price ──────────────────────────────────
@router.get("/{crop_name}")
async def suggested_price(crop_name: str, _: dict = Depends(get_current_user)):
    return get_suggested_price(crop_name)


# ── Get Demand Trend ─────────────────────────────────────
@router.get("/trends/{crop_name}")
async def demand_trend(crop_name: str, _: dict = Depends(get_current_user)):
    return get_demand_trend(crop_name)