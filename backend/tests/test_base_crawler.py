import pytest
import respx
import httpx
from unittest.mock import AsyncMock
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
    monkeypatch.setattr("backend.crawlers.base.asyncio.sleep", AsyncMock(return_value=None))
    respx.get("https://example.com").mock(return_value=httpx.Response(429))
    async with httpx.AsyncClient() as client:
        resp = await fetch_with_retry(client, "https://example.com", max_retries=2)
    assert resp is None

@pytest.mark.asyncio
@respx.mock
async def test_fetch_with_retry_succeeds_on_second_attempt(monkeypatch):
    monkeypatch.setattr("backend.crawlers.base.asyncio.sleep", AsyncMock(return_value=None))
    respx.get("https://example.com").mock(side_effect=[
        httpx.Response(503),
        httpx.Response(200, text="ok"),
    ])
    async with httpx.AsyncClient() as client:
        resp = await fetch_with_retry(client, "https://example.com")
    assert resp is not None
    assert resp.status_code == 200
