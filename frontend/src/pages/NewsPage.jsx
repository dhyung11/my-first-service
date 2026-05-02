import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchNews, triggerNewsFetch } from '../api'
import { Icon } from '../icons'
import { useIsMobile } from '../utils'

/* ── constants ───────────────────────────────────────── */

const SOURCE_LABELS = {
  bleepingcomputer: 'BleepingComputer',
  thehackernews: 'The Hacker News',
  cisa: 'CISA',
  boannews: '보안뉴스',
  dailysecu: '데일리시큐',
}

const CATEGORY_META = {
  vuln:       { label: '취약점',   bg: 'var(--urgent-soft)',          color: 'var(--urgent)' },
  ransomware: { label: '랜섬웨어', bg: '#FDF0E8',                     color: '#B85000' },
  breach:     { label: '침해사고', bg: 'var(--domain-secops-soft)',    color: 'var(--domain-secops)' },
  malware:    { label: '악성코드', bg: 'var(--domain-grc-soft)',       color: 'var(--domain-grc)' },
  policy:     { label: '정책/규제',bg: 'var(--domain-cloud-soft)',     color: 'var(--domain-cloud)' },
  general:    { label: '일반',     bg: 'var(--surface-2)',             color: 'var(--text-2)' },
}

const DATE_OPTIONS = ['전체', '오늘', '이번 주']

/* ── helpers ─────────────────────────────────────────── */

