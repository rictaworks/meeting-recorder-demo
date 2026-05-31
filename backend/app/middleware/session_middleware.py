import structlog
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response as StarletteResponse
from app.config import settings
from app.services.session_manager import SessionManager

logger = structlog.get_logger(__name__)


class SessionMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next) -> StarletteResponse:
        cookie_val = request.cookies.get(settings.SESSION_COOKIE_NAME)
        db = request.app.state.db
        mgr = SessionManager(db)
        session_id = await mgr.get_or_create(cookie_val)
        request.state.session_id = session_id
        response = await call_next(request)
        if cookie_val != session_id:
            response.set_cookie(
                key=settings.SESSION_COOKIE_NAME,
                value=session_id,
                httponly=True,
                samesite="lax",
                secure=not settings.is_development,
                max_age=settings.SESSION_EXPIRE_DAYS * 86400,
            )
        return response
