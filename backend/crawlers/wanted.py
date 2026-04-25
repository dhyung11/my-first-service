import httpx
from backend.crawlers.base import BaseCrawler, JobData, BROWSER_HEADERS, fetch_with_retry, polite_sleep

KEYWORDS = ["보안", "security"]
API_URL = "https://www.wanted.co.kr/api/v4/jobs"

class WantedCrawler(BaseCrawler):
    async def fetch(self) -> list[JobData]:
        jobs: list[JobData] = []
        async with httpx.AsyncClient(
            headers={**BROWSER_HEADERS, "Referer": "https://www.wanted.co.kr/"},
            timeout=15,
        ) as client:
            for i, keyword in enumerate(KEYWORDS):
                if i > 0:
                    await polite_sleep()
                resp = await fetch_with_retry(client, API_URL, params={
                    "job_sort": "job.latest_order",
                    "limit": 20,
                    "tag_type_names": keyword,
                })
                if resp is not None:
                    for item in resp.json().get("data", []):
                        job = self._parse_item(item)
                        if job:
                            jobs.append(job)
        return self._deduplicate(jobs)

    def _parse_item(self, item: dict) -> JobData | None:
        try:
            job_id = item["id"]
            title = item["position"]
            company = item["company"]["name"]
            url = f"https://www.wanted.co.kr/wd/{job_id}"
            location = item.get("address", {}).get("location")
            return JobData(title=title, company=company, url=url, source="wanted", location=location)
        except (KeyError, TypeError):
            return None
