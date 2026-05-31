from datetime import datetime
from pydantic import BaseModel


class MinutesModel(BaseModel):
    id: str
    meeting_id: str
    session_id: str
    section_type: str
    content: str = ""
    sort_order: int = 0
    created_at: datetime
