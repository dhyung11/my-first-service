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
