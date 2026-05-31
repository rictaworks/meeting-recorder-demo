import structlog
import aiosqlite
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from app.config import settings

logger = structlog.get_logger(__name__)

RESET_TABLES = ["summaries", "todos", "minutes", "transcripts", "meetings", "sessions"]

_ALLOWED_TABLES = frozenset(RESET_TABLES)


class AutoResetScheduler:
    def __init__(self, db: aiosqlite.Connection) -> None:
        self._db = db

    async def set_maintenance(self, enabled: bool) -> None:
        value = "1" if enabled else "0"
        await self._db.execute(
            "UPDATE system_config SET value = ? WHERE key = ?",
            (value, "maintenance_mode"),
        )
        await self._db.commit()
        logger.info("maintenance_mode_set", enabled=enabled)

    async def delete_all_data(self) -> None:
        for table in RESET_TABLES:
            if table not in _ALLOWED_TABLES:
                raise ValueError(f"Unexpected table name: {table}")
            await self._db.execute(f"DELETE FROM {table}")
        await self._db.commit()
        logger.info("all_data_deleted", tables=RESET_TABLES)

    async def vacuum(self) -> None:
        await self._db.execute("VACUUM")
        logger.info("vacuum_completed")

    async def run_reset(self) -> None:
        logger.info("auto_reset_started")
        await self.set_maintenance(True)
        try:
            await self.delete_all_data()
            await self.vacuum()
        finally:
            await self.set_maintenance(False)
        logger.info("auto_reset_completed")


def build_scheduler(db_getter) -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler(timezone="Asia/Tokyo")

    async def _job():
        db = await db_getter()
        try:
            reset = AutoResetScheduler(db)
            await reset.run_reset()
        finally:
            await db.close()

    scheduler.add_job(
        _job,
        CronTrigger(hour=settings.RESET_HOUR_JST, minute=0, timezone="Asia/Tokyo"),
        id="auto_reset",
        replace_existing=True,
    )
    return scheduler
