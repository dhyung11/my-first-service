import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchResume, fetchProtectedFile } from '../api'
import { Icon } from '../icons'
import { useIsMobile } from '../utils'

/* ── data helpers ─────────────────────────────────────── */

function normalize(raw, email) {
  return {
    name: raw.name || '',
    nameEn: raw.name_en || '',
    email: email || '',
    phone: raw.phone || '',
    address: raw.address || '',
    military: raw.military_service || '',
    intro: raw.intro || '',
    photoPath: raw.photo_path || null,
    educations: raw.education || [],
    careers: raw.experience || [],
    projects: raw.projects || [],
    papers: raw.papers || [],
    patents: raw.patents || [],
    languages: raw.languages || [],
    certs: raw.certifications || [],
    resumeFilePath: raw.resume_file_path || null,
    portfolioFilePath: raw.portfolio_file_path || null,
    updatedAt: raw.updated_at,
  }
}

function parseYM(str) {
  if (!str) return null
  const m = str.match(/(\d{4})[.\-/](\d{1,2})/)
  return m ? new Date(+m[1], +m[2] - 1) : null
}

function calcCareerSummary(careers) {
  if (!careers.length) return null
  const now = new Date()
  let total = 0
  for (const c of careers) {
    const s = parseYM(c.start)
    const e = c.is_current ? now : parseYM(c.end)
    if (s && e && e > s) {
      total += (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth())
    }
  }
  if (!total) return null
  const y = Math.floor(total / 12), mo = total % 12
  return mo ? (y ? `${y}년 ${mo}개월` : `${mo}개월`) : `${y}년`
}

function calcCompleteness(r) {
  const checks = [
    !!r.name, r.educations.length > 0, r.careers.length > 0,
    r.projects.length > 0, r.papers.length > 0, r.patents.length > 0,
    r.languages.length > 0, r.certs.length > 0, !!r.resumeFilePath,
  ]
  return Math.round(checks.filter(Boolean).length / checks.length * 100)
}

function relativeTime(str) {
  if (!str) return ''
  const diff = Math.floor((Date.now() - new Date(str).getTime()) / 1000)
  if (diff < 60) return '방금 전'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  return `${Math.floor(diff / 86400)}일 전`
}

function basename(path) { return path?.split('/').pop() || '' }

/* ── shared sub-components ───────────────────────────── */

function PhotoPlaceholder({ name, size = 80, photoUrl }) {
  const colors = ['#2C5F8D', '#6B4A7A', '#5F4A2C', '#1B6B4F', '#2C5F4A', '#1E3A5F']
  const bg = colors[(name?.charCodeAt(0) || 0) % colors.length]
  if (photoUrl) {
    return <img src={photoUrl} alt={name} style={{ width: size, height: size, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
  }
  return (
    <div style={{ width: size, height: size, borderRadius: 12, background: bg, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.42, fontWeight: 700, fontFamily: 'var(--font-en)', flexShrink: 0 }}>
      {(name || '?')[0].toUpperCase()}
    </div>
  )
}

function CompletenessRing({ pct }) {
  const r = 36, c = 2 * Math.PI * r, offset = c - (pct / 100) * c
  return (
    <div style={{ position: 'relative', flexShrink: 0, width: 92, height: 92 }}>
      <svg width="92" height="92" viewBox="0 0 92 92">
        <circle cx="46" cy="46" r={r} stroke="var(--surface-2)" strokeWidth="6" fill="none" />
        <circle cx="46" cy="46" r={r} stroke="var(--accent)" strokeWidth="6" fill="none"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
          transform="rotate(-90 46 46)" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <div style={{ fontFamily: 'var(--font-en)', fontSize: 22, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>
          {pct}<span style={{ fontSize: 12 }}>%</span>
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 2, fontWeight: 500 }}>완성도</div>
      </div>
    </div>
  )
}

function SectionHeader({ title, count, sub }) {
  return (
    <div style={VS.sectionHeader}>
      <div>
        <h2 style={VS.sectionTitle}>
          {title}
          {count !== undefined && <span style={{ fontFamily: 'var(--font-en)', fontSize: 14, color: 'var(--text-3)', fontWeight: 500 }}>{count}</span>}
        </h2>
        {sub && <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '4px 0 0' }}>{sub}</p>}
      </div>
    </div>
  )
}

