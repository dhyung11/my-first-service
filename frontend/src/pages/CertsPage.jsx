import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchCertifications, fetchUserCerts, addUserCert, updateUserCert, deleteUserCert } from '../api'
import { Icon } from '../icons'
import { useIsMobile } from '../utils'

/* ── constants ───────────────────────────────────────── */

const STATUS_META = {
  not_started: { label: '미시작',   bg: 'var(--surface-2)',       color: 'var(--text-3)' },
  studying:    { label: '공부중',   bg: '#FEF3C7',                color: '#D97706' },
  acquired:    { label: '취득완료', bg: 'var(--domain-grc-soft)', color: 'var(--domain-grc)' },
}

const CATEGORY_COLORS = {
  '국내자격증':  { bg: 'var(--accent-soft)',       color: 'var(--accent)' },
  '해외자격증':  { bg: 'var(--domain-secops-soft)', color: 'var(--domain-secops)' },
  '침투테스트':  { bg: 'var(--urgent-soft)',        color: 'var(--urgent)' },
  '클라우드보안': { bg: '#FDF0E8',                  color: '#B85000' },
  '거버넌스':    { bg: 'var(--domain-grc-soft)',    color: 'var(--domain-grc)' },
}

const CATEGORIES = ['국내자격증', '해외자격증', '침투테스트', '클라우드보안', '거버넌스']

const EMPTY_FORM = {
  inputMode: 'preset',
  selectedPreset: null,
  cert_name: '',
  category: '',
  issuer: '',
  status: 'not_started',
  progress: 0,
  target_date: '',
  acquired_date: '',
  notes: '',
  links: [],
}

/* ── helpers ─────────────────────────────────────────── */

function formatDate(str) {
  if (!str) return ''
  return str.slice(0, 10)
}

/* ── sub-components ──────────────────────────────────── */

