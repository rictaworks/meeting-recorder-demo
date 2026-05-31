from datetime import datetime
from pydantic import BaseModel


class SessionModel(BaseModel):
    id: str
    created_at: datetime
    expires_at: datetime
