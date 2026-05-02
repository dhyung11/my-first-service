import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.database import get_db
from backend.models import News, User
from backend.schemas import NewsRead
from backend.auth import get_current_admin
from backend.crawlers.news import NewsCrawler

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["news"])


@router.get("/news", response_model=list[NewsRead])
async def list_news(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(News).order_by(News.published_at.desc()).limit(200)
    )
    return result.scalars().all()


@router.post("/news/fetch")
async def fetch_news(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    crawler = NewsCrawler()
    items = await crawler.fetch()
    new_count = 0
    for item in items:
        try:
            exists = (
                await db.execute(select(News.id).where(News.url == item.url))
            ).scalar_one_or_none()
            if not exists:
                db.add(News(
                    title=item.title,
                    url=item.url,
                    source=item.source,
                    category=item.category,
                    summary=item.summary,
                    published_at=item.published_at,
                ))
                new_count += 1
        except Exception as e:
            logger.warning("Failed to save news item %s: %s", item.url, e)
    await db.commit()
    return {"new_news": new_count, "message": f"{new_count}개의 새 뉴스를 수집했습니다."}
