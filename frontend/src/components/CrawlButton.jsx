import { useState } from 'react'
import { triggerCrawl } from '../api'

export default function CrawlButton({ onCrawlComplete }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleCrawl = async () => {
    setLoading(true)
    setMessage('')
    try {
      const result = await triggerCrawl()
      setMessage(result.message)
      await onCrawlComplete()
    } catch {
      setMessage('수집 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <button
        onClick={handleCrawl}
        disabled={loading}
        style={{
          padding: '0.5rem 1.25rem',
          background: loading ? '#ccc' : '#1a1a2e',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '0.95rem',
        }}
      >
        {loading ? '수집 중...' : '수집 시작'}
      </button>
      {message && <span style={{ color: '#555', fontSize: '0.9rem' }}>{message}</span>}
    </div>
  )
}
