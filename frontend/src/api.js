const BASE = '/api'

export async function fetchJobs() {
  const res = await fetch(`${BASE}/jobs`)
  if (!res.ok) throw new Error('Failed to fetch jobs')
  return res.json()
}

export async function fetchJob(id) {
  const res = await fetch(`${BASE}/jobs/${id}`)
  if (!res.ok) throw new Error('Job not found')
  return res.json()
}

export async function triggerCrawl() {
  const res = await fetch(`${BASE}/crawl`, { method: 'POST' })
  if (!res.ok) throw new Error('Crawl failed')
  return res.json()
}
