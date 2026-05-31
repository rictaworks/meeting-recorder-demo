import structlog
from fastapi import APIRouter, Request, Depends
import aiosqlite

logger = structlog.get_logger(__name__)

router = APIRouter()


async def get_db(request: Request) -> aiosqlite.Connection:
    return request.app.state.db


@router.get("/api/meetings")
async def list_meetings(
    request: Request,
    db: aiosqlite.Connection = Depends(get_db),
):
    session_id: str = request.state.session_id
    async with db.execute(
        "SELECT id, title, recorded_at, duration_sec, status, created_at"
        " FROM meetings WHERE session_id = ? ORDER BY created_at DESC",
        (session_id,),
    ) as cursor:
        rows = await cursor.fetchall()
    return [
        {
            "id": row["id"],
            "title": row["title"],
            "recorded_at": row["recorded_at"],
            "duration_sec": row["duration_sec"],
            "status": row["status"],
            "created_at": row["created_at"],
        }
        for row in rows
    ]
