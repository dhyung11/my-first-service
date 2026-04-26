import { useState } from 'react'
import { CompanyLogo, Icon } from '../icons'
import { domainClass, formatDday, ddayColor } from '../utils'

const GRID = 'minmax(0, 1.7fr) 130px 80px 130px 90px 40px'

export function TableHead() {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: GRID, gap: 16,
      alignItems: 'center', padding: '10px 16px',
      borderBottom: '1px solid var(--border)',
      fontSize: 11, fontWeight: 600, color: 'var(--text-3)',
      letterSpacing: '0.06em', textTransform: 'uppercase',
    }}>
      <div>회사 / 직무</div>
      <div>도메인</div>
      <div>경력</div>
      <div>위치</div>
      <div style={{ textAlign: 'right' }}>마감</div>
      <div style={{ textAlign: 'center' }}>★</div>
    </div>
  )
}

export default function JobRow({ job, bookmarked, onBookmark }) {
  const [hover, setHover] = useState(false)

  return (
    <li
      onClick={() => window.open(job.url, '_blank', 'noopener,noreferrer')}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'grid', gridTemplateColumns: GRID, gap: 16,
        alignItems: 'center', padding: 16,
        borderBottom: '1px solid var(--border)',
        background: hover ? 'var(--surface-2)' : 'transparent',
        transition: 'background 0.12s',
        cursor: 'pointer', listStyle: 'none',
      }}
    >
      {/* Company / Title */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', minWidth: 0 }}>
        <CompanyLogo company={job.companyShort} color={job.logoColor} size={36} />
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 12.5, color: 'var(--text-2)', fontWeight: 500 }}>{job.company}</span>
            {job.isNew && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--new)', flexShrink: 0 }} />}
          </div>
          <div style={{
            fontSize: 14.5, fontWeight: 600, color: 'var(--text)',
            letterSpacing: '-0.01em', marginBottom: 4,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {job.title}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {job.tags.slice(0, 3).map((t, i) => (
              <span key={t} style={{ fontFamily: 'var(--font-en)', fontSize: 11.5, color: 'var(--text-3)', fontWeight: 500 }}>
                {t}{i < Math.min(job.tags.length, 3) - 1 && <span style={{ marginLeft: 6, color: 'var(--border-strong)' }}>·</span>}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Domain */}
      <div>
        <span className={domainClass(job.domainEn)} style={{ fontSize: 11.5, fontWeight: 500, padding: '3px 8px', borderRadius: 999, display: 'inline-block' }}>
          {job.domain}
        </span>
      </div>

      {/* Experience */}
      <div style={{ fontFamily: 'var(--font-en)', fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>
        {job.expYears > 0 ? `${job.expYears}년+` : '무관'}
      </div>

      {/* Location */}
      <div style={{ fontSize: 13, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 4 }}>
        {job.location ? (
          <>
            <Icon.Pin size={12} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.location}</span>
          </>
        ) : (
          <span style={{ color: 'var(--text-3)' }}>—</span>
        )}
      </div>

      {/* D-day */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <span style={{ fontFamily: 'var(--font-en)', fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', color: ddayColor(job.dday) }}>
          {formatDday(job.dday)}
        </span>
        {job.deadline && (
          <span style={{ fontFamily: 'var(--font-en)', fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
            {job.deadline.slice(5).replace('-', '.')}
          </span>
        )}
      </div>

      {/* Bookmark */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <button
          onClick={e => { e.stopPropagation(); onBookmark() }}
          style={{
            padding: 6, display: 'inline-flex', borderRadius: 'var(--r-sm)',
            color: bookmarked ? 'var(--accent)' : 'var(--text-3)',
            background: bookmarked ? 'var(--accent-soft)' : 'transparent',
            transition: 'all 0.12s',
          }}
          aria-label="즐겨찾기"
        >
          <Icon.Bookmark size={16} filled={bookmarked} />
        </button>
      </div>
    </li>
  )
}
