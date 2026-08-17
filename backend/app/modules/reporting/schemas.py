from pydantic import BaseModel
from typing import Optional

class ReportRequest(BaseModel):
    report_type: str
    hospital_id: Optional[int] = None

class ReportResponse(BaseModel):
    status: str
    download_url: str
