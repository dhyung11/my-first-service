# Security Job Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a web service that collects security/infosec job postings from Saramin, Jobkorea, and Wanted, and displays them in a list/detail UI backed by PostgreSQL on Railway.

**Architecture:** FastAPI serves both the REST API and the React SPA static build from a single Railway deployment. A PostgreSQL database stores job postings deduplicated by URL. Crawlers run on-demand when the user clicks "수집 시작" which calls `POST /api/crawl`.

**Tech Stack:** Python 3.11, FastAPI, SQLAlchemy (async), asyncpg, aiosqlite (tests), httpx, BeautifulSoup4, respx (test mocking), React 18, Vite, React Router v6, Railway + PostgreSQL

> **venv 전제조건:** Task 1에서 프로젝트 루트에 `.venv`를 생성합니다. Task 2 이후 모든 `pytest`, `uvicorn`, `pip` 명령은 `.venv`가 활성화된 상태에서 실행합니다.
> - Windows: `.venv\Scripts\activate`
> - macOS/Linux: `source .venv/bin/activate`

---

## File Map

```
my-first-service/
├── backend/
│   ├── main.py                    # FastAPI app, CORS, static serving, lifespan
│   ├── database.py                # async engine, session factory, Base, init_db
│   ├── models.py                  # SQLAlchemy Job model
│   ├── schemas.py                 # Pydantic JobRead, CrawlResult
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── jobs.py                # GET /api/jobs, GET /api/jobs/{id}
│   │   └── crawl.py               # POST /api/crawl, save_job helper
│   ├── crawlers/
│   │   ├── __init__.py
│   │   ├── base.py                # BaseCrawler ABC, JobData dataclass
│   │   ├── saramin.py             # Saramin HTML crawler
│   │   ├── jobkorea.py            # Jobkorea HTML crawler
│   │   └── wanted.py              # Wanted REST API crawler
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py            # pytest fixtures: engine, db_session, client
│   │   ├── test_jobs_api.py       # jobs router tests
│   │   ├── test_crawl_api.py      # crawl router tests
│   │   ├── test_saramin.py        # saramin parse + fetch tests
│   │   ├── test_jobkorea.py       # jobkorea parse + fetch tests
│   │   └── test_wanted.py         # wanted parse + fetch tests
│   ├── pytest.ini
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api.js                 # fetch wrappers for /api/*
│       └── components/
│           ├── Header.jsx
│           ├── CrawlButton.jsx
│           ├── JobList.jsx
│           ├── JobCard.jsx
│           └── JobDetail.jsx
├── Dockerfile
├── .env.example
└── .gitignore
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/pytest.ini`
- Create: `frontend/package.json`
- Create: `.env.example`
- Create: `.gitignore`

- [ ] **Step 1: Create backend/requirements.txt**

```
fastapi==0.115.0
uvicorn[standard]==0.30.0
sqlalchemy[asyncio]==2.0.35
asyncpg==0.29.0
aiosqlite==0.20.0
httpx==0.27.0
beautifulsoup4==4.12.3
pydantic==2.9.0
python-dotenv==1.0.1
pytest==8.3.0
pytest-asyncio==0.24.0
respx==0.21.1
```

- [ ] **Step 2: Create backend/pytest.ini**

```ini
[pytest]
asyncio_mode = auto
testpaths = tests
```

- [ ] **Step 3: Create frontend/package.json**

```json
{
  "name": "security-jobs-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^5.4.0"
  }
}
```

- [ ] **Step 4: Create .env.example**

```
# Railway 대시보드 → PostgreSQL 서비스 → Variables 탭에서 DATABASE_URL 복사
# 형식 예시: postgresql://postgres:password@host.railway.internal:5432/railway
# database.py가 postgresql:// → postgresql+asyncpg:// 로 자동 변환함
DATABASE_URL=postgresql+asyncpg://user:password@host.railway.internal:5432/railway
ALLOWED_ORIGINS=http://localhost:5173
```

> **로컬 개발 준비 순서:** Task 18(Step 1~3)에서 Railway 프로젝트와 PostgreSQL을 먼저 생성한 뒤 발급된 `DATABASE_URL`을 `.env` 파일에 복사하세요. Docker나 PostgreSQL 로컬 설치는 불필요합니다.

- [ ] **Step 5: Create .gitignore**

