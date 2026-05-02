import asyncio
import html
import re
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

import httpx

from backend.crawlers.base import BROWSER_HEADERS, fetch_with_retry

@dataclass
class NewsData:
    title: str
    url: str
    source: str
    summary: str
    published_at: datetime
    category: str

RSS_SOURCES = [
    ('bleepingcomputer', 'https://www.bleepingcomputer.com/feed/'),
    ('thehackernews',    'https://feeds.feedburner.com/TheHackersNews'),
    ('cisa',             'https://www.cisa.gov/cybersecurity-advisories/all.xml'),
    ('boannews',         'https://www.boannews.com/media/boannews_rss.xml'),
    ('dailysecu',        'https://www.dailysecu.com/rss/allArticle.xml'),
]

_CATEGORY_RULES = [
    ('vuln',       re.compile(r'CVE|취약점|vulnerability|vulnerabilit|exploit|patch|RCE|zero.?day|advisory', re.I)),
    ('ransomware', re.compile(r'랜섬웨어|ransomware|ransom', re.I)),
    ('breach',     re.compile(r'침해|유출|breach|leak|data breach|해킹|hacked|compromised', re.I)),
    ('malware',    re.compile(r'악성코드|malware|trojan|backdoor|spyware|botnet|infostealer|stealer', re.I)),
    ('policy',     re.compile(r'규제|정책|법안|GDPR|개인정보|compliance|ISMS|ISO.?27001|NIS2|legislation', re.I)),
]

def _classify(title: str, summary: str = '') -> str:
    text = f"{title} {summary}"
    for cat, pattern in _CATEGORY_RULES:
        if pattern.search(text):
            return cat
    return 'general'

def _clean_html(text: str) -> str:
    if not text:
        return ''
    text = html.unescape(text)
    text = re.sub(r'<[^>]+>', '', text)
    return re.sub(r'\s+', ' ', text).strip()[:250]

def _parse_date(text: str) -> datetime:
    if not text:
        return datetime.utcnow()
    text = text.strip()
    try:
        dt = parsedate_to_datetime(text)
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    except Exception:
        pass
    try:
        dt = datetime.fromisoformat(text.replace('Z', '+00:00'))
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    except Exception:
        pass
    return datetime.utcnow()

def _parse_feed(text: str, source: str) -> list[NewsData]:
    items: list[NewsData] = []
    try:
        root = ET.fromstring(text)
    except ET.ParseError:
        return items

    # RSS 2.0 — <item> elements
    for item in root.findall('.//item'):
        title = (item.findtext('title') or '').strip()
        url = (item.findtext('link') or '').strip()
        if not url:
            el = item.find('link')
            url = (el.get('href', '') or el.text or '').strip() if el is not None else ''
        pub = (
            item.findtext('pubDate') or
            item.findtext('{http://purl.org/dc/elements/1.1/}date') or ''
        )
        desc = (
            item.findtext('{http://purl.org/rss/1.0/modules/content/}encoded') or
            item.findtext('description') or ''
        )
        if not title or not url:
            continue
        summary = _clean_html(desc)
        items.append(NewsData(
            title=title, url=url, source=source,
            summary=summary, published_at=_parse_date(pub),
            category=_classify(title, summary),
        ))

    # Atom — <entry> elements
    ns = '{http://www.w3.org/2005/Atom}'
    for entry in root.findall(f'{ns}entry'):
        title = (entry.findtext(f'{ns}title') or '').strip()
        url = ''
        for link in entry.findall(f'{ns}link'):
            if link.get('rel', 'alternate') in ('alternate', '') and link.get('href'):
                url = link.get('href', '')
                break
        pub = entry.findtext(f'{ns}published') or entry.findtext(f'{ns}updated') or ''
        summary_el = entry.find(f'{ns}summary') or entry.find(f'{ns}content')
        desc = (summary_el.text or '') if summary_el is not None else ''
        if not title or not url:
            continue
        summary = _clean_html(desc)
        items.append(NewsData(
            title=title, url=url, source=source,
            summary=summary, published_at=_parse_date(pub),
            category=_classify(title, summary),
        ))

    return items


class NewsCrawler:
    async def fetch(self) -> list[NewsData]:
        all_items: list[NewsData] = []
        async with httpx.AsyncClient(
            headers=BROWSER_HEADERS, timeout=15, follow_redirects=True
        ) as client:
            results = await asyncio.gather(
                *[self._fetch_source(client, src, url) for src, url in RSS_SOURCES],
                return_exceptions=True,
            )
        for result in results:
            if isinstance(result, list):
                all_items.extend(result)
        return all_items

    async def _fetch_source(
        self, client: httpx.AsyncClient, source: str, url: str
    ) -> list[NewsData]:
        try:
            resp = await fetch_with_retry(client, url)
            if resp is None:
                return []
            return _parse_feed(resp.text, source)
        except Exception:
            return []
