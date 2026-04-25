from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

class JobRead(BaseModel):
    id: str
    title: str
    company: str
    location: Optional[str] = None
    source: str
    url: str
    description: Optional[str] = None
    deadline: Optional[date] = None
    created_at: datetime

    model_config = {"from_attributes": True}

class CrawlResult(BaseModel):
    new_jobs: int
    message: str
