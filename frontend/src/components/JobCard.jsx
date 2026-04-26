import { useNavigate } from 'react-router-dom'
import { CompanyLogo, Icon } from '../icons'
import { domainClass, formatDday, ddayColor } from '../utils'

export default function JobCard({ job, bookmarked, onBookmark }) {
  const navigate = useNavigate()

  return (
    <li
      onClick={() => navigate(`/jobs/${job.id}`)}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        padding: 14,
        display: 'flex', flexDirection: 'column', gap: 10,
        cursor: 'pointer', listStyle: 'none',
      }}
    >
      {/* Head */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <CompanyLogo company={job.companyShort} color={job.logoColor} size={32} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
            <span style={{ fontSize: 11.5, color: 'var(--text-2)', fontWeight: 500 }}>{job.company}</span>
            {job.isNew && (
              <span style={{
                fontFamily: 'var(--font-en)', fontSize: 9, fontWeight: 700,
                letterSpacing: '0.04em', color: 'var(--new)', background: 'var(--new-soft)',
                padding: '1px 4px', borderRadius: 3,
              }}>NEW</span>
            )}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em', lineHeight: 1.35 }}>
            {job.title}
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onBookmark() }}
          style={{ color: bookmarked ? 'var(--accent)' : 'var(--text-3)', padding: 4, flexShrink: 0 }}
          aria-label="북마크"
        >
          <Icon.Bookmark size={16} filled={bookmarked} />
        </button>
      </div>

      {/* Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span className={domainClass(job.domainEn)} style={{ fontSize: 11.5, fontWeight: 500, padding: '3px 8px', borderRadius: 999, display: 'inline-block' }}>
          {job.domain}
        </span>
        {job.expYears > 0 && <span style={{ fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'var(--font-en)' }}>{job.expYears}년+</span>}
        {job.location && (
          <>
            <span style={{ color: 'var(--border-strong)', fontSize: 11 }}>·</span>
            <span style={{ fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'var(--font-en)' }}>{job.location}</span>
          </>
        )}
      </div>

      {/* Bottom */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-2)', background: 'var(--surface-2)', padding: '3px 8px', borderRadius: 4 }}>
          {job.source}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{ fontFamily: 'var(--font-en)', fontSize: 13, fontWeight: 700, letterSpacing: '-0.02em', color: ddayColor(job.dday) }}>
            {formatDday(job.dday)}
          </span>
          {job.deadline && (
            <span style={{ fontFamily: 'var(--font-en)', fontSize: 10.5, color: 'var(--text-3)' }}>
              {job.deadline.slice(5).replace('-', '.')}
            </span>
          )}
        </div>
      </div>
    </li>
  )
}
