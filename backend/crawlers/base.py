import asyncio
import random
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import date
from typing import Optional

import httpx

@dataclass
class JobData:
    title: str
    company: str
    url: str
    source: str
    location: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[date] = None

BROWSER_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
}

async def polite_sleep(min_sec: float = 1.5, max_sec: float = 3.0) -> None:
    """키워드 요청 사이에 랜덤 딜레이를 두어 rate limit 회피."""
    await asyncio.sleep(random.uniform(min_sec, max_sec))

async def fetch_with_retry(
    client: httpx.AsyncClient,
    url: str,
    params: dict | None = None,
    max_retries: int = 3,
) -> httpx.Response | None:
    """429/5xx 응답 시 exponential backoff으로 재시도. 실패하면 None 반환."""
    for attempt in range(max_retries):
        try:
            resp = await client.get(url, params=params)
            if resp.status_code == 429:
                wait = int(resp.headers.get("Retry-After", 5 * (attempt + 1)))
                await asyncio.sleep(wait)
                continue
            resp.raise_for_status()
            return resp
        except httpx.HTTPStatusError as e:
            if e.response.status_code in (500, 502, 503) and attempt < max_retries - 1:
                await asyncio.sleep(2 ** attempt)
                continue
            return None
        except httpx.RequestError:
            return None
    return None

class BaseCrawler(ABC):
    @abstractmethod
    async def fetch(self) -> list[JobData]:
        pass

    def _deduplicate(self, jobs: list[JobData]) -> list[JobData]:
        seen: set[str] = set()
        unique = []
        for job in jobs:
            if job.url not in seen:
                seen.add(job.url)
                unique.append(job)
        return unique
