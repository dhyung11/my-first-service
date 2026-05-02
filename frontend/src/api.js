const BASE = '/api'

function authHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function handleResponse(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.status === 204 ? null : res.json()
}

export async function fetchJobs() {
  return handleResponse(await fetch(`${BASE}/jobs`))
}

export async function fetchJob(id) {
  return handleResponse(await fetch(`${BASE}/jobs/${id}`))
}

export async function fetchCrawlStatus() {
  return handleResponse(await fetch(`${BASE}/crawl/status`))
}

export async function triggerCrawl(token) {
  return handleResponse(await fetch(`${BASE}/crawl`, {
    method: 'POST',
    headers: authHeader(token),
  }))
}

export async function register(email, password) {
  return handleResponse(await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }))
}

export async function login(email, password) {
  return handleResponse(await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }))
}

export async function fetchMe(token) {
  return handleResponse(await fetch(`${BASE}/auth/me`, {
    headers: authHeader(token),
  }))
}

export async function fetchBookmarks(token) {
  return handleResponse(await fetch(`${BASE}/bookmarks`, {
    headers: authHeader(token),
  }))
}

export async function addBookmark(token, jobId) {
  return handleResponse(await fetch(`${BASE}/bookmarks/${jobId}`, {
    method: 'POST',
    headers: authHeader(token),
  }))
}

export async function removeBookmark(token, jobId) {
  return handleResponse(await fetch(`${BASE}/bookmarks/${jobId}`, {
    method: 'DELETE',
    headers: authHeader(token),
  }))
}

export async function syncBookmarks(token, jobIds) {
  return handleResponse(await fetch(`${BASE}/bookmarks/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    body: JSON.stringify(jobIds),
  }))
}

export async function fetchResume(token) {
  const res = await fetch(`${BASE}/resume`, { headers: authHeader(token) })
  if (res.status === 404) return null
  return handleResponse(res)
}

export async function upsertResume(token, data) {
  return handleResponse(await fetch(`${BASE}/resume`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    body: JSON.stringify(data),
  }))
}

export async function uploadResumeFile(token, fileType, file) {
  const form = new FormData()
  form.append('file', file)
  return handleResponse(await fetch(`${BASE}/resume/upload/${fileType}`, {
    method: 'POST',
    headers: authHeader(token),
    body: form,
  }))
}

export async function fetchNews() {
  return handleResponse(await fetch(`${BASE}/news`))
}

export async function triggerNewsFetch(token) {
  return handleResponse(await fetch(`${BASE}/news/fetch`, {
    method: 'POST',
    headers: authHeader(token),
  }))
}

export async function fetchProtectedFile(token, filePath) {
  const res = await fetch(`${BASE}/uploads/${filePath}`, { headers: authHeader(token) })
  if (!res.ok) return null
  return URL.createObjectURL(await res.blob())
}
