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
