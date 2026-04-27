from pydantic import BaseModel
from datetime import date, datetime
from typing import Any, Optional

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

class ResumeUpdate(BaseModel):
    name: Optional[str] = None
    name_en: Optional[str] = None
    phone: Optional[str] = None
    intro: Optional[str] = None
    address: Optional[str] = None
    military_service: Optional[str] = None
    education: Optional[list[dict[str, Any]]] = None
    experience: Optional[list[dict[str, Any]]] = None
    projects: Optional[list[dict[str, Any]]] = None
    papers: Optional[list[dict[str, Any]]] = None
    patents: Optional[list[dict[str, Any]]] = None
    languages: Optional[list[dict[str, Any]]] = None
    certifications: Optional[list[dict[str, Any]]] = None

class ResumeRead(ResumeUpdate):
    id: str
    user_id: str
    photo_path: Optional[str] = None
    resume_file_path: Optional[str] = None
    portfolio_file_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