function EmptyMsg({ msg = '등록된 정보가 없습니다.' }) {
  return <p style={{ fontSize: 13.5, color: 'var(--text-3)', padding: '32px 0', textAlign: 'center' }}>{msg}</p>
}

/* ── section view components ─────────────────────────── */

function BasicSection({ r }) {
  const KV = ({ label, value, mono, last }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', alignItems: 'center', padding: '16px 22px', borderBottom: last ? 'none' : '1px solid var(--border)', fontSize: 13.5, gap: 12 }}>
      <span style={{ color: 'var(--text-3)', fontWeight: 500, fontSize: 12.5 }}>{label}</span>
      <span style={{ color: 'var(--text)', fontFamily: mono ? 'var(--font-en)' : 'inherit' }}>{value || '—'}</span>
    </div>
  )
  return (
    <div>
      <SectionHeader title="기본 정보" sub="채용 담당자에게 노출되는 핵심 인적 정보입니다." />
      <div style={VS.kvCard}>
        <KV label="이름" value={r.name} />
        <KV label="영문 이름" value={r.nameEn} mono />
        <KV label="이메일" value={r.email} mono />
        <KV label="연락처" value={r.phone} mono />
        <KV label="주소" value={r.address} />
        <KV label="군필 여부" value={r.military} last />
      </div>
    </div>
  )
}

