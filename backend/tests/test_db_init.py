import pytest
import pytest_asyncio
import aiosqlite
from pathlib import Path

SCHEMA_PATH = Path(__file__).parent.parent / "app" / "db" / "schema.sql"


@pytest.mark.asyncio
async def test_schema_creates_all_tables(db):
    expected_tables = {
        "system_config",
        "sessions",
        "meetings",
        "transcripts",
        "minutes",
        "todos",
        "summaries",
    }
    async with db.execute(
        "SELECT name FROM sqlite_master WHERE type='table'"
    ) as cursor:
        rows = await cursor.fetchall()
    actual = {row["name"] for row in rows}
    assert expected_tables.issubset(actual)


@pytest.mark.asyncio
async def test_system_config_maintenance_default(db):
    async with db.execute(
        "SELECT value FROM system_config WHERE key = ?", ("maintenance_mode",)
    ) as cursor:
        row = await cursor.fetchone()
    assert row is not None
    assert row["value"] == "0"


@pytest.mark.asyncio
async def test_integrity_check(db):
    from app.db.init_db import integrity_check
    result = await integrity_check(db)
    assert result is True


@pytest.mark.asyncio
async def test_all_tables_have_session_id_column(db):
    tables = ["meetings", "transcripts", "minutes", "todos", "summaries"]
    for table in tables:
        async with db.execute(f"PRAGMA table_info({table})") as cursor:
            cols = await cursor.fetchall()
        col_names = [c["name"] for c in cols]
        assert "session_id" in col_names, f"{table} is missing session_id column"
