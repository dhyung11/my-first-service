import pytest
import respx
import httpx
from backend.crawlers.jobkorea import JobkoreaCrawler

SAMPLE_HTML = """
<html><body>
<div class="list-default">
  <ul>
    <li class="recruit-info">
      <div class="job-tit"><a href="/Recruit/GI_Read/12345">보안 관제 엔지니어</a></div>
      <div class="cpn-name"><a href="/company/1">보안기업B</a></div>
      <div class="job-condition"><em class="option">서울 강남구</em></div>
    </li>
  </ul>
</div>
</body></html>
"""

def test_jobkorea_parse_returns_jobs():
    crawler = JobkoreaCrawler()
    jobs = crawler._parse(SAMPLE_HTML)
    assert len(jobs) == 1
    assert jobs[0].title == "보안 관제 엔지니어"
    assert jobs[0].company == "보안기업B"
    assert jobs[0].source == "jobkorea"
    assert "jobkorea.co.kr" in jobs[0].url

def test_jobkorea_parse_skips_missing_fields():
    crawler = JobkoreaCrawler()
    html = "<html><body><li class='recruit-info'></li></body></html>"
    jobs = crawler._parse(html)
    assert jobs == []

@pytest.mark.asyncio
@respx.mock
async def test_jobkorea_fetch_returns_list():
    respx.get("https://www.jobkorea.co.kr/Search/").mock(
        return_value=httpx.Response(200, text=SAMPLE_HTML)
    )
    crawler = JobkoreaCrawler()
    jobs = await crawler.fetch()
    assert isinstance(jobs, list)
