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

class UserCreate(BaseModel):
    email: str
    password: str

class UserRead(BaseModel):
    id: str
    email: str
    is_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}

class LoginRequest(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