```
__pycache__/
*.pyc
.env
*.db
.venv/
node_modules/
dist/
backend/static/
.pytest_cache/
```

- [ ] **Step 6: Create empty __init__.py files**

```bash
touch backend/__init__.py backend/routers/__init__.py backend/crawlers/__init__.py backend/tests/__init__.py
```

- [ ] **Step 7: Create venv and install dependencies**

```bash
# 프로젝트 루트에서 venv 생성
python -m venv .venv

# 활성화 (Windows)
.venv\Scripts\activate

# 백엔드 패키지 설치
pip install -r backend/requirements.txt

# 프론트엔드 패키지 설치
cd frontend && npm install && cd ..
```

> 이후 모든 `pytest`, `uvicorn` 명령은 `.venv` 활성화 상태에서 실행합니다.
> VS Code 사용 시: `Ctrl+Shift+P` → "Python: Select Interpreter" → `.venv` 선택

- [ ] **Step 8: Commit**

```bash
git init
git add .
git commit -m "chore: project scaffold"
```

---

## Task 2: Database Layer

**Files:**
- Create: `backend/database.py`
- Create: `backend/models.py`

- [ ] **Step 1: Create backend/database.py**

```python
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./jobs.db")

if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(DATABASE_URL)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
```

- [ ] **Step 2: Create backend/models.py**

```python
import uuid
from datetime import date, datetime
from typing import Optional
from sqlalchemy import String, Text, Date, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from backend.database import Base

class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(Text, nullable=False)
    company: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[Optional[str]] = mapped_column(Text)
    source: Mapped[str] = mapped_column(String(50), nullable=False)
    url: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    deadline: Mapped[Optional[date]] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
```

- [ ] **Step 3: Commit**

```bash
git add backend/database.py backend/models.py
git commit -m "feat: database layer and Job model"
```

---

## Task 3: Pydantic Schemas

**Files:**
- Create: `backend/schemas.py`

- [ ] **Step 1: Create backend/schemas.py**

```python
from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

class JobRead(BaseModel):
    id: str
    title: str
    company: str
    location: Optional[str] = None
    source: str
    url: str
    description: Optional[str] = None
    deadline: Optional[date] = None
    created_at: datetime

    model_config = {"from_attributes": True}

class CrawlResult(BaseModel):
    new_jobs: int
    message: str
```

- [ ] **Step 2: Commit**

```bash
git add backend/schemas.py
git commit -m "feat: pydantic schemas"
```

---

## Task 4: Test Infrastructure

**Files:**
- Create: `backend/tests/conftest.py`

- [ ] **Step 1: Create backend/tests/conftest.py**

```python
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from backend.database import Base, get_db

TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

@pytest_asyncio.fixture
async def engine():
    _engine = create_async_engine(TEST_DATABASE_URL)
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield _engine
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await _engine.dispose()

@pytest_asyncio.fixture
async def db_session(engine):
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session

@pytest_asyncio.fixture
async def client(db_session):
    from backend.main import app

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
```

- [ ] **Step 2: Commit**

```bash
git add backend/tests/conftest.py
git commit -m "test: pytest fixtures with in-memory SQLite"
```

---

## Task 5: Jobs Router

**Files:**
- Create: `backend/routers/jobs.py`
- Create: `backend/tests/test_jobs_api.py`

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/test_jobs_api.py`:

```python
import pytest
from backend.models import Job

@pytest.mark.asyncio
async def test_list_jobs_empty(client):
    resp = await client.get("/api/jobs")
    assert resp.status_code == 200
    assert resp.json() == []

@pytest.mark.asyncio
async def test_list_jobs_returns_all(client, db_session):
    job = Job(title="보안 엔지니어", company="테스트 회사", url="https://example.com/1", source="saramin")
    db_session.add(job)
    await db_session.commit()

    resp = await client.get("/api/jobs")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["title"] == "보안 엔지니어"
    assert data[0]["company"] == "테스트 회사"

@pytest.mark.asyncio
async def test_get_job_detail(client, db_session):
    job = Job(title="취약점 분석가", company="보안 회사", url="https://example.com/2", source="jobkorea")
    db_session.add(job)
    await db_session.commit()
    await db_session.refresh(job)

    resp = await client.get(f"/api/jobs/{job.id}")
    assert resp.status_code == 200
    assert resp.json()["title"] == "취약점 분석가"

