import asyncio
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.database import get_db
from backend.models import Job
from backend.schemas import CrawlResult
from backend.crawlers.base import JobData
from backend.crawlers.saramin import SaraminCrawler
from backend.crawlers.jobkorea import JobkoreaCrawler
from backend.crawlers.wanted import WantedCrawler

router = APIRouter(prefix="/api", tags=["crawl"])

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
    for result in results:
        if isinstance(result, list):
            all_jobs.extend(result)

    new_count = 0
    for job_data in all_jobs:
        if await save_job(db, job_data):
            new_count += 1

    await db.commit()
    return CrawlResult(new_jobs=new_count, message=f"{new_count}개의 새 공고를 수집했습니다.")
