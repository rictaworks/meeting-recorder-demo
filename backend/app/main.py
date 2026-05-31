import aiosqlite
import structlog
from contextlib import asynccontextmanager
from fastapi import FastAPI
from pathlib import Path

from app.config import settings
from app.db.init_db import init_db, integrity_check
from app.middleware.maintenance_middleware import MaintenanceMiddleware
from app.middleware.session_middleware import SessionMiddleware
from app.routers import upload, transcripts, generate, meetings, todos
from app.services.auto_reset_scheduler import build_scheduler

logger = structlog.get_logger(__name__)

DB_PATH_FOR_APP = Path(__file__).parent.parent / "meeting_recorder.db"


async def _open_db() -> aiosqlite.Connection:
    db_path = settings.db_file_path
    conn = await aiosqlite.connect(db_path)
    conn.row_factory = aiosqlite.Row
    return conn


def create_app() -> FastAPI:
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        db = await _open_db()
        await init_db(db)
        await integrity_check(db)
        app.state.db = db

        scheduler = build_scheduler(_open_db)
        scheduler.start()
        app.state.scheduler = scheduler

        logger.info("app_started", env=settings.APP_ENV)
        yield

        scheduler.shutdown(wait=False)
        await db.close()
        logger.info("app_stopped")

    app = FastAPI(
        title="meeting-recorder-demo",
        lifespan=lifespan,
        docs_url="/docs" if settings.is_development else None,
        redoc_url=None,
    )

    async def _db_getter():
        return await _open_db()

    app.add_middleware(SessionMiddleware)
    app.add_middleware(MaintenanceMiddleware, db_getter=_db_getter)

    app.include_router(upload.router)
    app.include_router(transcripts.router)
    app.include_router(generate.router)
    app.include_router(meetings.router)
    app.include_router(todos.router)

    return app


app = create_app()
