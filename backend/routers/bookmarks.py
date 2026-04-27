from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.dialects.postgresql import insert as pg_insert
from backend.database import get_db
from backend.models import Bookmark, Job
from backend.auth import get_current_user
from backend.models import User

router = APIRouter(prefix="/api/bookmarks", tags=["bookmarks"])

@router.get("", response_model=list[str])
async def get_bookmarks(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(Bookmark.job_id).where(Bookmark.user_id == user.id))).scalars().all()
    return list(rows)

@router.post("/sync", status_code=200)
async def sync_bookmarks(job_ids: list[str], user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not job_ids:
        return {"synced": 0}
    existing = (await db.execute(select(Job.id).where(Job.id.in_(job_ids)))).scalars().all()
    valid_ids = set(existing)
    synced = 0
    for job_id in valid_ids:
        stmt = pg_insert(Bookmark).values(user_id=user.id, job_id=job_id).on_conflict_do_nothing()
        await db.execute(stmt)
        synced += 1
    await db.commit()
    return {"synced": synced}

@router.post("/{job_id}", status_code=201)
async def add_bookmark(job_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    job = (await db.execute(select(Job.id).where(Job.id == job_id))).scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="공고를 찾을 수 없습니다.")
    stmt = pg_insert(Bookmark).values(user_id=user.id, job_id=job_id).on_conflict_do_nothing()
    await db.execute(stmt)
    await db.commit()

@router.delete("/{job_id}", status_code=204)
async def remove_bookmark(job_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await db.execute(delete(Bookmark).where(Bookmark.user_id == user.id, Bookmark.job_id == job_id))
    await db.commit()