@pytest.mark.asyncio
async def test_get_job_not_found(client):
    resp = await client.get("/api/jobs/nonexistent-id")
    assert resp.status_code == 404
```

- [ ] **Step 2: Run to verify tests fail**

```bash
cd backend && pytest tests/test_jobs_api.py -v
```

Expected: ImportError or 404/connection errors (main.py not yet created).

- [ ] **Step 3: Create backend/routers/jobs.py**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.database import get_db
from backend.models import Job
from backend.schemas import JobRead

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

@router.get("", response_model=list[JobRead])
async def list_jobs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Job).order_by(Job.created_at.desc()))
    return result.scalars().all()

@router.get("/{job_id}", response_model=JobRead)
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
```

- [ ] **Step 4: Create minimal backend/main.py to unblock tests**

```python
from fastapi import FastAPI
from backend.routers import jobs, crawl

app = FastAPI()
app.include_router(jobs.router)
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd backend && pytest tests/test_jobs_api.py -v
```

Expected: 4 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/routers/jobs.py backend/tests/test_jobs_api.py
git commit -m "feat: GET /api/jobs and GET /api/jobs/{id}"
```

---

## Task 6: Base Crawler

**Files:**
- Create: `backend/crawlers/base.py`

- [ ] **Step 1: Create backend/crawlers/base.py**

```python
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
```

- [ ] **Step 2: Write tests for fetch_with_retry**

Create `backend/tests/test_base_crawler.py`:

```python
import pytest
import respx
import httpx
from backend.crawlers.base import fetch_with_retry

@pytest.mark.asyncio
@respx.mock
async def test_fetch_with_retry_success():
    respx.get("https://example.com").mock(return_value=httpx.Response(200, text="ok"))
    async with httpx.AsyncClient() as client:
        resp = await fetch_with_retry(client, "https://example.com")
    assert resp is not None
    assert resp.status_code == 200

@pytest.mark.asyncio
@respx.mock
async def test_fetch_with_retry_returns_none_on_429(monkeypatch):
    # 429를 max_retries번 반환하면 None을 반환해야 함
    monkeypatch.setattr("backend.crawlers.base.asyncio.sleep", lambda _: None)
    respx.get("https://example.com").mock(return_value=httpx.Response(429))
    async with httpx.AsyncClient() as client:
        resp = await fetch_with_retry(client, "https://example.com", max_retries=2)
    assert resp is None

@pytest.mark.asyncio
@respx.mock
async def test_fetch_with_retry_succeeds_on_second_attempt(monkeypatch):
    monkeypatch.setattr("backend.crawlers.base.asyncio.sleep", lambda _: None)
    respx.get("https://example.com").mock(side_effect=[
        httpx.Response(503),
        httpx.Response(200, text="ok"),
    ])
    async with httpx.AsyncClient() as client:
        resp = await fetch_with_retry(client, "https://example.com")
    assert resp is not None
    assert resp.status_code == 200
```

- [ ] **Step 3: Run to verify tests pass**

```bash
cd backend && pytest tests/test_base_crawler.py -v
```

Expected: 3 tests PASS.

- [ ] **Step 4: Commit**

```bash
git add backend/crawlers/base.py backend/tests/test_base_crawler.py
git commit -m "feat: BaseCrawler with fetch_with_retry and polite_sleep"
```

---

## Task 7: Saramin Crawler

**Files:**
- Create: `backend/crawlers/saramin.py`
- Create: `backend/tests/test_saramin.py`

> **Note:** HTML selectors are based on Saramin's structure as of 2024. If crawling returns empty results, inspect the live page and update the selectors in `_parse()`.

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/test_saramin.py`:

```python
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
```

- [ ] **Step 2: Run to verify tests fail**

```bash
cd backend && pytest tests/test_saramin.py -v
```

Expected: ImportError — `saramin.py` does not exist yet.

- [ ] **Step 3: Create backend/crawlers/saramin.py**

