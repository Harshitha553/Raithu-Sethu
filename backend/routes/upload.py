import uuid, os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from utils.decorators import get_current_user

router = APIRouter()

AUDIO_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "audio")
ALLOWED_AUDIO_TYPES = {"audio/webm", "audio/mp4", "audio/mpeg", "audio/ogg", "audio/wav", "audio/x-m4a"}
MAX_AUDIO_FILE_SIZE = 10 * 1024 * 1024


@router.post("/audio", status_code=status.HTTP_201_CREATED)
async def upload_audio(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    # Browsers (e.g. Chrome's MediaRecorder) send content types like
    # "audio/webm;codecs=opus" rather than the bare "audio/webm", so strip
    # any ";codecs=..." / charset parameters before checking the allow-list.
    base_content_type = (file.content_type or "").split(";")[0].strip().lower()
    if base_content_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Allowed: webm, mp4, mpeg, ogg, wav, x-m4a",
        )

    contents = await file.read()
    if len(contents) > MAX_AUDIO_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB")

    os.makedirs(AUDIO_DIR, exist_ok=True)

    EXT_BY_CONTENT_TYPE = {
        "audio/webm": ".webm",
        "audio/mp4": ".mp4",
        "audio/mpeg": ".mp3",
        "audio/ogg": ".ogg",
        "audio/wav": ".wav",
        "audio/x-m4a": ".m4a",
    }
    uploaded_ext = os.path.splitext(file.filename)[1] if file.filename else ""
    ext = uploaded_ext or EXT_BY_CONTENT_TYPE.get(base_content_type, ".webm")
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(AUDIO_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(contents)

    url = f"/uploads/audio/{filename}"
    return {"url": url}