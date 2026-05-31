import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")


class Settings:
    APP_ENV: str = os.getenv("APP_ENV", "production")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./meeting_recorder.db")
    VOSK_MODEL_PATH: str = os.getenv("VOSK_MODEL_PATH", "./models/vosk-model-ja-0.22")
    MAX_UPLOAD_SIZE_BYTES: int = int(os.getenv("MAX_UPLOAD_SIZE_BYTES", "104857600"))
    SESSION_COOKIE_NAME: str = os.getenv("SESSION_COOKIE_NAME", "session_id")
    SESSION_EXPIRE_DAYS: int = int(os.getenv("SESSION_EXPIRE_DAYS", "30"))
    RESET_HOUR_JST: int = int(os.getenv("RESET_HOUR_JST", "3"))
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    @property
    def is_development(self) -> bool:
        return self.APP_ENV in ("development", "test")

    @property
    def db_file_path(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("sqlite:///"):
            return url[len("sqlite:///"):]
        return ":memory:"


settings = Settings()
