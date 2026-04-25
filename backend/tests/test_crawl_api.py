import pytest
from unittest.mock import AsyncMock, patch
from backend.crawlers.base import JobData

MOCK_JOB_1 = JobData(title="보안 엔지니어", company="A사", url="https://saramin.co.kr/1", source="saramin")
MOCK_JOB_2 = JobData(title="보안 관제", company="B사", url="https://jobkorea.co.kr/1", source="jobkorea")

@pytest.mark.asyncio
async def test_crawl_saves_new_jobs(client):
    with patch("backend.routers.crawl.SaraminCrawler.fetch", new_callable=AsyncMock, return_value=[MOCK_JOB_1]):
        with patch("backend.routers.crawl.JobkoreaCrawler.fetch", new_callable=AsyncMock, return_value=[MOCK_JOB_2]):
            with patch("backend.routers.crawl.WantedCrawler.fetch", new_callable=AsyncMock, return_value=[]):
                resp = await client.post("/api/crawl")

    assert resp.status_code == 200
    data = resp.json()
    assert data["new_jobs"] == 2
    assert "2" in data["message"]

@pytest.mark.asyncio
async def test_crawl_skips_duplicates(client):
    with patch("backend.routers.crawl.SaraminCrawler.fetch", new_callable=AsyncMock, return_value=[MOCK_JOB_1]):
        with patch("backend.routers.crawl.JobkoreaCrawler.fetch", new_callable=AsyncMock, return_value=[]):
            with patch("backend.routers.crawl.WantedCrawler.fetch", new_callable=AsyncMock, return_value=[]):
                await client.post("/api/crawl")
                resp = await client.post("/api/crawl")

    assert resp.json()["new_jobs"] == 0

@pytest.mark.asyncio
async def test_crawl_jobs_appear_in_list(client):
    with patch("backend.routers.crawl.SaraminCrawler.fetch", new_callable=AsyncMock, return_value=[MOCK_JOB_1]):
        with patch("backend.routers.crawl.JobkoreaCrawler.fetch", new_callable=AsyncMock, return_value=[]):
            with patch("backend.routers.crawl.WantedCrawler.fetch", new_callable=AsyncMock, return_value=[]):
                await client.post("/api/crawl")

    resp = await client.get("/api/jobs")
    assert resp.status_code == 200
    titles = [j["title"] for j in resp.json()]
    assert "보안 엔지니어" in titles
