import structlog
from typing import Optional

logger = structlog.get_logger(__name__)


class HoneypotGuard:
    def check(self, honeypot_value: Optional[str]) -> bool:
        if honeypot_value is None:
            return False
        if honeypot_value.strip():
            logger.warning("honeypot_triggered", value_length=len(honeypot_value))
            return True
        return False
