from utils.supabase_client import get_supabase
from services.notification_service import notify_requirement_match


def match_requirements_to_crops():
    """
    For each active buyer requirement, find matching active crops and notify farmers.
    Called by the scheduler or on new crop creation.
    """
    supabase = get_supabase()

    requirements = (
        supabase.table("buyer_requirements")
        .select("*")
        .eq("is_active", True)
        .execute()
    )

    matches_found = 0
    for req in requirements.data or []:
        crops = (
            supabase.table("crops")
            .select("*")
            .ilike("name", f"%{req['crop_name']}%")
            .eq("status", "active")
            .lte("price_per_unit", req["max_price"])
            .execute()
        )

        for crop in crops.data or []:
            # Avoid duplicate notifications — check if already notified
            existing = (
                supabase.table("requirement_matches")
                .select("id")
                .eq("requirement_id", req["id"])
                .eq("crop_id", crop["id"])
                .execute()
            )
            if not existing.data:
                supabase.table("requirement_matches").insert({
                    "requirement_id": req["id"],
                    "crop_id": crop["id"],
                    "farmer_id": crop["farmer_id"],
                }).execute()
                notify_requirement_match(crop["farmer_id"], req["id"], req["crop_name"])
                matches_found += 1

    return matches_found


def get_matches_for_requirement(requirement_id: str) -> list:
    supabase = get_supabase()
    matches = (
        supabase.table("requirement_matches")
        .select("*, crops(*)")
        .eq("requirement_id", requirement_id)
        .execute()
    )
    return matches.data or []