function CategoryBadge({ category }) {
  const c = CATEGORY_COLORS[category] || { bg: 'var(--surface-2)', color: 'var(--text-3)' }
  return (
    <span style={{
      display: 'inline-block', fontSize: 11, fontWeight: 700,
      padding: '2px 8px', borderRadius: 999,
      background: c.bg, color: c.color, whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {category}
    </span>
  )
}

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.not_started
  return (
    <span style={{
      display: 'inline-block', fontSize: 11, fontWeight: 700,
      padding: '2px 8px', borderRadius: 999,
      background: m.bg, color: m.color, whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {m.label}
    </span>
  )
}

function ProgressBar({ value }) {
  return (
    <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{
        height: '100%', borderRadius: 3,
        width: `${value}%`,
        background: value === 100 ? 'var(--domain-grc)' : 'var(--accent)',
        transition: 'width 0.3s ease',
      }} />
    </div>
  )
}

function CertCard({ cert, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const hasExtra = cert.notes || (cert.links && cert.links.length > 0)

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)', padding: '18px 20px',
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
            <CategoryBadge category={cert.category} />
            <StatusBadge status={cert.status} />
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, letterSpacing: '-0.01em', color: 'var(--text)' }}>
            {cert.cert_name}
          </h3>
          {cert.issuer && (
            <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'var(--text-3)' }}>{cert.issuer}</p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            onClick={() => onEdit(cert)}
            style={{ fontSize: 12, color: 'var(--text-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '5px 10px' }}
          >
            수정
          </button>
          <button
            onClick={() => onDelete(cert.id)}
            style={{ fontSize: 12, color: 'var(--urgent)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '5px 10px' }}
          >
            삭제
          </button>
        </div>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>진행도</span>
          <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-en)', color: 'var(--text-2)' }}>{cert.progress}%</span>
        </div>
        <ProgressBar value={cert.progress} />
      </div>

      {/* Dates */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {cert.target_date && (
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
            목표일: <strong style={{ color: 'var(--text-2)' }}>{formatDate(cert.target_date)}</strong>
          </span>
        )}
        {cert.acquired_date && (
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
            취득일: <strong style={{ color: 'var(--domain-grc)' }}>{formatDate(cert.acquired_date)}</strong>
          </span>
        )}
      </div>

      {/* Expandable: notes + links */}
      {hasExtra && (
        <>
          <button
            onClick={() => setExpanded(e => !e)}
            style={{ marginTop: 10, fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            {expanded ? '접기 ▲' : '메모·링크 보기 ▼'}
          </button>
          {expanded && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cert.notes && (
                <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {cert.notes}
                </p>
              )}
              {cert.links && cert.links.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {cert.links.map((link, i) => (
                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 12.5, color: 'var(--accent)', textDecoration: 'none' }}>
                      🔗 {link.label || link.url}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function SidebarContent({ certs, selectedStatuses, toggleStatus, selectedCategories, toggleCategory }) {
  const statusCounts = useMemo(() => {
    const c = {}
    certs.forEach(cert => { c[cert.status] = (c[cert.status] || 0) + 1 })
    return c
  }, [certs])

  const categoryCounts = useMemo(() => {
    const c = {}
    certs.forEach(cert => { c[cert.category] = (c[cert.category] || 0) + 1 })
    return c
  }, [certs])

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '12px 16px 6px' }}>상태</div>
        {Object.entries(STATUS_META).map(([key, { label }]) => (
          <button key={key} onClick={() => toggleStatus(key)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', padding: '7px 16px', fontSize: 13,
              color: selectedStatuses.has(key) ? 'var(--accent)' : 'var(--text-2)',
              fontWeight: selectedStatuses.has(key) ? 600 : 400,
              background: selectedStatuses.has(key) ? 'var(--accent-soft)' : 'transparent',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 13, height: 13, borderRadius: 3, flexShrink: 0,
                border: `1.5px solid ${selectedStatuses.has(key) ? 'var(--accent)' : 'var(--border-strong)'}`,
                background: selectedStatuses.has(key) ? 'var(--accent)' : 'transparent',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {selectedStatuses.has(key) && (
                  <svg width="7" height="5" viewBox="0 0 7 5" fill="none">
                    <path d="M1 2.5L2.8 4.2L6 1" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              {label}
            </span>
            <span style={{ fontFamily: 'var(--font-en)', fontSize: 11.5, color: 'var(--text-3)', fontWeight: 500 }}>
              {statusCounts[key] || 0}
            </span>
          </button>
        ))}
      </div>

      <div style={{ height: 1, background: 'var(--border)', margin: '4px 16px' }} />

      <div>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '12px 16px 6px' }}>카테고리</div>
        {CATEGORIES.filter(cat => categoryCounts[cat]).map(cat => (
          <button key={cat} onClick={() => toggleCategory(cat)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', padding: '7px 16px', fontSize: 13,
              color: selectedCategories.has(cat) ? 'var(--accent)' : 'var(--text-2)',
              fontWeight: selectedCategories.has(cat) ? 600 : 400,
              background: selectedCategories.has(cat) ? 'var(--accent-soft)' : 'transparent',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 13, height: 13, borderRadius: 3, flexShrink: 0,
                border: `1.5px solid ${selectedCategories.has(cat) ? 'var(--accent)' : 'var(--border-strong)'}`,
                background: selectedCategories.has(cat) ? 'var(--accent)' : 'transparent',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {selectedCategories.has(cat) && (
                  <svg width="7" height="5" viewBox="0 0 7 5" fill="none">
                    <path d="M1 2.5L2.8 4.2L6 1" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              {cat}
            </span>
            <span style={{ fontFamily: 'var(--font-en)', fontSize: 11.5, color: 'var(--text-3)', fontWeight: 500 }}>
              {categoryCounts[cat]}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function CertModal({ mode, initial, presetList, onSave, onClose }) {
  const [form, setForm] = useState(() => {
    if (mode === 'edit' && initial) {
      return {
        ...EMPTY_FORM,
        inputMode: 'preset',
        cert_name: initial.cert_name,
        category: initial.category,
        issuer: initial.issuer || '',
        status: initial.status,
        progress: initial.progress,
        target_date: initial.target_date ? formatDate(initial.target_date) : '',
        acquired_date: initial.acquired_date ? formatDate(initial.acquired_date) : '',
        notes: initial.notes || '',
        links: initial.links || [],
      }
    }
    return { ...EMPTY_FORM }
  })
  const [presetQuery, setPresetQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const grouped = useMemo(() => {
    const q = presetQuery.toLowerCase()
    const filtered = presetList.filter(c =>
      c.name.toLowerCase().includes(q) || c.issuer?.toLowerCase().includes(q)
    )
    return CATEGORIES.reduce((acc, cat) => {
      const items = filtered.filter(c => c.category === cat)
      if (items.length) acc[cat] = items
      return acc
    }, {})
  }, [presetList, presetQuery])

  const selectPreset = (cert) => {
    set('selectedPreset', cert)
    set('cert_name', cert.name)
    set('category', cert.category)
    set('issuer', cert.issuer || '')
  }

  const addLink = () => set('links', [...form.links, { url: '', label: '' }])
  const removeLink = (i) => set('links', form.links.filter((_, idx) => idx !== i))
  const updateLink = (i, field, val) => {
    const next = [...form.links]
    next[i] = { ...next[i], [field]: val }
    set('links', next)
  }

  const handleSubmit = async () => {
    if (!form.cert_name.trim()) { setError('자격증명을 입력하세요.'); return }
    if (!form.category) { setError('카테고리를 선택하세요.'); return }
    setSaving(true)
    setError('')
    try {
      await onSave({
        cert_name: form.cert_name.trim(),
        category: form.category,
        issuer: form.issuer.trim() || null,
        status: form.status,
        progress: Number(form.progress),
        target_date: form.target_date || null,
        acquired_date: form.acquired_date || null,
        notes: form.notes.trim() || null,
        links: form.links.filter(l => l.url.trim()),
      })
    } catch (e) {
      setError(e.message)
      setSaving(false)
    }
  }

  const showDetailForm = mode === 'edit' || form.cert_name

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)', borderRadius: 'var(--r-lg)', width: '100%', maxWidth: 520,
          maxHeight: '90vh', overflowY: 'auto', padding: 28,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{mode === 'add' ? '자격증 추가' : '자격증 수정'}</h2>
          <button onClick={onClose} style={{ color: 'var(--text-3)', fontSize: 18 }}>×</button>
        </div>

        {/* 자격증 선택 (추가 시에만 표시) */}
        {mode === 'add' && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              {['preset', 'custom'].map(m => (
                <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input type="radio" checked={form.inputMode === m} onChange={() => {
                    set('inputMode', m)
                    set('selectedPreset', null)
                    set('cert_name', '')
                    set('category', '')
                    set('issuer', '')
                  }} />
                  {m === 'preset' ? '사전 목록에서 선택' : '직접 입력'}
                </label>
              ))}
            </div>

            {form.inputMode === 'preset' && (
              <>
                <input
                  value={presetQuery}
                  onChange={e => setPresetQuery(e.target.value)}
                  placeholder="자격증 검색..."
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 'var(--r-md)', background: 'var(--bg)', color: 'var(--text)', marginBottom: 10 }}
                />
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-md)', maxHeight: 200, overflowY: 'auto' }}>
                  {Object.entries(grouped).map(([cat, items]) => (
                    <div key={cat}>
                      <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-3)', padding: '6px 12px 4px', letterSpacing: '0.05em', textTransform: 'uppercase', background: 'var(--surface-2)' }}>{cat}</div>
                      {items.map(cert => (
                        <button key={cert.id} onClick={() => selectPreset(cert)}
                          style={{
                            display: 'block', width: '100%', textAlign: 'left',
                            padding: '8px 12px', fontSize: 13,
                            background: form.selectedPreset?.id === cert.id ? 'var(--accent-soft)' : 'transparent',
                            color: form.selectedPreset?.id === cert.id ? 'var(--accent)' : 'var(--text)',
                            fontWeight: form.selectedPreset?.id === cert.id ? 600 : 400,
                          }}
                        >
                          {cert.name}
                          {cert.issuer && <span style={{ fontSize: 11.5, color: 'var(--text-3)', marginLeft: 8 }}>{cert.issuer}</span>}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </>
            )}

            {form.inputMode === 'custom' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  value={form.cert_name}
                  onChange={e => set('cert_name', e.target.value)}
                  placeholder="자격증명"
                  style={{ padding: '8px 12px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 'var(--r-md)', background: 'var(--bg)', color: 'var(--text)' }}
                />
                <select
                  value={form.category}
                  onChange={e => set('category', e.target.value)}
                  style={{ padding: '8px 12px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 'var(--r-md)', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-kr)' }}
                >
                  <option value="">카테고리 선택</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input
                  value={form.issuer}
                  onChange={e => set('issuer', e.target.value)}
                  placeholder="발급기관 (선택)"
                  style={{ padding: '8px 12px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 'var(--r-md)', background: 'var(--bg)', color: 'var(--text)' }}
                />
              </div>
            )}
          </div>
        )}

        {/* 상세 정보 폼 */}
        {showDetailForm && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'edit' && (
              <div style={{ padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', fontSize: 14, fontWeight: 600 }}>
                {form.cert_name}
                {form.category && <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 8 }}>{form.category}</span>}
              </div>
            )}

            <div>
              <label style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>상태</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {Object.entries(STATUS_META).map(([key, { label, bg, color }]) => (
                  <button key={key} onClick={() => set('status', key)}
                    style={{
                      fontSize: 12.5, padding: '6px 14px', borderRadius: 999,
                      background: form.status === key ? bg : 'var(--surface-2)',
                      color: form.status === key ? color : 'var(--text-3)',
                      fontWeight: form.status === key ? 700 : 400,
                      border: `1.5px solid ${form.status === key ? color : 'var(--border)'}`,
                    }}
                  >{label}</button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-2)' }}>진행도</label>
                <span style={{ fontSize: 12.5, fontWeight: 600, fontFamily: 'var(--font-en)' }}>{form.progress}%</span>
              </div>
              <input type="range" min={0} max={100} value={form.progress}
                onChange={e => set('progress', Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
            </div>

            <div className="grid-2col" style={{ gap: 12 }}>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>목표 날짜</label>
                <input type="date" value={form.target_date} onChange={e => set('target_date', e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 'var(--r-md)', background: 'var(--bg)', color: 'var(--text)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>취득일</label>
                <input type="date" value={form.acquired_date} onChange={e => set('acquired_date', e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 'var(--r-md)', background: 'var(--bg)', color: 'var(--text)' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>메모</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                rows={3} placeholder="자유롭게 메모하세요"
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 'var(--r-md)', background: 'var(--bg)', color: 'var(--text)', resize: 'vertical', fontFamily: 'var(--font-kr)' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-2)' }}>관련 링크</label>
                <button onClick={addLink} style={{ fontSize: 12, color: 'var(--accent)' }}>+ 추가</button>
              </div>
              {form.links.map((link, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <input value={link.url} onChange={e => updateLink(i, 'url', e.target.value)}
                    placeholder="URL" style={{ flex: 2, padding: '7px 10px', fontSize: 12.5, border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', background: 'var(--bg)', color: 'var(--text)' }}
                  />
                  <input value={link.label} onChange={e => updateLink(i, 'label', e.target.value)}
                    placeholder="라벨" style={{ flex: 1, padding: '7px 10px', fontSize: 12.5, border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', background: 'var(--bg)', color: 'var(--text)' }}
                  />
                  <button onClick={() => removeLink(i)} style={{ color: 'var(--urgent)', fontSize: 16, padding: '0 6px' }}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <p style={{ color: 'var(--urgent)', fontSize: 13, margin: '12px 0 0' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onClose} style={{ fontSize: 13, color: 'var(--text-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '9px 18px' }}>
            취소
          </button>
          <button onClick={handleSubmit} disabled={saving || !form.cert_name}
            style={{
              fontSize: 13, fontWeight: 600, color: '#FFF',
              background: (!form.cert_name || saving) ? 'var(--text-3)' : 'var(--accent)',
              borderRadius: 'var(--r-md)', padding: '9px 18px',
              cursor: (!form.cert_name || saving) ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── main page ───────────────────────────────────────── */

export default function CertsPage() {
  const { user, token, logout } = useAuth()
  const isMobile = useIsMobile()

  const [certs, setCerts] = useState([])
  const [presetList, setPresetList] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedStatuses, setSelectedStatuses] = useState(new Set())
  const [selectedCategories, setSelectedCategories] = useState(new Set())
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [modal, setModal] = useState(null) // null | { mode: 'add' | 'edit', cert?: UserCert }

  useEffect(() => {
    fetchCertifications().then(d => setPresetList(d || [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!token) { setLoading(false); return }
    fetchUserCerts(token)
      .then(d => setCerts(d || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  const filtered = useMemo(() => {
    let result = [...certs]
    if (selectedStatuses.size > 0) result = result.filter(c => selectedStatuses.has(c.status))
    if (selectedCategories.size > 0) result = result.filter(c => selectedCategories.has(c.category))
    return result
  }, [certs, selectedStatuses, selectedCategories])

  const toggle = (setFn, key) => setFn(prev => {
    const next = new Set(prev)
    next.has(key) ? next.delete(key) : next.add(key)
    return next
  })

  const handleSave = async (data) => {
    if (modal.mode === 'add') {
      const created = await addUserCert(token, data)
      setCerts(prev => [created, ...prev])
    } else {
      const updated = await updateUserCert(token, modal.cert.id, data)
      setCerts(prev => prev.map(c => c.id === updated.id ? updated : c))
    }
    setModal(null)
  }

  const handleDelete = async (id) => {
    if (!confirm('삭제하시겠습니까?')) return
    await deleteUserCert(token, id)
    setCerts(prev => prev.filter(c => c.id !== id))
  }

  const hasActiveFilter = selectedStatuses.size > 0 || selectedCategories.size > 0
  const filterProps = { certs, selectedStatuses, toggleStatus: k => toggle(setSelectedStatuses, k), selectedCategories, toggleCategory: k => toggle(setSelectedCategories, k) }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '12px 16px' : '14px 28px',
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isMobile ? (
            <button
              onClick={() => setMobileFilterOpen(true)}
              style={{ width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--r-sm)', color: 'var(--text-2)', position: 'relative' }}
              aria-label="필터 열기"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 5h12M5 9h8M7 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {hasActiveFilter && <span style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />}
            </button>
          ) : (
            <button
              onClick={() => setSidebarCollapsed(s => !s)}
              style={{ width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--r-sm)', color: 'var(--text-2)' }}
              aria-label="사이드바 토글"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="2.5" y="3" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
                <path d="M7 3v12" stroke="currentColor" strokeWidth="1.4" />
                {!sidebarCollapsed && <rect x="2.5" y="3" width="4.5" height="12" fill="currentColor" opacity="0.15" />}
              </svg>
            </button>
          )}
          <span style={{ color: 'var(--accent)', display: 'flex' }}><Icon.Logo size={20} /></span>
          <span style={{ fontFamily: 'var(--font-en)', fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>Path Pilot</span>
          <div style={{ display: 'flex', gap: 2 }}>
            {[
              { to: '/',      label: isMobile ? '공고' : '채용 공고', active: false },
              { to: '/news',  label: isMobile ? '뉴스' : '보안 뉴스', active: false },
              { to: '/certs', label: isMobile ? '자격증' : '자격증',  active: true },
            ].map(({ to, label, active }) => (
              <Link key={to} to={to} style={{
                fontSize: isMobile ? 11.5 : 13, fontWeight: active ? 600 : 500,
                color: active ? 'var(--text)' : 'var(--text-3)',
                padding: isMobile ? '3px 7px' : '4px 10px',
                borderRadius: 'var(--r-sm)',
                background: active ? 'var(--surface-2)' : 'transparent',
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}>{label}</Link>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link to="/resume" style={{
                fontSize: 13, fontWeight: 500, color: 'var(--text-2)',
                border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
                padding: isMobile ? '7px 10px' : '7px 12px',
                textDecoration: 'none', whiteSpace: 'nowrap',
                display: 'inline-flex', alignItems: 'center', gap: 5,
              }}>
                <Icon.User size={14} />
                {!isMobile && '내 이력서'}
              </Link>
              {!isMobile && <span style={{ fontSize: 12.5, color: 'var(--text-3)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>}
              <button onClick={logout} style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '7px 12px' }}>
                로그아웃
              </button>
            </div>
          ) : (
            <Link to="/login" style={{ fontSize: 13, fontWeight: 500, color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: 'var(--r-md)', padding: '8px 14px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
              로그인
            </Link>
          )}
        </div>
      </header>

      <div style={{
        flex: 1, display: isMobile ? 'block' : 'grid',
        gridTemplateColumns: sidebarCollapsed ? '1fr' : '220px 1fr',
        transition: 'grid-template-columns 0.25s ease',
      }}>
        {!isMobile && !sidebarCollapsed && (
          <aside style={{ borderRight: '1px solid var(--border)', background: 'var(--surface)', position: 'sticky', top: 57, height: 'calc(100vh - 57px)', overflowY: 'auto' }}>
            <SidebarContent {...filterProps} />
          </aside>
        )}

        <main style={{ padding: isMobile ? '16px 16px 60px' : '28px 32px 60px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <h2 style={{ fontWeight: 700, letterSpacing: '-0.025em', margin: 0, display: 'flex', alignItems: 'baseline', gap: 10, fontSize: isMobile ? 19 : 24 }}>
                자격증 트래커
                {!loading && <span style={{ fontFamily: 'var(--font-en)', fontSize: 14, color: 'var(--text-3)', fontWeight: 500 }}>{filtered.length}</span>}
              </h2>
              {!isMobile && <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '6px 0 0' }}>보안 자격증 취득 현황과 공부 진행도를 관리하세요.</p>}
            </div>
            {user && (
              <button
                onClick={() => setModal({ mode: 'add' })}
                style={{ fontSize: 13, fontWeight: 600, color: '#FFF', background: 'var(--accent)', padding: '9px 16px', borderRadius: 'var(--r-md)', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                + 자격증 추가
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)', fontSize: 14 }}>로딩 중...</div>
          ) : !user ? (
            <div style={{ textAlign: 'center', padding: '80px 24px' }}>
              <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 16 }}>자격증 트래커를 사용하려면 로그인이 필요합니다.</p>
              <Link to="/login" style={{ fontSize: 14, fontWeight: 600, color: '#FFF', background: 'var(--accent)', padding: '10px 24px', borderRadius: 'var(--r-md)', textDecoration: 'none' }}>로그인</Link>
            </div>
          ) : certs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 24px' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
              <h3 style={{ fontWeight: 700, fontSize: 18, margin: '0 0 8px' }}>등록된 자격증이 없습니다</h3>
              <p style={{ color: 'var(--text-2)', fontSize: 14, margin: '0 0 24px' }}>자격증 추가 버튼을 눌러 시작하세요.</p>
              <button onClick={() => setModal({ mode: 'add' })}
                style={{ fontSize: 14, fontWeight: 600, color: '#FFF', background: 'var(--accent)', padding: '12px 24px', borderRadius: 'var(--r-md)' }}>
                자격증 추가
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)', fontSize: 14 }}>필터 조건에 맞는 자격증이 없습니다.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(cert => (
                <CertCard
                  key={cert.id}
                  cert={cert}
                  onEdit={c => setModal({ mode: 'edit', cert: c })}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile filter drawer */}
      {isMobile && mobileFilterOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex' }} onClick={() => setMobileFilterOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: 280, background: 'var(--surface)', height: '100%', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px 12px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontWeight: 600, fontSize: 15 }}>필터</span>
              <button onClick={() => setMobileFilterOpen(false)} style={{ color: 'var(--text-2)', fontSize: 14 }}>닫기</button>
            </div>
            <SidebarContent {...filterProps} />
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <CertModal
          mode={modal.mode}
          initial={modal.cert}
          presetList={presetList}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
