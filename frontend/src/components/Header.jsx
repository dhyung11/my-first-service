import { Link, useLocation } from 'react-router-dom'
import { Icon } from '../icons'
import { useIsMobile } from '../utils'

export default function Header({
  query, setQuery,
  onMenuClick,
  sidebarCollapsed, onToggleSidebar,
  isMobile,
  onCrawl, crawling,
  user, onLogout,
}) {
  const location = useLocation()
  const onJobs = location.pathname === '/' || location.pathname.startsWith('/jobs')
  const onNews = location.pathname === '/news'

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: '1px solid var(--border)',
      background: 'var(--surface)',
      position: 'sticky', top: 0, zIndex: 20,
      padding: isMobile ? '12px 16px' : '14px 28px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {isMobile ? (
          <button onClick={onMenuClick} style={btnStyle} aria-label="필터 열기">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
        ) : (
          <button onClick={onToggleSidebar} style={btnStyle} aria-label="사이드바 토글">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2.5" y="3" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M7 3v12" stroke="currentColor" strokeWidth="1.4"/>
              {!sidebarCollapsed && <rect x="2.5" y="3" width="4.5" height="12" fill="currentColor" opacity="0.15"/>}
            </svg>
          </button>
        )}
        <span style={{ color: 'var(--accent)', display: 'flex' }}>
          <Icon.Logo size={20} />
        </span>
        <span style={{ fontFamily: 'var(--font-en)', fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>
          Path Pilot
        </span>
        <div style={{ display: 'flex', gap: 2, marginLeft: 2 }}>
          {[
            { to: '/',     label: isMobile ? '공고' : '채용 공고', active: onJobs },
            { to: '/news', label: isMobile ? '뉴스' : '보안 뉴스', active: onNews },
          ].map(({ to, label, active }) => (
            <Link key={to} to={to} style={{
              fontSize: isMobile ? 11.5 : 13,
              fontWeight: active ? 600 : 500,
              color: active ? 'var(--text)' : 'var(--text-3)',
              padding: isMobile ? '3px 7px' : '4px 10px',
              borderRadius: 'var(--r-sm)',
              background: active ? 'var(--surface-2)' : 'transparent',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}>{label}</Link>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {!isMobile && <SearchBar value={query} onChange={setQuery} />}

        {user?.is_admin && (
          <button
            onClick={onCrawl}
            disabled={crawling}
            style={{
              fontSize: 13, fontWeight: 500, color: '#FFFFFF',
              background: crawling ? 'var(--text-3)' : 'var(--accent)',
              padding: isMobile ? '10px 12px' : '10px 16px',
              borderRadius: 'var(--r-md)',
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'background 0.15s',
              cursor: crawling ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <span className={crawling ? 'spin' : ''} style={{ display: 'inline-flex' }}>
              <Icon.Refresh size={14} />
            </span>
            {!isMobile && (crawling ? '수집 중...' : '수집 시작')}
          </button>
        )}

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link
              to="/resume"
              style={{
                fontSize: 13, fontWeight: 500, color: 'var(--text-2)',
                border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
                padding: isMobile ? '7px 10px' : '7px 12px',
                textDecoration: 'none', whiteSpace: 'nowrap',
                display: 'inline-flex', alignItems: 'center', gap: 5,
              }}
            >
              <Icon.User size={14} />
              {!isMobile && '내 이력서'}
            </Link>
            {!isMobile && (
              <span style={{ fontSize: 12.5, color: 'var(--text-3)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </span>
            )}
            <button
              onClick={onLogout}
              style={{
                fontSize: 12.5, fontWeight: 500, color: 'var(--text-2)',
                border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
                padding: '7px 12px', cursor: 'pointer',
              }}
            >
              로그아웃
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            style={{
              fontSize: 13, fontWeight: 500, color: 'var(--accent)',
              border: '1px solid var(--accent)', borderRadius: 'var(--r-md)',
              padding: '8px 14px', textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            로그인
          </Link>
        )}
      </div>
    </header>
  )
}

function SearchBar({ value, onChange }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      width: 280, padding: '9px 12px',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)',
    }}>
      <span style={{ color: 'var(--text-3)', display: 'flex' }}><Icon.Search /></span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="회사·직무·기술 키워드 검색"
        style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13.5, color: 'var(--text)' }}
      />
      {value && (
        <button onClick={() => onChange('')} style={{ color: 'var(--text-3)', fontSize: 11 }}>지우기</button>
      )}
    </div>
  )
}

const btnStyle = {
  width: 32, height: 32,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: 'var(--r-sm)',
  color: 'var(--text-2)',
}
