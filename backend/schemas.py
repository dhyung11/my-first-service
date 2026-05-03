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

class NewsRead(BaseModel):
    id: str
    title: str
    url: str
    source: str
    category: str
    summary: Optional[str] = None
    published_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}

class ResumeRead(ResumeUpdate):
    id: str
    user_id: str
    photo_path: Optional[str] = None
    resume_file_path: Optional[str] = None
    portfolio_file_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CertificationRead(BaseModel):
    id: str
    name: str
    category: str
    issuer: Optional[str] = None

    model_config = {"from_attributes": True}


class UserCertCreate(BaseModel):
    cert_name: str
    category: str
    issuer: Optional[str] = None
    status: str = 'not_started'
    progress: int = 0
    target_date: Optional[date] = None
    acquired_date: Optional[date] = None
    notes: Optional[str] = None
    links: list[dict] = []


class UserCertUpdate(BaseModel):
    cert_name: Optional[str] = None
    category: Optional[str] = None
    issuer: Optional[str] = None
    status: Optional[str] = None
    progress: Optional[int] = None
    target_date: Optional[date] = None
    acquired_date: Optional[date] = None
    notes: Optional[str] = None
    links: Optional[list[dict]] = None


class UserCertRead(BaseModel):
    id: str
    user_id: str
    cert_name: str
    category: str
    issuer: Optional[str] = None
    status: str
    progress: int
    target_date: Optional[date] = None
    acquired_date: Optional[date] = None
    notes: Optional[str] = None
    links: list[dict] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
