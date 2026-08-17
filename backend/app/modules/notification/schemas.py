from pydantic import BaseModel
from typing import Optional

class AlertCreate(BaseModel):
    hospital_id: int
    from_user_id: int
    to_user_id: Optional[int] = None
    to_role: Optional[str] = None
    message: str
    type: Optional[str] = "notification"
