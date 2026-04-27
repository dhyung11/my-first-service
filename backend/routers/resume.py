import os
import uuid
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.database import get_db
from backend.models import Resume, User
from backend.schemas import ResumeRead, ResumeUpdate
from backend.auth import get_current_user

router = APIRouter(prefix="/api", tags=["resume"])

UPLOAD_BASE = Path(os.getenv("UPLOAD_DIR", "./uploads"))

_ALLOWED_EXT = {
    "photo":     {".jpg", ".jpeg", ".png", ".webp"},
    "resume":    {".pdf", ".docx"},
    "portfolio": {".pdf"},
}
_MAX_BYTES = {
    "photo":      5 * 1024 * 1024,
    "resume":    10 * 1024 * 1024,
    "portfolio": 20 * 1024 * 1024,
}
_MAGIC = {
    ".jpg":  b"\xff\xd8\xff",
    ".jpeg": b"\xff\xd8\xff",
    ".png":  b"\x89PNG",
    ".webp": b"RIFF",
    ".pdf":  b"%PDF",
    ".docx": b"PK\x03\x04",
}
_FILE_FIELD = {
    "photo":     "photo_path",
    "resume":    "resume_file_path",
    "portfolio": "portfolio_file_path",
}

def _validate(file: UploadFile, file_type: str, content: bytes) -> str:
    ext = Path(file.filename or "").suffix.lower()
    if ext not in _ALLOWED_EXT[file_type]:
        raise HTTPException(400, f"허용 확장자: {', '.join(_ALLOWED_EXT[file_type])}")
    if len(content) > _MAX_BYTES[file_type]:
        mb = _MAX_BYTES[file_type] // (1024 * 1024)
        raise HTTPException(400, f"파일 크기는 {mb}MB 이하여야 합니다.")
    magic = _MAGIC.get(ext)
    if magic and not content.startswith(magic):
        raise HTTPException(400, "파일 내용이 확장자와 일치하지 않습니다.")
    return ext

async def _save(content: bytes, user_id: str, file_type: str, ext: str) -> str:
    user_dir = UPLOAD_BASE / user_id
    user_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{file_type}_{uuid.uuid4().hex}{ext}"
    (user_dir / filename).write_bytes(content)
    return f"{user_id}/{filename}"

async def _get_or_create(user_id: str, db: AsyncSession) -> Resume:
    resume = (await db.execute(select(Resume).where(Resume.user_id == user_id))).scalar_one_or_none()
    if not resume:
        resume = Resume(user_id=user_id)
        db.add(resume)
        await db.flush()
    return resume

# ── 이력서 조회 ──────────────────────────────────────────────
@router.get("/resume", response_model=ResumeRead)
async def get_resume(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    resume = (await db.execute(select(Resume).where(Resume.user_id == user.id))).scalar_one_or_none()
    if not resume:
        raise HTTPException(404, "이력서가 없습니다.")
    return resume

# ── 이력서 저장/수정 (upsert) ────────────────────────────────
@router.put("/resume", response_model=ResumeRead)
async def upsert_resume(
    body: ResumeUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    resume = await _get_or_create(user.id, db)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(resume, field, value)
    resume.updated_at = datetime.now()
    await db.commit()
    await db.refresh(resume)
    return resume

# ── 파일 업로드 ──────────────────────────────────────────────
@router.post("/resume/upload/{file_type}")
async def upload_file(
    file_type: str,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if file_type not in _ALLOWED_EXT:
        raise HTTPException(400, "잘못된 파일 유형입니다.")
    content = await file.read()
    ext = _validate(file, file_type, content)
    relative_path = await _save(content, user.id, file_type, ext)

    resume = await _get_or_create(user.id, db)
    field = _FILE_FIELD[file_type]

    # 기존 파일 삭제
    old = getattr(resume, field)
    if old:
        old_file = UPLOAD_BASE / old
        if old_file.exists():
            old_file.unlink()

    setattr(resume, field, relative_path)
    resume.updated_at = datetime.now()
    await db.commit()
    return {"url": f"/api/uploads/{relative_path}"}

# ── 파일 서빙 (인증 필요) ────────────────────────────────────
@router.get("/uploads/{user_id}/{filename}")
async def serve_file(
    user_id: str,
    filename: str,
    current_user: User = Depends(get_current_user),
):
    if current_user.id != user_id:
        raise HTTPException(403, "접근 권한이 없습니다.")
    path = UPLOAD_BASE / user_id / filename
    if not path.exists():
        raise HTTPException(404, "파일을 찾을 수 없습니다.")
    return FileResponse(path)
