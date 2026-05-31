import uuid
import structlog
from datetime import datetime, timedelta, timezone
from typing import Optional
import aiosqlite
from app.config import settings

logger = structlog.get_logger(__name__)


class SessionManager:
    def __init__(self, db: aiosqlite.Connection) -> None:
        self._db = db

    async def get_or_create(self, cookie_value: Optional[str]) -> str:
        if cookie_value:
            existing = await self._fetch_valid_session(cookie_value)
            if existing:
                return existing
        return await self._create_session()

    async def validate(self, session_id: str) -> bool:
        result = await self._fetch_valid_session(session_id)
        return result is not None

    async def _fetch_valid_session(self, session_id: str) -> Optional[str]:
        try:
            uuid.UUID(session_id)
        except ValueError:
            return None
        now = datetime.now(timezone.utc).isoformat()
        async with self._db.execute(
            "SELECT id FROM sessions WHERE id = ? AND expires_at > ?",
            (session_id, now),
        ) as cursor:
            row = await cursor.fetchone()
        if row is None:
            return None
        return row["id"] if hasattr(row, "keys") else row[0]

    async def _create_session(self) -> str:
        new_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(days=settings.SESSION_EXPIRE_DAYS)
        await self._db.execute(
            "INSERT INTO sessions (id, expires_at) VALUES (?, ?)",
            (new_id, expires_at.isoformat()),
        )
        await self._db.commit()
        logger.info("session_created", session_id=new_id)
        return new_id
