import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { fetchJobs } from './api'
import Header from './components/Header'
import CrawlButton from './components/CrawlButton'
import JobList from './components/JobList'
import JobDetail from './components/JobDetail'

function HomePage() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  const loadJobs = async () => {
    try {
      const data = await fetchJobs()
      setJobs(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadJobs() }, [])

  return (
    <>
      <CrawlButton onCrawlComplete={loadJobs} />
      {loading ? <p>로딩 중...</p> : <JobList jobs={jobs} />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
