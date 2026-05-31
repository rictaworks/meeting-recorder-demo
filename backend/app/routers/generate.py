import uuid
import asyncio
import structlog
from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel
import aiosqlite

from app.services.text_processor import TextProcessor

logger = structlog.get_logger(__name__)

router = APIRouter()


class GenerateRequest(BaseModel):
    meeting_id: str


async def get_db(request: Request) -> aiosqlite.Connection:
    return request.app.state.db


@router.post("/api/generate")
async def generate(
    body: GenerateRequest,
    request: Request,
    db: aiosqlite.Connection = Depends(get_db),
):
    session_id: str = request.state.session_id

    async with db.execute(
        "SELECT id FROM meetings WHERE id = ? AND session_id = ?",
        (body.meeting_id, session_id),
    ) as cursor:
        meeting_row = await cursor.fetchone()
    if meeting_row is None:
        raise HTTPException(status_code=404, detail="Meeting not found")

    async with db.execute(
        "SELECT raw_text, edited_text FROM transcripts"
        " WHERE meeting_id = ? AND session_id = ?",
        (body.meeting_id, session_id),
    ) as cursor:
        transcript_row = await cursor.fetchone()
    if transcript_row is None:
        raise HTTPException(status_code=404, detail="Transcript not found")

    text = transcript_row["edited_text"] or transcript_row["raw_text"]
    processor = TextProcessor()

    try:
        minutes_data, todos_data, summary_text = await asyncio.gather(
            asyncio.to_thread(processor.generate_minutes, text),
            asyncio.to_thread(processor.extract_todos, text),
            asyncio.to_thread(processor.summarize, text),
        )
    except Exception as exc:
        logger.error("generate_failed", error=str(exc), exc_info=True)
        raise HTTPException(status_code=500, detail="生成処理中にエラーが発生しました。") from exc

    minutes_result = []
    for item in minutes_data:
        mid = str(uuid.uuid4())
        await db.execute(
            "INSERT INTO minutes (id, meeting_id, session_id, section_type, content, sort_order)"
            " VALUES (?, ?, ?, ?, ?, ?)",
            (
                mid,
                body.meeting_id,
                session_id,
                item["section_type"],
                item["content"],
                item["sort_order"],
            ),
        )
        minutes_result.append({"id": mid, **item})

    todos_result = []
    for todo in todos_data:
        tid = str(uuid.uuid4())
        await db.execute(
            "INSERT INTO todos (id, meeting_id, session_id, todo_text, due_keyword)"
            " VALUES (?, ?, ?, ?, ?)",
            (
                tid,
                body.meeting_id,
                session_id,
                todo["todo_text"],
                todo.get("due_keyword"),
            ),
        )
        todos_result.append({"id": tid, **todo})

    summary_id = str(uuid.uuid4())
    await db.execute(
        "INSERT INTO summaries (id, meeting_id, session_id, summary_text)"
        " VALUES (?, ?, ?, ?)",
        (summary_id, body.meeting_id, session_id, summary_text),
    )
    await db.commit()

    logger.info(
        "generate_completed",
        meeting_id=body.meeting_id,
        minutes_count=len(minutes_result),
        todos_count=len(todos_result),
    )
    return {
        "minutes": minutes_result,
        "todos": todos_result,
        "summary": summary_text,
    }
