from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class TodoModel(BaseModel):
    id: str
    meeting_id: str
    session_id: str
    todo_text: str = ""
    due_keyword: Optional[str] = None
    is_checked: bool = False
    is_manual: bool = False
    is_deleted: bool = False
    created_at: datetime
    updated_at: datetime
