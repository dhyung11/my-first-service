import re
import httpx
from datetime import date
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from bs4 import BeautifulSoup
from backend.crawlers.base import BaseCrawler, JobData, BROWSER_HEADERS, fetch_with_retry, polite_sleep

KEYWORDS = [
    "정보보안", "보안엔지니어", "침해대응",
    # 대기업 보안 공고
    "삼성 보안", "SK 보안", "LG 보안", "KT 보안",
    "현대 보안", "카카오 보안", "네이버 보안", "롯데 보안", "포스코 보안",
]
SEARCH_URL = "https://www.saramin.co.kr/zf_user/search"
BASE_URL = "https://www.saramin.co.kr"

def _normalize_saramin_url(url: str) -> str:
    """search_uuid 등 트래킹 파라미터를 제거하고 rec_idx만 유지."""
    parsed = urlparse(url)
    params = parse_qs(parsed.query)
    rec_idx = params.get("rec_idx", [""])[0]
    if rec_idx:
        return urlunparse(parsed._replace(query=urlencode({"rec_idx": rec_idx})))
    return url

def _parse_deadline(text: str) -> date | None:
    """'~05/30' 또는 '05/30' 형식의 마감일을 date로 변환."""
    m = re.search(r"(\d{2})/(\d{2})", text)
    if not m:
        return None
    try:
        today = date.today()
        month, day = int(m.group(1)), int(m.group(2))
        year = today.year if month >= today.month else today.year + 1
        return date(year, month, day)
    except ValueError:
        return None

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
                raw_url = f"{BASE_URL}{href}" if href.startswith("/") else href
                url = _normalize_saramin_url(raw_url)

                # 근무지: 첫 번째 span
                spans = item.select(".job_condition span")
                location = spans[0].get_text(strip=True) if spans else None

                # 마감일: .job_date 또는 span 중 날짜 패턴 포함하는 것
                deadline: date | None = None
                date_tag = item.select_one(".job_date") or item.select_one(".deadlineWrap")
                if date_tag:
                    deadline = _parse_deadline(date_tag.get_text())
                if deadline is None:
                    for span in spans:
                        txt = span.get_text(strip=True)
                        if re.search(r"\d{2}/\d{2}", txt):
                            deadline = _parse_deadline(txt)
                            break

                # 경력: span 중 "경력" 포함하는 텍스트
                description: str | None = None
                for span in spans:
                    txt = span.get_text(strip=True)
                    if "경력" in txt or "신입" in txt:
                        description = txt
                        break

                results.append(JobData(
                    title=title, company=company, url=url, source="saramin",
                    location=location, deadline=deadline, description=description,
                ))
            except Exception:
                continue
        return results
