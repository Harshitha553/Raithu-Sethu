import uuid
from datetime import datetime, timezone
import socketio
from services.auth_service import decode_token
from utils.supabase_client import get_supabase

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")

# Maps user_id → socket sid for targeted emits
connected_users: dict[str, str] = {}


@sio.event
async def connect(sid, environ, auth):
    token = None
    if auth and isinstance(auth, dict):
        token = auth.get("token")

    if not token:
        # Try query string
        query = environ.get("QUERY_STRING", "")
        for part in query.split("&"):
            if part.startswith("token="):
                token = part.split("=", 1)[1]
                break

    if not token:
        await sio.disconnect(sid)
        return False

    payload = decode_token(token)
    if not payload:
        await sio.disconnect(sid)
        return False

    user_id = payload["sub"]
    connected_users[user_id] = sid
    await sio.save_session(sid, {"user_id": user_id, "role": payload.get("role")})
    print(f"[Socket] Connected: user={user_id} sid={sid}")


@sio.event
async def disconnect(sid):
    session = await sio.get_session(sid)
    user_id = session.get("user_id")
    if user_id and connected_users.get(user_id) == sid:
        del connected_users[user_id]
    print(f"[Socket] Disconnected: sid={sid}")


@sio.event
async def send_message(sid, data):
    """
    Expected data: { conversation_id, content }
    """
    try:
        session = await sio.get_session(sid)
        sender_id = session.get("user_id")

        conversation_id = data.get("conversation_id")
        content = data.get("content", "").strip()

        if not conversation_id or not content:
            await sio.emit("error", {"message": "conversation_id and content are required"}, to=sid)
            return

        supabase = get_supabase()

        # Validate conversation
        conv = supabase.table("conversations").select("*").eq("id", conversation_id).execute()
        if not conv.data:
            await sio.emit("error", {"message": "Conversation not found"}, to=sid)
            return

        c = conv.data[0]
        if c["participant_one_id"] != sender_id and c["participant_two_id"] != sender_id:
            await sio.emit("error", {"message": "Access denied"}, to=sid)
            return

        # Determine recipient
        recipient_id = (
            c["participant_two_id"] if c["participant_one_id"] == sender_id else c["participant_one_id"]
        )

        # Persist message
        message = {
            "id": str(uuid.uuid4()),
            "conversation_id": conversation_id,
            "sender_id": sender_id,
            "content": content,
            "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        supabase.table("messages").insert(message).execute()

        # Update conversation last_message
        supabase.table("conversations").update({
            "last_message": content,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", conversation_id).execute()

        # Emit to sender (confirmation)
        await sio.emit("receive_message", message, to=sid)

        # Emit to recipient if online
        recipient_sid = connected_users.get(recipient_id)
        if recipient_sid:
            await sio.emit("receive_message", message, to=recipient_sid)
    except Exception as e:
        print(f"[Socket] Error in send_message: {e}")
        await sio.emit("error", {"message": "Failed to send message. Please try again."}, to=sid)


@sio.event
async def typing(sid, data):
    """
    Expected data: { conversation_id, is_typing }
    Broadcasts typing indicator to the other participant.
    """
    session = await sio.get_session(sid)
    sender_id = session.get("user_id")

    conversation_id = data.get("conversation_id")
    is_typing = data.get("is_typing", False)

    if not conversation_id:
        return

    supabase = get_supabase()
    conv = supabase.table("conversations").select("*").eq("id", conversation_id).execute()
    if not conv.data:
        return

    c = conv.data[0]
    recipient_id = (
        c["participant_two_id"] if c["participant_one_id"] == sender_id else c["participant_one_id"]
    )
    recipient_sid = connected_users.get(recipient_id)
    if recipient_sid:
        await sio.emit(
            "typing",
            {"conversation_id": conversation_id, "user_id": sender_id, "is_typing": is_typing},
            to=recipient_sid,
        )