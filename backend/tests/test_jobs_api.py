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
