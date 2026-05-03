import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { fetchJobs, triggerCrawl, fetchBookmarks, addBookmark, removeBookmark, syncBookmarks, fetchCrawlStatus } from './api'
import { adaptJob } from './utils'
import { AuthProvider, useAuth } from './context/AuthContext'
import Header from './components/Header'
import Sidebar, { SidebarContent } from './components/Sidebar'
import JobList from './components/JobList'
import JobDetail from './components/JobDetail'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ResumePage from './pages/ResumePage'
import ResumeEditPage from './pages/ResumeEditPage'
import NewsPage from './pages/NewsPage'
import CertsPage from './pages/CertsPage'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640)
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return isMobile
}

function HomePage() {
  const { user, token, logout } = useAuth()
  const [rawJobs, setRawJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [crawling, setCrawling] = useState(false)
  const [crawlMsg, setCrawlMsg] = useState('')
  const [lastCrawlAt, setLastCrawlAt] = useState(null)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('dday')
  const [activeDomain, setActiveDomain] = useState('all')
  const [activeSource, setActiveSource] = useState('all')
  const [activeEnterprise, setActiveEnterprise] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [bookmarks, setBookmarks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bookmarks') || '{}') } catch { return {} }
  })
  const isMobile = useIsMobile()

  const jobs = useMemo(() => rawJobs.map(adaptJob), [rawJobs])
  const enterpriseCount = useMemo(() => jobs.filter(j => j.enterprise).length, [jobs])

  const filtered = useMemo(() => {
    let result = activeDomain === 'all' ? [...jobs] : jobs.filter(j => j.domain === activeDomain)
    if (activeSource === 'bookmarked') result = result.filter(j => bookmarks[j.id])
    else if (activeSource !== 'all') result = result.filter(j => j.source === activeSource)
    if (activeEnterprise) result = result.filter(j => j.enterprise)
    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(j =>
        j.company.toLowerCase().includes(q) ||
        j.title.toLowerCase().includes(q) ||
        j.domain.toLowerCase().includes(q) ||
        j.tags.some(t => t.toLowerCase().includes(q))
      )
    }
    if (sort === 'latest') result.sort((a, b) => new Date(b.posted) - new Date(a.posted))
    else if (sort === 'dday') result.sort((a, b) => {
      if (a.dday === null && b.dday === null) return 0
      if (a.dday === null) return 1
      if (b.dday === null) return -1
      return a.dday - b.dday
    })
    return result
  }, [jobs, activeDomain, activeSource, activeEnterprise, bookmarks, query, sort])

  const domainCounts = useMemo(() => {
    const c = {}
    jobs.forEach(j => { c[j.domain] = (c[j.domain] || 0) + 1 })
    return c
  }, [jobs])

  const bookmarkCount = useMemo(() => jobs.filter(j => bookmarks[j.id]).length, [jobs, bookmarks])

  const loadJobs = useCallback(async () => {
    try {
      const data = await fetchJobs()
      setRawJobs(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadJobs() }, [loadJobs])
  useEffect(() => {
    fetchCrawlStatus().then(d => setLastCrawlAt(d.last_crawl_at)).catch(() => {})
  }, [])

  // 로그인 시: localStorage 북마크 DB 동기화 후 DB 기준으로 전환
  useEffect(() => {
    if (!user || !token) return
    const localIds = Object.keys(bookmarks)
    const doSync = async () => {
      if (localIds.length > 0) await syncBookmarks(token, localIds).catch(() => {})
      const dbIds = await fetchBookmarks(token).catch(() => [])
      const next = {}
      dbIds.forEach(id => { next[id] = true })
      setBookmarks(next)
      localStorage.removeItem('bookmarks')
    }
    doSync()
  }, [user])

  const handleLogout = () => {
    logout()
    setBookmarks({})
    if (activeSource === 'bookmarked') setActiveSource('all')
  }

  const handleCrawl = async () => {
    setCrawling(true)
    setCrawlMsg('')
    try {
      const result = await triggerCrawl(token)
      setCrawlMsg(result.message)
      await loadJobs()
      fetchCrawlStatus().then(d => setLastCrawlAt(d.last_crawl_at)).catch(() => {})
    } catch {
      setCrawlMsg('수집 중 오류가 발생했습니다.')
    } finally {
      setCrawling(false)
    }
  }

  const toggleBookmark = async (id) => {
    const isBookmarked = !!bookmarks[id]
    // 낙관적 업데이트
    setBookmarks(b => {
      const next = { ...b, [id]: !b[id] }
      if (!next[id]) delete next[id]
      if (!user) localStorage.setItem('bookmarks', JSON.stringify(next))
      return next
    })
    if (user && token) {
      try {
        if (isBookmarked) await removeBookmark(token, id)
        else await addBookmark(token, id)
      } catch {
        // 실패 시 롤백
        setBookmarks(b => {
          const next = { ...b, [id]: isBookmarked }
          if (!next[id]) delete next[id]
          return next
        })
      }
    }
  }

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        query={query} setQuery={setQuery}
        onMenuClick={() => setMobileFiltersOpen(true)}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(s => !s)}
        isMobile={isMobile}
        onCrawl={handleCrawl}
        crawling={crawling}
        user={user}
        onLogout={handleLogout}
      />

      <div style={{
        display: 'grid', flex: 1, minHeight: 0, position: 'relative',
        gridTemplateColumns: isMobile ? '1fr' : (sidebarCollapsed ? '1fr' : '240px 1fr'),
        transition: 'grid-template-columns 0.25s ease',
      }}>
        {crawling && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 30,
            background: 'rgba(250,250,249,0.75)',
            backdropFilter: 'blur(2px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14,
            pointerEvents: 'all',
          }}>
            <span className="spin" style={{ display: 'inline-flex', color: 'var(--accent)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)' }}>공고 수집 중...</span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>사람인·원티드에서 최신 공고를 가져오고 있습니다</span>
          </div>
        )}
        {!isMobile && !sidebarCollapsed && (
          <Sidebar
            activeDomain={activeDomain}
            setActiveDomain={setActiveDomain}
            activeSource={activeSource}
            setActiveSource={setActiveSource}
            activeEnterprise={activeEnterprise}
            setActiveEnterprise={setActiveEnterprise}
            domainCounts={domainCounts}
            totalCount={jobs.length}
            bookmarkCount={bookmarkCount}
            enterpriseCount={enterpriseCount}
            lastCrawlAt={lastCrawlAt}
          />
        )}

        {isMobile && mobileFiltersOpen && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex' }}
            onClick={() => setMobileFiltersOpen(false)}
          >
            <div onClick={e => e.stopPropagation()} style={{ width: 280, background: 'var(--surface)', padding: 20, height: '100%', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>필터</span>
                <button onClick={() => setMobileFiltersOpen(false)} style={{ color: 'var(--text-2)', fontSize: 14 }}>닫기</button>
              </div>
              <SidebarContent
                activeDomain={activeDomain}
                setActiveDomain={d => { setActiveDomain(d); setMobileFiltersOpen(false) }}
                activeSource={activeSource}
                setActiveSource={s => { setActiveSource(s); setMobileFiltersOpen(false) }}
                activeEnterprise={activeEnterprise}
                setActiveEnterprise={v => { setActiveEnterprise(v); setMobileFiltersOpen(false) }}
                domainCounts={domainCounts}
                totalCount={jobs.length}
                bookmarkCount={bookmarkCount}
                enterpriseCount={enterpriseCount}
                lastCrawlAt={lastCrawlAt}
              />
            </div>
          </div>
        )}

        <main style={{ minWidth: 0, padding: isMobile ? '16px 16px 60px' : '28px 36px 60px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18, gap: 12 }}>
            <div>
              <h2 style={{ fontWeight: 700, letterSpacing: '-0.025em', margin: 0, display: 'flex', alignItems: 'baseline', gap: 10, fontSize: isMobile ? 19 : 24 }}>
                {activeDomain === 'all' ? '전체 보안 공고' : activeDomain}
                <span style={{ fontFamily: 'var(--font-en)', fontSize: 14, color: 'var(--text-3)', fontWeight: 500 }}>{filtered.length}</span>
              </h2>
              {!isMobile && (
                <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '6px 0 0' }}>
                  보안/정보보호 포지션을 자동 큐레이션합니다.
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
              {crawlMsg && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{crawlMsg}</span>}
              <SortSelect value={sort} onChange={setSort} />
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)', fontSize: 14 }}>로딩 중...</div>
          ) : (
            <JobList
              jobs={filtered}
              isMobile={isMobile}
              bookmarks={bookmarks}
              onBookmark={toggleBookmark}
            />
          )}
        </main>
      </div>

      <footer style={{
        borderTop: '1px solid var(--border)',
        background: 'var(--surface)',
        padding: '20px 36px',
        textAlign: 'center',
      }}>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.8 }}>
          본 서비스는 개인 용도의 비영리 채용 공고 모니터링 도구입니다.
          방문자의 개인정보 및 행동 데이터를 일체 수집하지 않습니다.
          <br />
          수집된 채용 공고의 저작권은 각 원본 게시처에 있으며, 상업적 이용을 금합니다.
        </p>
      </footer>
    </div>
  )
}

function SortSelect({ value, onChange }) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          appearance: 'none', fontFamily: 'var(--font-kr)',
          fontSize: 13, fontWeight: 500, color: 'var(--text)',
          background: 'transparent', border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)', padding: '8px 30px 8px 12px', cursor: 'pointer',
        }}
      >
        <option value="latest">최신순</option>
        <option value="dday">마감임박순</option>
      </select>
      <div style={{ position: 'absolute', right: 10, pointerEvents: 'none', color: 'var(--text-3)', display: 'flex' }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/resume" element={<ResumePage />} />
          <Route path="/resume/edit" element={<ResumeEditPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/certs" element={<CertsPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

function JobDetailPage() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <JobDetail />
    </div>
  )
}
