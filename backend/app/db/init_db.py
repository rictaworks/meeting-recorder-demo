import aiosqlite
import structlog
from pathlib import Path

logger = structlog.get_logger(__name__)

SCHEMA_PATH = Path(__file__).parent / "schema.sql"


async def init_db(db: aiosqlite.Connection) -> None:
    schema = SCHEMA_PATH.read_text(encoding="utf-8")
    await db.executescript(schema)
    await db.commit()
    logger.info("database_initialized")


async def integrity_check(db: aiosqlite.Connection) -> bool:
    async with db.execute("PRAGMA integrity_check") as cursor:
        row = await cursor.fetchone()
    if row is None:
        raise RuntimeError("PRAGMA integrity_check returned no result")
    result = row[0] if isinstance(row, (list, tuple)) else row["integrity_check"]
    if result != "ok":
        logger.error("integrity_check_failed", result=result)
        raise RuntimeError(f"Database integrity check failed: {result}")
    logger.info("integrity_check_passed")
    return True
