import JobRow, { TableHead } from './JobRow'
import JobCard from './JobCard'

export default function JobList({ jobs, isMobile, bookmarks, onBookmark }) {
  if (jobs.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>공고가 없습니다</div>
        <div style={{ fontSize: 13, color: 'var(--text-3)' }}>수집 시작 버튼을 눌러 최신 공고를 가져오세요</div>
      </div>
    )
  }

  if (isMobile) {
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {jobs.map(job => (
          <JobCard
            key={job.id}
            job={job}
            bookmarked={!!bookmarks[job.id]}
            onBookmark={() => onBookmark(job.id)}
          />
        ))}
      </ul>
    )
  }

  return (
    <>
      <TableHead />
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {jobs.map(job => (
          <JobRow
            key={job.id}
            job={job}
            bookmarked={!!bookmarks[job.id]}
            onBookmark={() => onBookmark(job.id)}
          />
        ))}
      </ul>
    </>
  )
}
