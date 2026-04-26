import asyncio
import logging
import re
from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, or_, and_
from backend.database import get_db
from backend.models import Job
from backend.schemas import CrawlResult
from backend.crawlers.base import JobData
from backend.crawlers.saramin import SaraminCrawler
from backend.crawlers.jobkorea import JobkoreaCrawler
from backend.crawlers.wanted import WantedCrawler

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["crawl"])

# 제목·설명에 아래 키워드 중 하나라도 없으면 저장 안 함
_SECURITY_RE = re.compile(
    r'정보보안|정보보호|사이버|보안엔지니어|보안관제|보안운영|침해대응|취약점|'
    r'모의해킹|pentest|악성코드|포렌식|버그바운티|'
    r'isms|iso\s*27001|ciso|soc\b|siem|edr|waf|ids|ips|'
    r'devsecops|appsec|클라우드\s*보안|개인정보\s*보호|privacy',
    re.IGNORECASE,
)

def _is_security_job(title: str, description: str | None) -> bool:
    text = f"{title} {description or ''}"
    return bool(_SECURITY_RE.search(text))

CRAWLER_NAMES = ["saramin", "jobkorea", "wanted"]

STALE_DAYS = 60  # 상시 공고 보관 기간

async def cleanup_old_jobs(db: AsyncSession) -> int:
    """마감 지난 공고 + 60일 이상 된 상시 공고 삭제."""
    today = date.today()
    cutoff = datetime.now() - timedelta(days=STALE_DAYS)
    result = await db.execute(
        delete(Job).where(
            or_(
                and_(Job.deadline != None, Job.deadline < today),       # 마감 지난 공고
                and_(Job.deadline == None, Job.created_at < cutoff),    # 오래된 상시 공고
            )
        ).returning(Job.id)
    )
    return len(result.fetchall())

async def save_job(db: AsyncSession, job_data: JobData) -> bool:
    exists = (await db.execute(select(Job.id).where(Job.url == job_data.url))).scalar_one_or_none()
    if exists:
        return False
    db.add(Job(
        title=job_data.title,
        company=job_data.company,
        location=job_data.location,
        source=job_data.source,
        url=job_data.url,
        description=job_data.description,
        deadline=job_data.deadline,
    ))
    return True

@router.post("/crawl", response_model=CrawlResult)
async def crawl_jobs(db: AsyncSession = Depends(get_db)):
    crawlers = [SaraminCrawler(), JobkoreaCrawler(), WantedCrawler()]
    results = await asyncio.gather(*[c.fetch() for c in crawlers], return_exceptions=True)

    all_jobs: list[JobData] = []
    source_counts: dict[str, int] = {}
    errors: list[str] = []

    for name, result in zip(CRAWLER_NAMES, results):
        if isinstance(result, list):
            source_counts[name] = len(result)
            all_jobs.extend(result)
        else:
            logger.error("Crawler %s failed: %s", name, result)
            errors.append(name)

    deleted_count = await cleanup_old_jobs(db)
    if deleted_count:
        logger.info("Cleaned up %d expired/stale jobs", deleted_count)

    new_count = 0
    skipped = 0
    for job_data in all_jobs:
        if not _is_security_job(job_data.title, job_data.description):
            skipped += 1
            continue
        if await save_job(db, job_data):
            new_count += 1

    if skipped:
        logger.info("Skipped %d non-security jobs", skipped)

    await db.commit()

    parts = [f"{n}:{c}" for n, c in source_counts.items()]
    summary = f"({', '.join(parts)})" if parts else ""
    error_note = f" | 실패: {', '.join(errors)}" if errors else ""
    cleanup_note = f" | 만료 삭제: {deleted_count}건" if deleted_count else ""
    message = f"{new_count}개의 새 공고를 수집했습니다. {summary}{error_note}{cleanup_note}"
    return CrawlResult(new_jobs=new_count, message=message)
