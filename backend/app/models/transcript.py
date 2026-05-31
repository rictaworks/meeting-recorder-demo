from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class TranscriptModel(BaseModel):
    id: str
    meeting_id: str
    session_id: str
    raw_text: str = ""
    edited_text: Optional[str] = None
    vosk_confidence: float = 0.0
    created_at: datetime
    updated_at: datetime
