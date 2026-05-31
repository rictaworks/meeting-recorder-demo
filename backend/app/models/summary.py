from datetime import datetime
from pydantic import BaseModel


class SummaryModel(BaseModel):
    id: str
    meeting_id: str
    session_id: str
    summary_text: str = ""
    created_at: datetime
