import { useNavigate } from 'react-router-dom'

const SOURCE_LABELS = { saramin: '사람인', jobkorea: '잡코리아', wanted: 'Wanted' }
const SOURCE_COLORS = { saramin: '#e8f0fe', jobkorea: '#fce8e6', wanted: '#e6f4ea' }

export default function JobCard({ job }) {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => navigate(`/jobs/${job.id}`)}
      style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '0.75rem',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s',
      }}
      onMouseOver={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'}
      onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}
    >
      <h3 style={{ margin: '0 0 0.4rem' }}>{job.title}</h3>
      <p style={{ margin: '0 0 0.5rem', color: '#555' }}>
        {job.company} · {job.location || '위치 미상'}
      </p>
      <div>
        <span style={{
          background: SOURCE_COLORS[job.source] || '#f0f0f0',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '0.8rem',
        }}>
          {SOURCE_LABELS[job.source] || job.source}
        </span>
        {job.deadline && (
          <span style={{ marginLeft: '0.75rem', fontSize: '0.85rem', color: '#888' }}>
            마감: {job.deadline}
          </span>
        )}
      </div>
    </div>
  )
}
