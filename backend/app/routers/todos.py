import uuid
import structlog
from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel
import aiosqlite

logger = structlog.get_logger(__name__)

router = APIRouter()


class TodoCheckRequest(BaseModel):
    is_checked: bool


class TodoDeleteRequest(BaseModel):
    is_deleted: bool


class TodoCreateRequest(BaseModel):
    meeting_id: str
    todo_text: str


async def get_db(request: Request) -> aiosqlite.Connection:
    return request.app.state.db


@router.patch("/api/todos/{todo_id}")
async def update_todo(
    todo_id: str,
    body: TodoCheckRequest,
    request: Request,
    db: aiosqlite.Connection = Depends(get_db),
):
    session_id: str = request.state.session_id
    async with db.execute(
        "SELECT id FROM todos WHERE id = ? AND session_id = ?",
        (todo_id, session_id),
    ) as cursor:
        row = await cursor.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Todo not found")

    await db.execute(
        "UPDATE todos SET is_checked = ?, updated_at = datetime('now')"
        " WHERE id = ? AND session_id = ?",
        (1 if body.is_checked else 0, todo_id, session_id),
    )
    await db.commit()
    logger.info("todo_updated", todo_id=todo_id, is_checked=body.is_checked)
    return {"status": "ok"}


@router.patch("/api/todos/{todo_id}/delete")
async def soft_delete_todo(
    todo_id: str,
    body: TodoDeleteRequest,
    request: Request,
    db: aiosqlite.Connection = Depends(get_db),
):
    session_id: str = request.state.session_id
    async with db.execute(
        "SELECT id FROM todos WHERE id = ? AND session_id = ?",
        (todo_id, session_id),
    ) as cursor:
        row = await cursor.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Todo not found")

    await db.execute(
        "UPDATE todos SET is_deleted = ?, updated_at = datetime('now')"
        " WHERE id = ? AND session_id = ?",
        (1 if body.is_deleted else 0, todo_id, session_id),
    )
    await db.commit()
    logger.info("todo_soft_deleted", todo_id=todo_id, is_deleted=body.is_deleted)
    return {"status": "ok"}


@router.post("/api/todos")
async def create_todo(
    body: TodoCreateRequest,
    request: Request,
    db: aiosqlite.Connection = Depends(get_db),
):
    session_id: str = request.state.session_id
    async with db.execute(
        "SELECT id FROM meetings WHERE id = ? AND session_id = ?",
        (body.meeting_id, session_id),
    ) as cursor:
        row = await cursor.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Meeting not found")

    new_id = str(uuid.uuid4())
    await db.execute(
        "INSERT INTO todos (id, meeting_id, session_id, todo_text, is_manual)"
        " VALUES (?, ?, ?, ?, ?)",
        (new_id, body.meeting_id, session_id, body.todo_text, 1),
    )
    await db.commit()
    logger.info("todo_created", todo_id=new_id, meeting_id=body.meeting_id)
    return {"id": new_id, "todo_text": body.todo_text}
