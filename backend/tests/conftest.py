import os
import asyncio
import pytest
import pytest_asyncio
import aiosqlite
from pathlib import Path

TEST_DB_PATH = ":memory:"
SCHEMA_PATH = Path(__file__).parent.parent / "app" / "db" / "schema.sql"


@pytest.fixture(scope="session")
def event_loop_policy():
    return asyncio.DefaultEventLoopPolicy()


@pytest_asyncio.fixture
async def db():
    conn = await aiosqlite.connect(TEST_DB_PATH)
    conn.row_factory = aiosqlite.Row
    schema = SCHEMA_PATH.read_text(encoding="utf-8")
    await conn.executescript(schema)
    await conn.commit()
    yield conn
    await conn.close()


@pytest.fixture(autouse=True)
def set_test_env(monkeypatch):
    monkeypatch.setenv("APP_ENV", "test")
    monkeypatch.setenv("DATABASE_URL", "sqlite:///:memory:")
    monkeypatch.setenv("VOSK_MODEL_PATH", "./models/vosk-model-ja-0.22")
    monkeypatch.setenv("MAX_UPLOAD_SIZE_BYTES", "104857600")
    monkeypatch.setenv("SESSION_COOKIE_NAME", "session_id")
    monkeypatch.setenv("SESSION_EXPIRE_DAYS", "30")
    monkeypatch.setenv("RESET_HOUR_JST", "3")
    monkeypatch.setenv("LOG_LEVEL", "INFO")
