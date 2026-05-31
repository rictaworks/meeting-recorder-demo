import pytest
import uuid
from app.services.session_manager import SessionManager


@pytest.mark.asyncio
async def test_sessions_are_isolated(db):
    mgr = SessionManager(db)
    sid_a = await mgr.get_or_create(None)
    sid_b = await mgr.get_or_create(None)
    assert sid_a != sid_b


@pytest.mark.asyncio
async def test_meetings_not_visible_across_sessions(db):
    session_a = str(uuid.uuid4())
    session_b = str(uuid.uuid4())
    meeting_id = str(uuid.uuid4())

    for sid in (session_a, session_b):
        await db.execute(
            "INSERT INTO sessions (id, expires_at) VALUES (?, datetime('now','+30 days'))",
            (sid,),
        )
    await db.execute(
        "INSERT INTO meetings (id, session_id, status) VALUES (?, ?, 'done')",
        (meeting_id, session_a),
    )
    await db.commit()

    async with db.execute(
        "SELECT id FROM meetings WHERE session_id = ?", (session_b,)
    ) as cursor:
        rows = await cursor.fetchall()
    assert len(rows) == 0


@pytest.mark.asyncio
async def test_transcripts_not_visible_across_sessions(db):
    session_a = str(uuid.uuid4())
    session_b = str(uuid.uuid4())
    meeting_id = str(uuid.uuid4())
    transcript_id = str(uuid.uuid4())

    for sid in (session_a, session_b):
        await db.execute(
            "INSERT INTO sessions (id, expires_at) VALUES (?, datetime('now','+30 days'))",
            (sid,),
        )
    await db.execute(
        "INSERT INTO meetings (id, session_id, status) VALUES (?, ?, 'done')",
        (meeting_id, session_a),
    )
    await db.execute(
        "INSERT INTO transcripts (id, meeting_id, session_id, raw_text, vosk_confidence)"
        " VALUES (?, ?, ?, ?, ?)",
        (transcript_id, meeting_id, session_a, "secret", 0.9),
    )
    await db.commit()

    async with db.execute(
        "SELECT id FROM transcripts WHERE session_id = ?", (session_b,)
    ) as cursor:
        rows = await cursor.fetchall()
    assert len(rows) == 0
