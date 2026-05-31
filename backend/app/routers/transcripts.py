import structlog
from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import aiosqlite

logger = structlog.get_logger(__name__)

router = APIRouter()


class TranscriptEditRequest(BaseModel):
    edited_text: str


async def get_db(request: Request) -> aiosqlite.Connection:
    return request.app.state.db


@router.get("/api/transcripts/{meeting_id}")
async def get_transcript(
    meeting_id: str,
    request: Request,
    db: aiosqlite.Connection = Depends(get_db),
):
    session_id: str = request.state.session_id
    async with db.execute(
        "SELECT raw_text, edited_text, vosk_confidence FROM transcripts"
        " WHERE meeting_id = ? AND session_id = ?",
        (meeting_id, session_id),
    ) as cursor:
        row = await cursor.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Transcript not found")
    return {
        "raw_text": row["raw_text"],
        "edited_text": row["edited_text"],
        "vosk_confidence": row["vosk_confidence"],
    }


@router.patch("/api/transcripts/{meeting_id}")
async def update_transcript(
    meeting_id: str,
    body: TranscriptEditRequest,
    request: Request,
    db: aiosqlite.Connection = Depends(get_db),
):
    session_id: str = request.state.session_id
    async with db.execute(
        "SELECT id FROM transcripts WHERE meeting_id = ? AND session_id = ?",
        (meeting_id, session_id),
    ) as cursor:
        row = await cursor.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Transcript not found")

    await db.execute(
        "UPDATE transcripts SET edited_text = ?, updated_at = datetime('now')"
        " WHERE meeting_id = ? AND session_id = ?",
        (body.edited_text, meeting_id, session_id),
    )
    await db.commit()
    logger.info("transcript_updated", meeting_id=meeting_id)
    return {"status": "ok"}
