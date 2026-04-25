import pytest
import respx
import httpx
from backend.crawlers.saramin import SaraminCrawler

SAMPLE_HTML = """
<html><body>
<div class="item_recruit">
  <div class="recruit_tit">
    <h2 class="job_tit"><a href="/zf_user/jobs/relay/view?rec_idx=1234">보안 엔지니어</a></h2>
  </div>
  <div class="corp_name"><a href="/zf_user/company-info/view?csn=1">보안회사A</a></div>
  <div class="job_condition"><span>서울</span></div>
</div>
</body></html>
"""

def test_saramin_parse_returns_jobs():
    crawler = SaraminCrawler()
    jobs = crawler._parse(SAMPLE_HTML)
    assert len(jobs) == 1
    assert jobs[0].title == "보안 엔지니어"
    assert jobs[0].company == "보안회사A"
    assert jobs[0].location == "서울"
    assert jobs[0].source == "saramin"
    assert "saramin.co.kr" in jobs[0].url

def test_saramin_parse_skips_missing_fields():
    crawler = SaraminCrawler()
    html = "<html><body><div class='item_recruit'></div></body></html>"
    jobs = crawler._parse(html)
    assert jobs == []

@pytest.mark.asyncio
@respx.mock
async def test_saramin_fetch_returns_list():
    respx.get("https://www.saramin.co.kr/zf_user/search").mock(
        return_value=httpx.Response(200, text=SAMPLE_HTML)
    )
    crawler = SaraminCrawler()
    jobs = await crawler.fetch()
    assert isinstance(jobs, list)
    assert all(j.source == "saramin" for j in jobs)