function relativeTime(str) {
  if (!str) return ''
  const diff = Math.floor((Date.now() - new Date(str + 'Z').getTime()) / 1000)
  if (diff < 60) return '방금 전'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}일 전`
  const d = new Date(str + 'Z')
  return `${d.getMonth() + 1}/${d.getDate()}`
}

/* ── sub-components ──────────────────────────────────── */

function ExternalIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <path d="M2 9L9 2M9 2H5M9 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function NewsCard({ item }) {
  const meta = CATEGORY_META[item.category] || CATEGORY_META.general
  const source = SOURCE_LABELS[item.source] || item.source
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
    >
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)', padding: '18px 20px',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
      >
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span style={{
              display: 'inline-block', fontSize: 11, fontWeight: 700,
              padding: '2px 8px', borderRadius: 999,
              background: meta.bg, color: meta.color,
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              {meta.label}
            </span>
            <span style={{ fontSize: 12.5, color: 'var(--text-3)', fontFamily: 'var(--font-en)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {source}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-en)' }}>
              {relativeTime(item.published_at)}
            </span>
            <span style={{ color: 'var(--text-3)', display: 'inline-flex' }}><ExternalIcon /></span>
          </div>
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: 15, fontWeight: 600, letterSpacing: '-0.015em',
          margin: '0 0 8px', lineHeight: 1.45, color: 'var(--text)',
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {item.title}
        </h3>

        {/* Summary */}
        {item.summary && (
          <p style={{
            fontSize: 13, color: 'var(--text-2)', margin: 0,
            lineHeight: 1.6,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {item.summary}
          </p>
        )}
      </div>
    </a>
  )
}

function CheckItem({ label, count, checked, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', padding: '7px 16px', fontSize: 13,
        color: checked ? 'var(--accent)' : 'var(--text-2)',
        fontWeight: checked ? 600 : 400,
        background: checked ? 'var(--accent-soft)' : 'transparent',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          width: 13, height: 13, borderRadius: 3, flexShrink: 0,
          border: `1.5px solid ${checked ? 'var(--accent)' : 'var(--border-strong)'}`,
          background: checked ? 'var(--accent)' : 'transparent',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {checked && (
            <svg width="7" height="5" viewBox="0 0 7 5" fill="none">
              <path d="M1 2.5L2.8 4.2L6 1" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
        {label}
      </span>
      {count !== undefined && (
        <span style={{ fontFamily: 'var(--font-en)', fontSize: 11.5, color: 'var(--text-3)', fontWeight: 500 }}>{count}</span>
      )}
    </button>
  )
}

function SidebarContent({ news, selectedSources, toggleSource, selectedCategories, toggleCategory, dateFilter, setDateFilter }) {
  const sourceCounts = useMemo(() => {
    const c = {}
    news.forEach(n => { c[n.source] = (c[n.source] || 0) + 1 })
    return c
  }, [news])

  const categoryCounts = useMemo(() => {
    const c = {}
    news.forEach(n => { c[n.category] = (c[n.category] || 0) + 1 })
    return c
  }, [news])

  const sources = Object.entries(SOURCE_LABELS).filter(([k]) => sourceCounts[k])
  const categories = Object.entries(CATEGORY_META).filter(([k]) => categoryCounts[k])

  return (
    <div>
      {/* 출처 */}
      {sources.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '12px 16px 6px' }}>출처</div>
          {sources.map(([key, label]) => (
            <CheckItem
              key={key} label={label}
              count={sourceCounts[key]}
              checked={selectedSources.has(key)}
              onToggle={() => toggleSource(key)}
            />
          ))}
        </div>
      )}

      <div style={{ height: 1, background: 'var(--border)', margin: '4px 16px' }} />

      {/* 카테고리 */}
      {categories.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '12px 16px 6px' }}>카테고리</div>
          {categories.map(([key, { label }]) => (
            <CheckItem
              key={key} label={label}
              count={categoryCounts[key]}
              checked={selectedCategories.has(key)}
              onToggle={() => toggleCategory(key)}
            />
          ))}
        </div>
      )}

      <div style={{ height: 1, background: 'var(--border)', margin: '4px 16px' }} />

      {/* 기간 */}
      <div>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '12px 16px 6px' }}>기간</div>
        {DATE_OPTIONS.map(opt => (
          <button
            key={opt}
            onClick={() => setDateFilter(opt)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '7px 16px', fontSize: 13,
              color: dateFilter === opt ? 'var(--accent)' : 'var(--text-2)',
              fontWeight: dateFilter === opt ? 600 : 400,
              background: dateFilter === opt ? 'var(--accent-soft)' : 'transparent',
            }}
          >
            <span style={{
              width: 13, height: 13, borderRadius: '50%', flexShrink: 0,
              border: `1.5px solid ${dateFilter === opt ? 'var(--accent)' : 'var(--border-strong)'}`,
              background: dateFilter === opt ? 'var(--accent)' : 'transparent',
            }} />
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

function EmptyState({ onFetch, canFetch, fetching }) {
  return (
    <div style={{ padding: '80px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📰</div>
      <h2 style={{ fontWeight: 700, fontSize: 20, margin: '0 0 8px' }}>뉴스가 없습니다</h2>
      <p style={{ color: 'var(--text-2)', fontSize: 14, margin: '0 0 24px' }}>
        {canFetch ? '수집 버튼을 눌러 최신 보안 뉴스를 가져오세요.' : '관리자가 뉴스를 수집하면 여기에 표시됩니다.'}
      </p>
      {canFetch && (
        <button
          onClick={onFetch}
          disabled={fetching}
          style={{ fontSize: 14, fontWeight: 600, color: '#FFF', background: 'var(--accent)', padding: '12px 24px', borderRadius: 'var(--r-md)', opacity: fetching ? 0.6 : 1 }}
        >
          {fetching ? '수집 중...' : '뉴스 수집 시작'}
        </button>
      )}
    </div>
  )
}

/* ── main page ───────────────────────────────────────── */

export default function NewsPage() {
  const { user, token, logout } = useAuth()
  const isMobile = useIsMobile()

  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [fetchMsg, setFetchMsg] = useState('')

  const [selectedSources, setSelectedSources] = useState(new Set())
  const [selectedCategories, setSelectedCategories] = useState(new Set())
  const [dateFilter, setDateFilter] = useState('전체')
  const [query, setQuery] = useState('')
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    fetchNews()
      .then(data => setNews(data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let result = [...news]
    if (selectedSources.size > 0) result = result.filter(n => selectedSources.has(n.source))
    if (selectedCategories.size > 0) result = result.filter(n => selectedCategories.has(n.category))
    if (dateFilter === '오늘') {
      const today = new Date(); today.setHours(0, 0, 0, 0)
      result = result.filter(n => new Date(n.published_at + 'Z') >= today)
    } else if (dateFilter === '이번 주') {
      const weekAgo = new Date(Date.now() - 7 * 86400000)
      result = result.filter(n => new Date(n.published_at + 'Z') >= weekAgo)
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(n =>
        n.title.toLowerCase().includes(q) ||
        (n.summary || '').toLowerCase().includes(q)
      )
    }
    return result
  }, [news, selectedSources, selectedCategories, dateFilter, query])

  const toggleSource = key => setSelectedSources(prev => {
    const next = new Set(prev)
    next.has(key) ? next.delete(key) : next.add(key)
    return next
  })

  const toggleCategory = key => setSelectedCategories(prev => {
    const next = new Set(prev)
    next.has(key) ? next.delete(key) : next.add(key)
    return next
  })

  const handleFetch = async () => {
    setFetching(true)
    setFetchMsg('')
    try {
      const res = await triggerNewsFetch(token)
      setFetchMsg(res.message)
      const data = await fetchNews()
      setNews(data || [])
    } catch (e) {
      setFetchMsg('수집 실패: ' + e.message)
    } finally {
      setFetching(false)
    }
  }

  const filterProps = { news, selectedSources, toggleSource, selectedCategories, toggleCategory, dateFilter, setDateFilter }
  const hasActiveFilter = selectedSources.size > 0 || selectedCategories.size > 0 || dateFilter !== '전체'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '12px 16px' : '14px 28px',
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isMobile ? (
            <button
              onClick={() => setMobileFilterOpen(true)}
              style={{ width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--r-sm)', color: 'var(--text-2)', position: 'relative' }}
              aria-label="필터 열기"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 5h12M5 9h8M7 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {hasActiveFilter && <span style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />}
            </button>
          ) : (
            <button
              onClick={() => setSidebarCollapsed(s => !s)}
              style={{ width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--r-sm)', color: 'var(--text-2)' }}
              aria-label="사이드바 토글"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="2.5" y="3" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
                <path d="M7 3v12" stroke="currentColor" strokeWidth="1.4" />
                {!sidebarCollapsed && <rect x="2.5" y="3" width="4.5" height="12" fill="currentColor" opacity="0.15" />}
              </svg>
            </button>
          )}
          <span style={{ color: 'var(--accent)', display: 'flex' }}><Icon.Logo size={20} /></span>
          <span style={{ fontFamily: 'var(--font-en)', fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>SecJobs</span>
          <div style={{ display: 'flex', gap: 2 }}>
            {[
              { to: '/',     label: isMobile ? '공고' : '채용 공고', active: false },
              { to: '/news', label: isMobile ? '뉴스' : '보안 뉴스', active: true },
            ].map(({ to, label, active }) => (
              <Link key={to} to={to} style={{
                fontSize: isMobile ? 11.5 : 13, fontWeight: active ? 600 : 500,
                color: active ? 'var(--text)' : 'var(--text-3)',
                padding: isMobile ? '3px 7px' : '4px 10px',
                borderRadius: 'var(--r-sm)',
                background: active ? 'var(--surface-2)' : 'transparent',
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}>{label}</Link>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Search */}
          <div style={{
            display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: 8,
            width: 240, padding: '8px 12px',
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
          }}>
            <span style={{ color: 'var(--text-3)', display: 'flex' }}><Icon.Search /></span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="키워드 검색"
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: 'var(--text)' }}
            />
            {query && <button onClick={() => setQuery('')} style={{ color: 'var(--text-3)', fontSize: 11 }}>지우기</button>}
          </div>

          {/* Admin fetch */}
          {user?.is_admin && (
            <button
              onClick={handleFetch}
              disabled={fetching}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 13, fontWeight: 500, color: '#FFF',
                background: fetching ? 'var(--text-3)' : 'var(--accent)',
                padding: isMobile ? '9px 12px' : '9px 14px',
                borderRadius: 'var(--r-md)',
                cursor: fetching ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <span className={fetching ? 'spin' : ''} style={{ display: 'inline-flex' }}>
                <Icon.Refresh size={14} />
              </span>
              {!isMobile && (fetching ? '수집 중...' : '뉴스 수집')}
            </button>
          )}

          {/* User */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {!isMobile && <span style={{ fontSize: 12.5, color: 'var(--text-3)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>}
              <button
                onClick={logout}
                style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '7px 12px' }}
              >
                로그아웃
              </button>
            </div>
          ) : (
            <Link to="/login" style={{ fontSize: 13, fontWeight: 500, color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: 'var(--r-md)', padding: '8px 14px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
              로그인
            </Link>
          )}
        </div>
      </header>

      <div style={{
        flex: 1,
        display: isMobile ? 'block' : 'grid',
        gridTemplateColumns: isMobile ? '1fr' : (sidebarCollapsed ? '1fr' : '220px 1fr'),
        transition: 'grid-template-columns 0.25s ease',
      }}>

        {/* Desktop sidebar */}
        {!isMobile && !sidebarCollapsed && (
          <aside style={{ borderRight: '1px solid var(--border)', background: 'var(--surface)', position: 'sticky', top: 57, height: 'calc(100vh - 57px)', overflowY: 'auto' }}>
            <SidebarContent {...filterProps} />
          </aside>
        )}

        {/* Main */}
        <main style={{ padding: isMobile ? '16px 16px 60px' : '28px 32px 60px', minWidth: 0 }}>
          {/* Mobile search */}
          {isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', marginBottom: 16 }}>
              <span style={{ color: 'var(--text-3)', display: 'flex' }}><Icon.Search /></span>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="키워드 검색"
                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13.5, color: 'var(--text)' }}
              />
              {query && <button onClick={() => setQuery('')} style={{ color: 'var(--text-3)', fontSize: 11 }}>지우기</button>}
            </div>
          )}

          {/* Heading */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <h2 style={{ fontWeight: 700, letterSpacing: '-0.025em', margin: 0, display: 'flex', alignItems: 'baseline', gap: 10, fontSize: isMobile ? 19 : 24 }}>
                보안 뉴스
                {!loading && <span style={{ fontFamily: 'var(--font-en)', fontSize: 14, color: 'var(--text-3)', fontWeight: 500 }}>{filtered.length}</span>}
              </h2>
              {!isMobile && <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '6px 0 0' }}>보안 위협·취약점·정책 뉴스를 실시간으로 모아드립니다.</p>}
            </div>
            {fetchMsg && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{fetchMsg}</span>}
          </div>

          {/* Active filter chips */}
          {hasActiveFilter && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {[...selectedSources].map(s => (
                <button key={s} onClick={() => toggleSource(s)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, color: 'var(--accent)', background: 'var(--accent-soft)', padding: '4px 10px', borderRadius: 999 }}>
                  {SOURCE_LABELS[s] || s} ×
                </button>
              ))}
              {[...selectedCategories].map(c => (
                <button key={c} onClick={() => toggleCategory(c)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, color: 'var(--accent)', background: 'var(--accent-soft)', padding: '4px 10px', borderRadius: 999 }}>
                  {CATEGORY_META[c]?.label || c} ×
                </button>
              ))}
              {dateFilter !== '전체' && (
                <button onClick={() => setDateFilter('전체')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, color: 'var(--accent)', background: 'var(--accent-soft)', padding: '4px 10px', borderRadius: 999 }}>
                  {dateFilter} ×
                </button>
              )}
              <button onClick={() => { setSelectedSources(new Set()); setSelectedCategories(new Set()); setDateFilter('전체') }} style={{ fontSize: 12, color: 'var(--text-3)', padding: '4px 8px' }}>
                전체 초기화
              </button>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)', fontSize: 14 }}>로딩 중...</div>
          ) : news.length === 0 ? (
            <EmptyState onFetch={handleFetch} canFetch={!!user?.is_admin} fetching={fetching} />
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)', fontSize: 14 }}>조건에 맞는 뉴스가 없습니다.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(item => <NewsCard key={item.id} item={item} />)}
            </div>
          )}
        </main>
      </div>

      {/* Mobile filter drawer */}
      {isMobile && mobileFilterOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex' }}
          onClick={() => setMobileFilterOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: 280, background: 'var(--surface)', height: '100%', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px 12px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontWeight: 600, fontSize: 15 }}>필터</span>
              <button onClick={() => setMobileFilterOpen(false)} style={{ color: 'var(--text-2)', fontSize: 14 }}>닫기</button>
            </div>
            <SidebarContent {...filterProps} />
          </div>
        </div>
      )}
    </div>
  )
}
