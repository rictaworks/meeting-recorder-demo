import structlog
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

logger = structlog.get_logger(__name__)

MAINTENANCE_RESPONSE_BODY = {
    "detail": "データリセット中です。しばらくお待ちください。"
}


class MaintenanceMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, db_getter):
        super().__init__(app)
        self._db_getter = db_getter

    async def dispatch(self, request: Request, call_next) -> Response:
        db = await self._db_getter()
        try:
            async with db.execute(
                "SELECT value FROM system_config WHERE key = ?",
                ("maintenance_mode",),
            ) as cursor:
                row = await cursor.fetchone()
        finally:
            await db.close()

        if row and row["value"] == "1":
            logger.info("maintenance_mode_active", path=request.url.path)
            return JSONResponse(
                status_code=503,
                content=MAINTENANCE_RESPONSE_BODY,
            )
        return await call_next(request)