function EducationSection({ items }) {
  if (!items.length) return <div><SectionHeader title="학력" count={0} /><EmptyMsg /></div>
  const groups = [
    { key: 'grad', label: '대학원', test: e => e.level?.includes('대학원') },
    { key: 'univ', label: '대학교', test: e => e.level === '대학교' },
    { key: 'high', label: '고등학교', test: e => e.level === '고등학교' },
    { key: 'etc', label: '기타', test: e => !e.level?.includes('대학원') && e.level !== '대학교' && e.level !== '고등학교' },
  ]
  return (
    <div>
      <SectionHeader title="학력" count={items.length} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {groups.map(g => {
          const list = items.filter(g.test)
          if (!list.length) return null
          return (
            <div key={g.key}>
              <div style={VS.groupLabel}>{g.label}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {list.map((e, i) => (
                  <div key={e.id || i} style={VS.entryCard}>
                    <div style={VS.entryTop}>
                      <div style={{ flex: 1 }}>
                        <h3 style={VS.entryTitle}>{e.school}</h3>
                        <div style={VS.entrySub}>{[e.major, e.degree].filter(Boolean).join(' · ')}</div>
                      </div>
                      <div style={VS.entryRight}>
                        <div style={VS.entryPeriod}>{[e.start, e.end].filter(Boolean).join(' – ')}</div>
                        {e.gpa && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 8px', border: '1px solid var(--border)', borderRadius: 6 }}>
                            <span style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 500, letterSpacing: '0.04em' }}>GPA</span>
                            <span style={{ fontFamily: 'var(--font-en)', fontSize: 12, fontWeight: 600 }}>{e.gpa}</span>
                          </div>
                        )}
                        {e.status && <div style={VS.statusPill}>{e.status}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CareerSection({ items, careerSummary }) {
  if (!items.length) return <div><SectionHeader title="직장 경력" count={0} /><EmptyMsg /></div>
  const currentCareer = items.find(c => c.is_current) || items[0]
  return (
    <div>
      <SectionHeader title="직장 경력" count={items.length} />
      {careerSummary && (
        <div style={VS.summaryCard}>
          <div style={VS.summaryItem}>
            <div style={VS.summaryLabel}>총 경력</div>
            <div style={VS.summaryValue}>{careerSummary}</div>
          </div>
          <div style={VS.summaryDivider} />
          <div style={VS.summaryItem}>
            <div style={VS.summaryLabel}>현재 소속</div>
            <div style={{ ...VS.summaryValue, fontSize: 16 }}>{currentCareer.company}</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{currentCareer.role}</div>
          </div>
          <div style={VS.summaryDivider} />
          <div style={VS.summaryItem}>
            <div style={VS.summaryLabel}>회사 수</div>
            <div style={VS.summaryValue}>{items.length}<span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)', marginLeft: 4 }}>곳</span></div>
          </div>
        </div>
      )}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((c, i) => (
          <li key={c.id || i} style={{ display: 'flex', gap: 16, position: 'relative' }}>
            <div style={{ width: 14, position: 'relative', flexShrink: 0, paddingTop: 22 }}>
              <div style={{ ...VS.timeDot, ...(c.is_current ? VS.timeDotCurrent : {}) }} />
              {i < items.length - 1 && <div style={VS.timeLine} />}
            </div>
            <div style={{ ...VS.entryCard, flex: 1, marginBottom: 10 }}>
              <div style={VS.entryTop}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <h3 style={VS.entryTitle}>{c.company}</h3>
                    {c.is_current && <span style={VS.currentPill}>현재</span>}
                  </div>
                  <div style={{ fontSize: 13.5, color: 'var(--text-2)', fontWeight: 500, marginBottom: 4 }}>{c.role}</div>
                  {c.desc && <p style={VS.entryDesc}>{c.desc}</p>}
                </div>
                <div style={VS.entryRight}>
                  <div style={VS.entryPeriod}>
                    {c.start}{c.start && ' – '}{c.is_current ? '현재' : c.end}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ProjectSection({ items }) {
  if (!items.length) return <div><SectionHeader title="프로젝트" count={0} /><EmptyMsg /></div>
  return (
    <div>
      <SectionHeader title="프로젝트" count={items.length} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((p, i) => (
          <div key={p.id || i} style={VS.entryCard}>
            <div style={VS.entryTop}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {p.role && <div style={{ marginBottom: 6 }}><span style={VS.roleBadge}>{p.role}</span></div>}
                <h3 style={VS.entryTitle}>{p.name}</h3>
                {p.desc && <p style={VS.entryDesc}>{p.desc}</p>}
                {p.stack?.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, paddingTop: 12, borderTop: '1px dashed var(--border)' }}>
                    <span style={{ fontFamily: 'var(--font-en)', fontSize: 10.5, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>Stack</span>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {p.stack.map(s => <span key={s} style={VS.stackTag}>{s}</span>)}
                    </div>
                  </div>
                )}
              </div>
              <div style={VS.entryRight}>
                <div style={VS.entryPeriod}>{[p.start, p.end].filter(Boolean).join(' – ')}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PaperSection({ items }) {
  if (!items.length) return <div><SectionHeader title="논문" count={0} /><EmptyMsg /></div>
  return (
    <div>
      <SectionHeader title="논문" count={items.length} sub="국제 학회 / 저널 발표 논문" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((p, i) => (
          <div key={p.id || i} style={VS.entryCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, fontSize: 12, marginBottom: 6 }}>
              {p.venue && <span style={{ fontFamily: 'var(--font-en)', fontSize: 12.5, fontWeight: 700, color: 'var(--accent)' }}>{p.venue}</span>}
              {p.year && <><span style={{ color: 'var(--border-strong)', margin: '0 6px' }}>·</span><span style={{ fontFamily: 'var(--font-en)', color: 'var(--text-2)', fontWeight: 500 }}>{p.year}</span></>}
              {p.role && <><span style={{ color: 'var(--border-strong)', margin: '0 6px' }}>·</span><span style={VS.roleBadge}>{p.role}</span></>}
            </div>
            <h3 style={VS.entryTitle}>{p.title}</h3>
            {p.authors && <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 6, fontStyle: 'italic' }}>{p.authors}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

function PatentSection({ items }) {
  if (!items.length) return <div><SectionHeader title="특허" count={0} /><EmptyMsg /></div>
  return (
    <div>
      <SectionHeader title="특허" count={items.length} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((p, i) => (
          <div key={p.id || i} style={VS.entryCard}>
            <div style={VS.entryTop}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, fontSize: 12, marginBottom: 6 }}>
                  {p.number && <span style={{ fontFamily: 'var(--font-en)', fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>{p.number}</span>}
                  {p.year && <><span style={{ color: 'var(--border-strong)', margin: '0 6px' }}>·</span><span style={{ fontFamily: 'var(--font-en)', color: 'var(--text-2)', fontWeight: 500 }}>{p.year}</span></>}
                  {p.role && <><span style={{ color: 'var(--border-strong)', margin: '0 6px' }}>·</span><span style={VS.roleBadge}>{p.role}</span></>}
                </div>
                <h3 style={VS.entryTitle}>{p.title}</h3>
              </div>
              {p.status && <div style={{ textAlign: 'right', flexShrink: 0 }}><div style={VS.statusPill}>{p.status}</div></div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function LanguageSection({ items }) {
  if (!items.length) return <div><SectionHeader title="어학" count={0} /><EmptyMsg /></div>
  const byLang = items.reduce((acc, l) => { (acc[l.language] = acc[l.language] || []).push(l); return acc }, {})
  return (
    <div>
      <SectionHeader title="어학" count={items.length} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Object.entries(byLang).map(([lang, list]) => (
          <div key={lang} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '12px 20px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{lang}</span>
              <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-en)' }}>{list.length}건</span>
            </div>
            {list.map((l, i) => (
              <div key={l.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: i < list.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{l.test}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-en)' }}>{l.year}년 취득</div>
                </div>
                <div style={{ fontFamily: 'var(--font-en)', fontSize: 18, fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.02em' }}>{l.score}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function CertSection({ items }) {
  if (!items.length) return <div><SectionHeader title="자격증" count={0} /><EmptyMsg /></div>
  return (
    <div>
      <SectionHeader title="자격증" count={items.length} />
      <div className="grid-2col" style={{ gap: 10 }}>
        {items.map((c, i) => (
          <div key={c.id || i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '16px 18px' }}>
            <div style={{ width: 38, height: 38, borderRadius: 8, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🏅</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontSize: 14.5, fontWeight: 600, margin: '0 0 2px', letterSpacing: '-0.01em' }}>{c.name}</h3>
              <div style={VS.entrySub}>{c.issuer}</div>
              <div style={{ display: 'flex', alignItems: 'center', marginTop: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-en)' }}>{c.year}년 취득</span>
                {c.expires && <><span style={{ color: 'var(--border-strong)', margin: '0 6px' }}>·</span><span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-en)' }}>~{c.expires}</span></>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FilesSection({ resumeFilePath, portfolioFilePath, token }) {
  async function download(filePath) {
    if (!filePath || !token) return
    const url = await fetchProtectedFile(token, filePath)
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = basename(filePath)
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const FileRow = ({ type, filePath, primary }) => (
    <div style={VS.fileRow}>
      <div style={{ width: 48, height: 48, borderRadius: 8, background: primary ? 'var(--accent-soft)' : 'var(--surface-2)', color: primary ? 'var(--accent)' : 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon.File size={22} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>{type}</div>
        {filePath ? (
          <div style={{ fontSize: 14, fontWeight: 600 }}>{basename(filePath)}</div>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--text-3)' }}>업로드된 파일 없음</div>
        )}
      </div>
      {filePath && (
        <button onClick={() => download(filePath)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 500, color: 'var(--text-2)', background: 'var(--surface)', border: '1px solid var(--border)', padding: '8px 14px', borderRadius: 'var(--r-md)' }}>
          <Icon.Download /> 다운로드
        </button>
      )}
    </div>
  )

  return (
    <div>
      <SectionHeader title="첨부 파일" sub="채용 지원 시 함께 전송됩니다." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <FileRow type="이력서" filePath={resumeFilePath} primary />
        <FileRow type="포트폴리오" filePath={portfolioFilePath} />
      </div>
    </div>
  )
}

/* ── styles ──────────────────────────────────────────── */
const VS = {
  sectionHeader: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22, paddingBottom: 14, borderBottom: '1px solid var(--border)' },
  sectionTitle: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', margin: 0, display: 'flex', alignItems: 'baseline', gap: 10 },
  kvCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden' },
  groupLabel: { fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4 },
  entryCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '18px 22px' },
  entryTop: { display: 'flex', justifyContent: 'space-between', gap: 24 },
  entryTitle: { fontSize: 16, fontWeight: 600, letterSpacing: '-0.015em', margin: '0 0 4px' },
  entrySub: { fontSize: 13, color: 'var(--text-2)' },
  entryDesc: { fontSize: 13.5, color: 'var(--text-2)', margin: '10px 0 0', lineHeight: 1.65 },
  entryRight: { textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 },
  entryPeriod: { fontFamily: 'var(--font-en)', fontSize: 13, fontWeight: 500, color: 'var(--text)' },
  statusPill: { display: 'inline-block', fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'var(--new-soft)', color: 'var(--new)', fontWeight: 600 },
  summaryCard: { display: 'flex', alignItems: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '20px 28px', marginBottom: 18 },
  summaryItem: { flex: 1, minWidth: 0 },
  summaryLabel: { fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 },
  summaryValue: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', fontFamily: 'var(--font-en)', color: 'var(--text)' },
  summaryDivider: { width: 1, height: 44, background: 'var(--border)', margin: '0 24px' },
  timeDot: { width: 12, height: 12, borderRadius: '50%', background: 'var(--surface)', border: '2px solid var(--border-strong)', position: 'relative', zIndex: 1 },
  timeDotCurrent: { background: 'var(--accent)', borderColor: 'var(--accent)', boxShadow: '0 0 0 4px var(--accent-soft)' },
  timeLine: { position: 'absolute', left: 5, top: 32, bottom: -12, width: 2, background: 'var(--border)' },
  currentPill: { fontSize: 10.5, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-soft)', padding: '2px 7px', borderRadius: 999 },
  roleBadge: { display: 'inline-block', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 4 },
  stackTag: { fontFamily: 'var(--font-en)', fontSize: 11.5, fontWeight: 500, color: 'var(--text-2)', background: 'var(--surface-2)', padding: '3px 8px', borderRadius: 4 },
  fileRow: { display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' },
}

/* ── main page ───────────────────────────────────────── */

export default function ResumePage() {
  const { user, token, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useIsMobile()
  const [resume, setResume] = useState(null)
  const [loading, setLoading] = useState(true)
  const [photoUrl, setPhotoUrl] = useState(null)
  const [active, setActive] = useState(location.state?.section || 'basic')
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!authLoading && !user) navigate('/login', { replace: true })
  }, [authLoading, user, navigate])

  useEffect(() => {
    if (!token) return
    fetchResume(token)
      .then(raw => setResume(raw ? normalize(raw, user?.email) : null))
      .finally(() => setLoading(false))
  }, [token, user?.email])

  useEffect(() => {
    if (!resume?.photoPath || !token) return
    let url
    fetchProtectedFile(token, resume.photoPath).then(u => { url = u; setPhotoUrl(u) })
    return () => { if (url) URL.revokeObjectURL(url) }
  }, [resume?.photoPath, token])

  if (authLoading || loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-3)', fontSize: 14 }}>로딩 중...</div>
  }

  if (!resume || !resume.name) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ fontSize: 48 }}>📝</div>
        <h2 style={{ fontWeight: 700, fontSize: 22, margin: 0 }}>아직 이력서가 없습니다</h2>
        <p style={{ color: 'var(--text-2)', fontSize: 14, margin: 0 }}>지금 바로 이력서를 작성해보세요.</p>
        <Link to="/resume/edit" style={{ fontSize: 14, fontWeight: 600, color: '#FFF', background: 'var(--accent)', padding: '12px 24px', borderRadius: 'var(--r-md)', textDecoration: 'none', marginTop: 8 }}>
          이력서 작성 시작
        </Link>
        <Link to="/" style={{ fontSize: 13, color: 'var(--text-3)', textDecoration: 'none' }}>← 채용 공고 보기</Link>
      </div>
    )
  }

  const careerSummary = calcCareerSummary(resume.careers)
  const completeness = calcCompleteness(resume)

  const sections = [
    { id: 'basic', label: '기본 정보', filled: !!(resume.name) },
    { id: 'education', label: '학력', count: resume.educations.length, filled: resume.educations.length > 0 },
    { id: 'career', label: '직장 경력', count: resume.careers.length, filled: resume.careers.length > 0 },
    { id: 'project', label: '프로젝트', count: resume.projects.length, filled: resume.projects.length > 0 },
    { id: 'paper', label: '논문', count: resume.papers.length, filled: resume.papers.length > 0 },
    { id: 'patent', label: '특허', count: resume.patents.length, filled: resume.patents.length > 0 },
    { id: 'language', label: '어학', count: resume.languages.length, filled: resume.languages.length > 0 },
    { id: 'cert', label: '자격증', count: resume.certs.length, filled: resume.certs.length > 0 },
    { id: 'files', label: '첨부 파일', filled: !!(resume.resumeFilePath) },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'var(--text)', color: '#FFF', fontSize: 13, fontWeight: 500, padding: '10px 20px', borderRadius: 'var(--r-md)', zIndex: 100 }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '12px 16px' : '14px 28px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-2)', fontWeight: 500, padding: '6px 10px', borderRadius: 'var(--r-sm)', textDecoration: 'none' }}>
            <Icon.Back /> {!isMobile && '채용 공고'}
          </Link>
          {!isMobile && (
            <>
              <span style={{ color: 'var(--text-3)' }}>/</span>
              <span style={{ color: 'var(--accent)', display: 'flex' }}><Icon.Logo size={18} /></span>
              <span style={{ fontSize: 14, color: 'var(--text-2)', fontWeight: 500 }}>내 이력서</span>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!isMobile && <span style={{ fontSize: 12, color: 'var(--text-3)', marginRight: 6 }}>최근 수정 {relativeTime(resume.updatedAt)}</span>}
          {!isMobile && (
            <button
              onClick={() => { setToast('PDF 내보내기는 준비 중입니다.'); setTimeout(() => setToast(''), 2000) }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-2)', background: 'var(--surface)', border: '1px solid var(--border)', padding: '9px 14px', borderRadius: 'var(--r-md)' }}
            >
              <Icon.Download size={13} /> PDF 내보내기
            </button>
          )}
          <Link to="/resume/edit" state={{ section: active }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: '#FFF', background: 'var(--accent)', padding: isMobile ? '9px 12px' : '9px 14px', borderRadius: 'var(--r-md)', textDecoration: 'none' }}>
            <Icon.Edit /> {!isMobile && '이력서 수정'}
          </Link>
        </div>
      </header>

      {/* Profile bar */}
      <section style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 14 : 28, padding: isMobile ? '20px 16px' : '32px 36px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        <PhotoPlaceholder name={resume.name} size={isMobile ? 64 : 96} photoUrl={photoUrl} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: isMobile ? 24 : 30, fontWeight: 700, letterSpacing: '-0.025em', margin: 0 }}>{resume.name}</h1>
            {resume.nameEn && <span style={{ fontFamily: 'var(--font-en)', fontSize: 14, color: 'var(--text-3)', fontWeight: 500 }}>{resume.nameEn}</span>}
            {careerSummary && (
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-soft)', padding: '3px 10px', borderRadius: 999 }}>
                경력 {careerSummary}
              </span>
            )}
          </div>
          {resume.intro && <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '0 0 14px', lineHeight: 1.6, maxWidth: 720 }}>{resume.intro}</p>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {resume.email && <MetaChip icon="✉" value={resume.email} mono />}
            {resume.phone && <MetaChip icon="☎" value={resume.phone} mono />}
            {resume.address && <MetaChip icon="◉" value={resume.address.split(' ').slice(0, 2).join(' ')} />}
          </div>
        </div>
        {!isMobile && <CompletenessRing pct={completeness} />}
      </section>

      {/* Body */}
      <div style={isMobile ? {} : { display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: 600 }}>
        {isMobile ? (
          <div style={{ overflowX: 'auto', borderBottom: '1px solid var(--border)', background: 'var(--surface)', WebkitOverflowScrolling: 'touch' }}>
            <div style={{ display: 'flex', padding: '0 8px', minWidth: 'max-content' }}>
              {sections.map(s => (
                <button key={s.id} onClick={() => setActive(s.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '10px 12px', fontSize: 13, fontWeight: active === s.id ? 600 : 500, color: active === s.id ? 'var(--accent)' : 'var(--text-2)', borderBottom: `2px solid ${active === s.id ? 'var(--accent)' : 'transparent'}`, whiteSpace: 'nowrap', background: 'transparent' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: active === s.id ? 'var(--accent)' : (s.filled ? 'var(--new)' : 'var(--border-strong)'), flexShrink: 0 }} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <aside style={{ padding: '24px 16px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--surface)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0 12px', marginBottom: 10 }}>이력서 섹션</div>
            {sections.map(s => (
              <button key={s.id} onClick={() => setActive(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 'var(--r-sm)', fontSize: 13.5, color: active === s.id ? 'var(--accent)' : 'var(--text-2)', fontWeight: active === s.id ? 600 : 500, width: '100%', background: active === s.id ? 'var(--accent-soft)' : 'transparent' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: active === s.id ? 'var(--accent)' : (s.filled ? 'var(--new)' : 'var(--border-strong)'), flexShrink: 0 }} />
                <span style={{ flex: 1, textAlign: 'left' }}>{s.label}</span>
                {s.count !== undefined && <span style={{ fontFamily: 'var(--font-en)', fontSize: 11.5, color: 'var(--text-3)', fontWeight: 500 }}>{s.count}</span>}
              </button>
            ))}
          </aside>
        )}

        <main style={{ padding: isMobile ? '20px 16px 60px' : '32px 40px 60px' }}>
          {active === 'basic' && <BasicSection r={resume} />}
          {active === 'education' && <EducationSection items={resume.educations} />}
          {active === 'career' && <CareerSection items={resume.careers} careerSummary={careerSummary} />}
          {active === 'project' && <ProjectSection items={resume.projects} />}
          {active === 'paper' && <PaperSection items={resume.papers} />}
          {active === 'patent' && <PatentSection items={resume.patents} />}
          {active === 'language' && <LanguageSection items={resume.languages} />}
          {active === 'cert' && <CertSection items={resume.certs} />}
          {active === 'files' && <FilesSection resumeFilePath={resume.resumeFilePath} portfolioFilePath={resume.portfolioFilePath} token={token} />}
        </main>
      </div>
    </div>
  )
}

function MetaChip({ icon, value, mono }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-2)', background: 'var(--surface-2)', padding: '4px 10px', borderRadius: 999 }}>
      <span style={{ color: 'var(--text-3)', fontSize: 11 }}>{icon}</span>
      <span style={{ fontFamily: mono ? 'var(--font-en)' : 'inherit' }}>{value}</span>
    </span>
  )
}
