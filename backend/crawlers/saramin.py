import httpx
from bs4 import BeautifulSoup
from backend.crawlers.base import BaseCrawler, JobData, BROWSER_HEADERS, fetch_with_retry, polite_sleep

KEYWORDS = ["정보보안", "보안엔지니어", "침해대응"]
SEARCH_URL = "https://www.saramin.co.kr/zf_user/search"
BASE_URL = "https://www.saramin.co.kr"

class SaraminCrawler(BaseCrawler):
    async def fetch(self) -> list[JobData]:
        jobs: list[JobData] = []
        async with httpx.AsyncClient(
            headers=BROWSER_HEADERS,
            follow_redirects=True,
            timeout=15,
        ) as client:
            for i, keyword in enumerate(KEYWORDS):
                if i > 0:
                    await polite_sleep()
                resp = await fetch_with_retry(client, SEARCH_URL, params={"searchword": keyword, "recruitPage": 1})
                if resp is not None:
                    jobs.extend(self._parse(resp.text))
        return self._deduplicate(jobs)

    def _parse(self, html: str) -> list[JobData]:
        soup = BeautifulSoup(html, "html.parser")
        results = []
        for item in soup.select("div.item_recruit"):
            try:
                title_tag = item.select_one(".job_tit a")
                company_tag = item.select_one(".corp_name a")
                if not title_tag or not company_tag:
                    continue
                title = title_tag.get_text(strip=True)
                company = company_tag.get_text(strip=True)
                href = title_tag.get("href", "")
                url = f"{BASE_URL}{href}" if href.startswith("/") else href
                location_tag = item.select_one(".job_condition span")
                location = location_tag.get_text(strip=True) if location_tag else None
                results.append(JobData(title=title, company=company, url=url, source="saramin", location=location))
            except Exception:
                continue
        return results
