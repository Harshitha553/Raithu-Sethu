import uuid
from datetime import datetime, timezone
from utils.supabase_client import get_supabase


def send_notification(
    user_id: str,
    title: str,
    message: str,
    notif_type: str,
    reference_id: str = None,
):
    """Persist a notification record in Supabase."""
    supabase = get_supabase()
    record = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "title": title,
        "message": message,
        "type": notif_type,
        "reference_id": reference_id,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    supabase.table("notifications").insert(record).execute()
    return record


def notify_crop_request(farmer_id: str, buyer_name: str, crop_name: str, request_id: str):
    send_notification(
        user_id=farmer_id,
        title="New Purchase Request",
        message=f"{buyer_name} has requested your crop: {crop_name}",
        notif_type="crop_request",
        reference_id=request_id,
    )


def notify_request_status(buyer_id: str, status: str, crop_name: str, request_id: str):
    send_notification(
        user_id=buyer_id,
        title=f"Request {status.capitalize()}",
        message=f"Your request for {crop_name} was {status}.",
        notif_type="crop_request",
        reference_id=request_id,
    )


def notify_flash_sale(user_ids: list, crop_name: str, discount: float, sale_id: str):
    for uid in user_ids:
        send_notification(
            user_id=uid,
            title="Flash Sale!",
            message=f"{crop_name} is now {discount}% off — limited time!",
            notif_type="flash_sale",
            reference_id=sale_id,
        )


def notify_requirement_match(farmer_id: str, requirement_id: str, crop_name: str):
    send_notification(
        user_id=farmer_id,
        title="Matching Requirement Found",
        message=f"A buyer is looking for {crop_name} that matches your listing.",
        notif_type="requirement_match",
        reference_id=requirement_id,
    )