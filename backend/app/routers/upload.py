import uuid
import structlog
from fastapi import APIRouter, Request, UploadFile, File, Form, HTTPException, Depends
from typing import Optional
import aiosqlite

from app.config import settings
from app.services.honeypot_guard import HoneypotGuard
from app.services.audio_processor import AudioProcessor

logger = structlog.get_logger(__name__)

router = APIRouter()

_guard = HoneypotGuard()


async def get_db(request: Request) -> aiosqlite.Connection:
    return request.app.state.db


@router.post("/api/upload")
async def upload_audio(
    request: Request,
    file: UploadFile = File(...),
    honeypot_field: Optional[str] = Form(default=""),
    db: aiosqlite.Connection = Depends(get_db),
):
    if _guard.check(honeypot_field):
        logger.warning("honeypot_drop", filename=file.filename)
        return {"status": "ok"}

    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"ファイルサイズが上限 ({settings.MAX_UPLOAD_SIZE_BYTES} bytes) を超えています。",
        )

    session_id: str = request.state.session_id

    processor = AudioProcessor()
    try:
        result = processor.process(content, file.filename or "upload")
    except ValueError as exc:
        logger.warning("audio_process_invalid", error=str(exc))
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("audio_process_error", error=str(exc), exc_info=True)
        raise HTTPException(status_code=500, detail="音声処理中にエラーが発生しました。") from exc

    meeting_id = str(uuid.uuid4())
    transcript_id = str(uuid.uuid4())

    await db.execute(
        "INSERT INTO meetings (id, session_id, status, duration_sec) VALUES (?, ?, ?, ?)",
        (meeting_id, session_id, "done", result["duration_sec"]),
    )
    await db.execute(
        "INSERT INTO transcripts (id, meeting_id, session_id, raw_text, vosk_confidence)"
        " VALUES (?, ?, ?, ?, ?)",
        (
            transcript_id,
            meeting_id,
            session_id,
            result["raw_text"],
            result["confidence"],
        ),
    )
    await db.commit()

    logger.info(
        "upload_completed",
        meeting_id=meeting_id,
        transcript_id=transcript_id,
        session_id=session_id,
    )
    return {
        "meeting_id": meeting_id,
        "transcript_id": transcript_id,
        "raw_text": result["raw_text"],
        "vosk_confidence": result["confidence"],
    }
