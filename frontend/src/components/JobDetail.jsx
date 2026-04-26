import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { fetchJob } from '../api'
import { adaptJob } from '../utils'
import { CompanyLogo, Icon } from '../icons'
import { domainClass, formatDday, ddayColor } from '../utils'

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [raw, setRaw] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchJob(id)
      .then(setRaw)
      .catch(() => setError('공고를 찾을 수 없습니다.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0', color: 'var(--text-3)', fontSize: 14 }}>
      로딩 중...
    </div>
  )
  if (error) return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--urgent)', fontSize: 14 }}>{error}</div>
  )

  const job = adaptJob(raw)

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 13, color: 'var(--text-2)', fontWeight: 500,
          marginBottom: 28, cursor: 'pointer',
          border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
          padding: '6px 12px', background: 'var(--surface)',
        }}
      >
        ← 목록으로
      </button>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 24 }}>
        <CompanyLogo company={job.companyShort} color={job.logoColor} size={48} />
        <div>
          <div style={{ fontSize: 12.5, color: 'var(--text-2)', fontWeight: 500, marginBottom: 4 }}>{job.company}</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.3 }}>{job.title}</h1>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        <span className={domainClass(job.domainEn)} style={{ fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 999 }}>
          {job.domain}
        </span>
        {job.location && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-2)', background: 'var(--surface-2)', padding: '4px 10px', borderRadius: 999 }}>
            <Icon.Pin size={12} /> {job.location}
          </span>
        )}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-2)', background: 'var(--surface-2)', padding: '4px 10px', borderRadius: 999 }}>
          {job.source}
        </span>
        {job.dday !== null && (
          <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-en)', color: ddayColor(job.dday), background: 'var(--surface-2)', padding: '4px 10px', borderRadius: 999 }}>
            {formatDday(job.dday)} {job.deadline ? `(~${job.deadline.slice(5).replace('-', '.')})` : ''}
          </span>
        )}
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24, marginBottom: 24 }}>
        {job.description ? (
          <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
            {job.description}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--text-3)', fontStyle: 'italic' }}>
            상세 내용은 원본 공고 페이지에서 확인하세요.
          </div>
        )}
      </div>

      <a href={raw.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
        <button style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          fontSize: 14, fontWeight: 500, color: '#FFFFFF',
          background: 'var(--accent)', padding: '12px 24px',
          borderRadius: 'var(--r-md)', cursor: 'pointer',
        }}>
          원본 공고 보기 →
        </button>
      </a>
    </div>
  )
}
