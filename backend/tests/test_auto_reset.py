import pytest
import pytest_asyncio
import uuid
from datetime import datetime
from app.services.auto_reset_scheduler import AutoResetScheduler


@pytest.mark.asyncio
async def test_set_maintenance_on(db):
    scheduler = AutoResetScheduler(db)
    await scheduler.set_maintenance(True)
    async with db.execute(
        "SELECT value FROM system_config WHERE key = ?", ("maintenance_mode",)
    ) as cursor:
        row = await cursor.fetchone()
    assert row["value"] == "1"


@pytest.mark.asyncio
async def test_set_maintenance_off(db):
    scheduler = AutoResetScheduler(db)
    await scheduler.set_maintenance(True)
    await scheduler.set_maintenance(False)
    async with db.execute(
        "SELECT value FROM system_config WHERE key = ?", ("maintenance_mode",)
    ) as cursor:
        row = await cursor.fetchone()
    assert row["value"] == "0"


@pytest.mark.asyncio
async def test_delete_all_data_clears_tables(db):
    session_id = str(uuid.uuid4())
    meeting_id = str(uuid.uuid4())
    await db.execute(
        "INSERT INTO sessions (id, expires_at) VALUES (?, datetime('now', '+30 days'))",
        (session_id,),
    )
    await db.execute(
        "INSERT INTO meetings (id, session_id, status) VALUES (?, ?, 'done')",
        (meeting_id, session_id),
    )
    await db.commit()

    scheduler = AutoResetScheduler(db)
    await scheduler.delete_all_data()

    for table in ["meetings", "transcripts", "minutes", "todos", "summaries", "sessions"]:
        async with db.execute(f"SELECT COUNT(*) as cnt FROM {table}") as cursor:
            row = await cursor.fetchone()
        assert row["cnt"] == 0, f"{table} should be empty after reset"


@pytest.mark.asyncio
async def test_vacuum_does_not_raise(db):
    scheduler = AutoResetScheduler(db)
    await scheduler.vacuum()


@pytest.mark.asyncio
async def test_full_reset_cycle(db):
    scheduler = AutoResetScheduler(db)
    await scheduler.run_reset()
    async with db.execute(
        "SELECT value FROM system_config WHERE key = ?", ("maintenance_mode",)
    ) as cursor:
        row = await cursor.fetchone()
    assert row["value"] == "0"