```python
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
                    await polite_sleep()  # 키워드 간 1.5~3초 대기
                resp = await fetch_with_retry(client, SEARCH_URL, params={"searchword": keyword, "recruitPage": 1})
                if resp is not None:
                    jobs.extend(self._parse(resp.text))
        return self._deduplicate(jobs)

    def _parse(self, html: str) -> list[JobData]:
        soup = BeautifulSoup(html, "html.parser")
        results = []
        for item in soup.select("div.item_recruit"):
            try:
                title_tag = item.select_one(".recruit_tit .job_tit a")
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd backend && pytest tests/test_saramin.py -v
```

Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/crawlers/saramin.py backend/tests/test_saramin.py
git commit -m "feat: saramin crawler"
```

---

## Task 8: Jobkorea Crawler

**Files:**
- Create: `backend/crawlers/jobkorea.py`
- Create: `backend/tests/test_jobkorea.py`

> **Note:** If crawling returns empty results, inspect the live Jobkorea search page and update selectors in `_parse()`.

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/test_jobkorea.py`:

```python
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
```

- [ ] **Step 2: Run to verify tests fail**

```bash
cd backend && pytest tests/test_jobkorea.py -v
```

Expected: ImportError.

- [ ] **Step 3: Create backend/crawlers/jobkorea.py**

```python
import httpx
from bs4 import BeautifulSoup
from backend.crawlers.base import BaseCrawler, JobData, BROWSER_HEADERS, fetch_with_retry, polite_sleep

KEYWORDS = ["정보보안", "보안관제", "취약점분석"]
SEARCH_URL = "https://www.jobkorea.co.kr/Search/"
BASE_URL = "https://www.jobkorea.co.kr"

class JobkoreaCrawler(BaseCrawler):
    async def fetch(self) -> list[JobData]:
        jobs: list[JobData] = []
        async with httpx.AsyncClient(
            headers=BROWSER_HEADERS,
            follow_redirects=True,
            timeout=15,
        ) as client:
            for i, keyword in enumerate(KEYWORDS):
                if i > 0:
                    await polite_sleep()  # 키워드 간 1.5~3초 대기
                resp = await fetch_with_retry(client, SEARCH_URL, params={"stext": keyword})
                if resp is not None:
                    jobs.extend(self._parse(resp.text))
        return self._deduplicate(jobs)

    def _parse(self, html: str) -> list[JobData]:
        soup = BeautifulSoup(html, "html.parser")
        results = []
        for item in soup.select("li.recruit-info"):
            try:
                title_tag = item.select_one(".job-tit a")
                company_tag = item.select_one(".cpn-name a")
                if not title_tag or not company_tag:
                    continue
                title = title_tag.get_text(strip=True)
                company = company_tag.get_text(strip=True)
                href = title_tag.get("href", "")
                url = f"{BASE_URL}{href}" if href.startswith("/") else href
                location_tag = item.select_one(".job-condition .option")
                location = location_tag.get_text(strip=True) if location_tag else None
                results.append(JobData(title=title, company=company, url=url, source="jobkorea", location=location))
            except Exception:
                continue
        return results
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd backend && pytest tests/test_jobkorea.py -v
```

Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/crawlers/jobkorea.py backend/tests/test_jobkorea.py
git commit -m "feat: jobkorea crawler"
```

---

## Task 9: Wanted Crawler

**Files:**
- Create: `backend/crawlers/wanted.py`
- Create: `backend/tests/test_wanted.py`

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/test_wanted.py`:

```python
import pytest
import respx
import httpx
import json
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
```

- [ ] **Step 2: Run to verify tests fail**

```bash
cd backend && pytest tests/test_wanted.py -v
```

Expected: ImportError.

- [ ] **Step 3: Create backend/crawlers/wanted.py**

```python
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
                    await polite_sleep()  # 키워드 간 1.5~3초 대기
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd backend && pytest tests/test_wanted.py -v
```

Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/crawlers/wanted.py backend/tests/test_wanted.py
git commit -m "feat: wanted crawler"
```

---

## Task 10: Crawl Router

**Files:**
- Create: `backend/routers/crawl.py`
- Create: `backend/tests/test_crawl_api.py`

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/test_crawl_api.py`:

```python
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
```

- [ ] **Step 2: Run to verify tests fail**

```bash
cd backend && pytest tests/test_crawl_api.py -v
```

Expected: ImportError or 404.

- [ ] **Step 3: Create backend/routers/crawl.py**

