import pytest
import pytest_asyncio
import uuid
from datetime import datetime, timedelta, timezone
from app.services.session_manager import SessionManager


@pytest.mark.asyncio
async def test_create_new_session_when_cookie_missing(db):
    mgr = SessionManager(db)
    session_id = await mgr.get_or_create(None)
    assert session_id is not None
    assert len(session_id) == 36


@pytest.mark.asyncio
async def test_create_new_session_when_cookie_invalid(db):
    mgr = SessionManager(db)
    session_id = await mgr.get_or_create("not-a-valid-uuid")
    assert len(session_id) == 36
    assert session_id != "not-a-valid-uuid"


@pytest.mark.asyncio
async def test_reuse_existing_valid_session(db):
    mgr = SessionManager(db)
    first = await mgr.get_or_create(None)
    second = await mgr.get_or_create(first)
    assert first == second


@pytest.mark.asyncio
async def test_validate_existing_session(db):
    mgr = SessionManager(db)
    sid = await mgr.get_or_create(None)
    is_valid = await mgr.validate(sid)
    assert is_valid is True


@pytest.mark.asyncio
async def test_validate_nonexistent_session(db):
    mgr = SessionManager(db)
    is_valid = await mgr.validate(str(uuid.uuid4()))
    assert is_valid is False


@pytest.mark.asyncio
async def test_session_stored_in_db(db):
    mgr = SessionManager(db)
    sid = await mgr.get_or_create(None)
    async with db.execute(
        "SELECT id FROM sessions WHERE id = ?", (sid,)
    ) as cursor:
        row = await cursor.fetchone()
    assert row is not None


@pytest.mark.asyncio
async def test_expired_session_creates_new(db):
    mgr = SessionManager(db)
    old_id = str(uuid.uuid4())
    past = datetime.now(timezone.utc) - timedelta(days=1)
    await db.execute(
        "INSERT INTO sessions (id, expires_at) VALUES (?, ?)",
        (old_id, past.isoformat()),
    )
    await db.commit()
    new_id = await mgr.get_or_create(old_id)
    assert new_id != old_id
