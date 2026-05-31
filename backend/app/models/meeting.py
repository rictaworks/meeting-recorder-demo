from enum import Enum
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class MeetingStatus(str, Enum):
    RECORDING = "recording"
    PROCESSING = "processing"
    DONE = "done"
    ERROR = "error"


class MeetingModel(BaseModel):
    id: str
    session_id: str
    title: str = ""
    recorded_at: datetime
    audio_path: str = ""
    duration_sec: int = 0
    status: MeetingStatus = MeetingStatus.RECORDING
    created_at: datetime