```python
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd backend && pytest tests/test_crawl_api.py -v
```

Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/routers/crawl.py backend/tests/test_crawl_api.py
git commit -m "feat: POST /api/crawl router"
```

---

## Task 11: FastAPI Main App

**Files:**
- Modify: `backend/main.py`

- [ ] **Step 1: Replace the stub main.py with the full version**

```python
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from backend.database import init_db
from backend.routers import jobs, crawl

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs.router)
app.include_router(crawl.router)

static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.isdir(static_dir):
    assets_dir = os.path.join(static_dir, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        return FileResponse(os.path.join(static_dir, "index.html"))
```

- [ ] **Step 2: Run all backend tests**

```bash
cd backend && pytest -v
```

Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add backend/main.py
git commit -m "feat: FastAPI app with CORS, lifespan, static serving"
```

---

## Task 12: Frontend Scaffold

**Files:**
- Create: `frontend/index.html`
- Create: `frontend/vite.config.js`
- Create: `frontend/src/main.jsx`

- [ ] **Step 1: Create frontend/index.html**

```html
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>보안 채용 공고</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Create frontend/vite.config.js**

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000'
    }
  },
  build: {
    outDir: '../backend/static',
    emptyOutDir: true
  }
})
```

- [ ] **Step 3: Create frontend/src/main.jsx**

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

- [ ] **Step 4: Verify Vite dev server starts**

```bash
cd frontend && npm run dev
```

Expected: Server starts at http://localhost:5173 (App.jsx not yet created, will show error — that's OK).

- [ ] **Step 5: Commit**

```bash
git add frontend/index.html frontend/vite.config.js frontend/src/main.jsx
git commit -m "feat: frontend scaffold"
```

---

## Task 13: API Client and App Router

**Files:**
- Create: `frontend/src/api.js`
- Create: `frontend/src/App.jsx`

- [ ] **Step 1: Create frontend/src/api.js**

```javascript
const BASE = '/api'

export async function fetchJobs() {
  const res = await fetch(`${BASE}/jobs`)
  if (!res.ok) throw new Error('Failed to fetch jobs')
  return res.json()
}

export async function fetchJob(id) {
  const res = await fetch(`${BASE}/jobs/${id}`)
  if (!res.ok) throw new Error('Job not found')
  return res.json()
}

export async function triggerCrawl() {
  const res = await fetch(`${BASE}/crawl`, { method: 'POST' })
  if (!res.ok) throw new Error('Crawl failed')
  return res.json()
}
```

- [ ] **Step 2: Create frontend/src/App.jsx**

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { fetchJobs } from './api'
import Header from './components/Header'
import CrawlButton from './components/CrawlButton'
import JobList from './components/JobList'
import JobDetail from './components/JobDetail'

function HomePage() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  const loadJobs = async () => {
    try {
      const data = await fetchJobs()
      setJobs(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadJobs() }, [])

  return (
    <>
      <CrawlButton onCrawlComplete={loadJobs} />
      {loading ? <p>로딩 중...</p> : <JobList jobs={jobs} />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/api.js frontend/src/App.jsx
git commit -m "feat: API client and App router"
```

---

## Task 14: Header, JobCard, JobList Components

**Files:**
- Create: `frontend/src/components/Header.jsx`
- Create: `frontend/src/components/JobCard.jsx`
- Create: `frontend/src/components/JobList.jsx`

- [ ] **Step 1: Create frontend/src/components/Header.jsx**

```jsx
export default function Header() {
  return (
    <header style={{ background: '#1a1a2e', color: 'white', padding: '1rem 2rem' }}>
      <h1 style={{ margin: 0, fontSize: '1.5rem' }}>🔐 보안 채용 공고</h1>
    </header>
  )
}
```

- [ ] **Step 2: Create frontend/src/components/JobCard.jsx**

```jsx
import { useNavigate } from 'react-router-dom'

const SOURCE_LABELS = { saramin: '사람인', jobkorea: '잡코리아', wanted: 'Wanted' }
const SOURCE_COLORS = { saramin: '#e8f0fe', jobkorea: '#fce8e6', wanted: '#e6f4ea' }

export default function JobCard({ job }) {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => navigate(`/jobs/${job.id}`)}
      style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '0.75rem',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s',
      }}
      onMouseOver={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'}
      onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}
    >
      <h3 style={{ margin: '0 0 0.4rem' }}>{job.title}</h3>
      <p style={{ margin: '0 0 0.5rem', color: '#555' }}>
        {job.company} · {job.location || '위치 미상'}
      </p>
      <div>
        <span style={{
          background: SOURCE_COLORS[job.source] || '#f0f0f0',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '0.8rem',
        }}>
          {SOURCE_LABELS[job.source] || job.source}
        </span>
        {job.deadline && (
          <span style={{ marginLeft: '0.75rem', fontSize: '0.85rem', color: '#888' }}>
            마감: {job.deadline}
          </span>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create frontend/src/components/JobList.jsx**

```jsx
import JobCard from './JobCard'

export default function JobList({ jobs }) {
  if (jobs.length === 0) {
    return (
      <p style={{ color: '#888', textAlign: 'center', marginTop: '2rem' }}>
        공고가 없습니다. 수집 버튼을 눌러 최신 공고를 가져오세요.
      </p>
    )
  }
  return (
    <div>
      <p style={{ color: '#666', marginBottom: '0.75rem' }}>총 {jobs.length}개 공고</p>
      {jobs.map(job => <JobCard key={job.id} job={job} />)}
    </div>
  )
}
```

- [ ] **Step 4: Check dev server shows the list page**

With backend running (`uvicorn backend.main:app --reload` from the project root), open http://localhost:5173 and verify the header and empty state message appear.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/Header.jsx frontend/src/components/JobCard.jsx frontend/src/components/JobList.jsx
git commit -m "feat: Header, JobCard, JobList components"
```

---

## Task 15: CrawlButton and JobDetail Components

**Files:**
- Create: `frontend/src/components/CrawlButton.jsx`
- Create: `frontend/src/components/JobDetail.jsx`

- [ ] **Step 1: Create frontend/src/components/CrawlButton.jsx**

```jsx
import { useState } from 'react'
import { triggerCrawl } from '../api'

export default function CrawlButton({ onCrawlComplete }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleCrawl = async () => {
    setLoading(true)
    setMessage('')
    try {
      const result = await triggerCrawl()
      setMessage(result.message)
      await onCrawlComplete()
    } catch {
      setMessage('수집 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <button
        onClick={handleCrawl}
        disabled={loading}
        style={{
          padding: '0.5rem 1.25rem',
          background: loading ? '#ccc' : '#1a1a2e',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '0.95rem',
        }}
      >
        {loading ? '수집 중...' : '수집 시작'}
      </button>
      {message && <span style={{ color: '#555', fontSize: '0.9rem' }}>{message}</span>}
    </div>
  )
}
```

- [ ] **Step 2: Create frontend/src/components/JobDetail.jsx**

```jsx
import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { fetchJob } from '../api'

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchJob(id)
      .then(setJob)
      .catch(() => setError('공고를 찾을 수 없습니다.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p>로딩 중...</p>
  if (error) return <p style={{ color: 'red' }}>{error}</p>

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        style={{ marginBottom: '1.5rem', cursor: 'pointer', background: 'none', border: '1px solid #ccc', borderRadius: '4px', padding: '4px 12px' }}
      >
        ← 목록으로
      </button>
      <h2 style={{ marginBottom: '0.5rem' }}>{job.title}</h2>
      <p style={{ color: '#555', marginBottom: '0.5rem' }}>
        <strong>{job.company}</strong> · {job.location || '위치 미상'}
      </p>
      {job.deadline && <p style={{ color: '#888' }}>마감일: {job.deadline}</p>}
      {job.description && (
        <div style={{ margin: '1rem 0', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
          {job.description}
        </div>
      )}
      <a href={job.url} target="_blank" rel="noopener noreferrer">
        <button style={{
          padding: '0.5rem 1.25rem',
          background: '#1a1a2e',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
        }}>
          원본 공고 보기 →
        </button>
      </a>
    </div>
  )
}
```

- [ ] **Step 3: Manual smoke test**

With both servers running:
1. Open http://localhost:5173
2. Click "수집 시작" — should show loading, then a count message
3. Verify job cards appear in list
4. Click a card — should navigate to `/jobs/:id` with detail view
5. Click "원본 공고 보기" — should open the source URL

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/CrawlButton.jsx frontend/src/components/JobDetail.jsx
git commit -m "feat: CrawlButton and JobDetail components"
```

---

## Task 16: Build Integration

Verify that the React build is served correctly by FastAPI.

- [ ] **Step 1: Build the frontend**

```bash
cd frontend && npm run build
```

Expected: Creates `backend/static/` with `index.html` and `assets/`.

- [ ] **Step 2: Start FastAPI alone (no Vite) and verify SPA is served**

`.env` 파일에 Railway DATABASE_URL이 설정되어 있어야 합니다 (Task 18 Step 1~3 완료 후).

```bash
cd backend && uvicorn main:app --reload --port 8000
```

Open http://localhost:8000 — should serve the React app. Navigate to a job detail page and refresh — should still serve `index.html` (SPA fallback).

- [ ] **Step 3: Commit**

```bash
git add backend/static
git commit -m "chore: include production frontend build"
```

---

## Task 17: Dockerfile

**Files:**
- Create: `Dockerfile`

- [ ] **Step 1: Create Dockerfile**

```dockerfile
# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-build
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage 2: Python backend
FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .
COPY --from=frontend-build /frontend/dist ./static
ENV PORT=8000
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
```

- [ ] **Step 2: (선택) Docker가 설치된 경우 로컬 빌드 검증**

> Docker가 없으면 이 단계를 건너뛰세요. Railway가 서버에서 직접 Dockerfile을 빌드하므로 로컬 Docker는 필수가 아닙니다.

```bash
docker build -t security-jobs .
```

Expected: Build succeeds without errors.

- [ ] **Step 3: Commit**

```bash
git add Dockerfile
git commit -m "feat: multi-stage Dockerfile"
```

---

## Task 18: Railway Setup and Deployment

> **이 태스크를 Task 1 직후에 먼저 진행하세요.** Railway PostgreSQL URL이 있어야 로컬 개발을 시작할 수 있습니다.

- [ ] **Step 1: Railway 프로젝트 생성**

1. https://railway.app 에서 GitHub 계정으로 로그인
2. "New Project" → "Empty Project" 클릭
3. 프로젝트 이름 지정 (예: `security-jobs`)

- [ ] **Step 2: PostgreSQL 추가 및 DATABASE_URL 복사**

1. Railway 대시보드에서 "New Service" → "Database" → "PostgreSQL" 클릭
2. PostgreSQL 서비스 클릭 → "Variables" 탭 이동
3. `DATABASE_URL` 값을 복사
4. 프로젝트 루트에 `.env` 파일 생성:

```bash
# .env (절대 git에 커밋하지 말 것 — .gitignore에 이미 포함됨)
DATABASE_URL=<Railway에서 복사한 URL>
ALLOWED_ORIGINS=http://localhost:5173
```

`database.py`가 `postgresql://` → `postgresql+asyncpg://` 로 자동 변환하므로 복사한 URL을 그대로 붙여넣으면 됩니다.

- [ ] **Step 3: 로컬에서 DB 연결 확인**

```bash
cd backend && uvicorn main:app --reload --port 8000
```

Expected: 서버 시작 시 `init_db()` 가 실행되고 Railway PostgreSQL에 `jobs` 테이블 자동 생성.

- [ ] **Step 4: GitHub에 코드 푸시 및 Railway 자동 배포 연결**

```bash
git remote add origin https://github.com/<your-username>/my-first-service.git
git push -u origin main
```

Railway 대시보드: "New Service" → "GitHub Repo" → `my-first-service` 선택. Dockerfile을 자동 감지하여 빌드 시작.

- [ ] **Step 5: 배포 확인**

1. Railway 대시보드에서 빌드 완료 대기 (~3-5분)
2. 생성된 URL 클릭
3. React 앱이 표시되는지 확인
4. "수집 시작" 클릭 → 공고 수집 후 목록 표시 확인
5. 공고 클릭 → 상세 페이지 확인

---

## Self-Review Notes

- **Spec coverage:** All spec sections covered — architecture ✓, data model ✓, API endpoints ✓, crawlers ✓, UI ✓, deployment ✓
- **Placeholder scan:** No TBDs. HTML selectors noted as needing live verification (unavoidable for scrapers)
- **Type consistency:** `JobData` defined in Task 6, used consistently in Tasks 7-10. `JobRead` defined in Task 3, used in Tasks 5 and 10. `save_job()` defined and used within `crawl.py`
- **Crawler note:** Saramin and Jobkorea HTML selectors are based on known page structure. If they return empty results after deployment, inspect the live DOM and update selectors in `_parse()` — this is normal maintenance for scrapers
