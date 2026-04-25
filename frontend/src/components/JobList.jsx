import JobCard from './JobCard'

export default function JobList({ jobs }) {
  if (jobs.length === 0) {
    return (
      <p style={{ color: '#888', textAlign: 'center', marginTop: '2rem' }}>
        공고가 없습니다. 수집 버튼을 눌러 최신 공고를 가져오세요.
      </p>
    )
  }
  return (
    <div>
      <p style={{ color: '#666', marginBottom: '0.75rem' }}>총 {jobs.length}개 공고</p>
      {jobs.map(job => <JobCard key={job.id} job={job} />)}
    </div>
  )
}
