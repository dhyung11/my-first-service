import pytest
import respx
import httpx
from backend.crawlers.wanted import WantedCrawler

SAMPLE_RESPONSE = {
    "data": [
        {
            "id": 99999,
            "position": "Security Engineer",
            "company": {"name": "보안스타트업C"},
            "address": {"location": "서울특별시 강남구"}
        }
    ]
}

def test_wanted_parse_item():
    crawler = WantedCrawler()
    job = crawler._parse_item(SAMPLE_RESPONSE["data"][0])
    assert job is not None
    assert job.title == "Security Engineer"
    assert job.company == "보안스타트업C"
    assert job.url == "https://www.wanted.co.kr/wd/99999"
    assert job.location == "서울특별시 강남구"
    assert job.source == "wanted"

def test_wanted_parse_item_missing_keys():
    crawler = WantedCrawler()
    job = crawler._parse_item({})
    assert job is None

@pytest.mark.asyncio
@respx.mock
async def test_wanted_fetch_returns_list():
    respx.get("https://www.wanted.co.kr/api/v4/jobs").mock(
        return_value=httpx.Response(200, json=SAMPLE_RESPONSE)
    )
    crawler = WantedCrawler()
    jobs = await crawler.fetch()
    assert isinstance(jobs, list)
    assert all(j.source == "wanted" for j in jobs)
