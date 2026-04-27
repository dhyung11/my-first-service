import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchResume, upsertResume, uploadResumeFile, fetchProtectedFile } from '../api'
import { Icon } from '../icons'

/* ── helpers ──────────────────────────────────────────── */

function genId() { return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) }

function fromApi(raw, email) {
  const withIds = arr => (arr || []).map(item => item.id ? item : { id: genId(), ...item })
  return {
    name: raw?.name || '',
    nameEn: raw?.name_en || '',
    email: email || '',
    phone: raw?.phone || '',
    address: raw?.address || '',
    military: raw?.military_service || '',
    intro: raw?.intro || '',
    educations: withIds(raw?.education),
    careers: withIds(raw?.experience),
    projects: withIds(raw?.projects),
    papers: withIds(raw?.papers),
    patents: withIds(raw?.patents),
    languages: withIds(raw?.languages),
    certs: withIds(raw?.certifications),
    resumeFilePath: raw?.resume_file_path || null,
    portfolioFilePath: raw?.portfolio_file_path || null,
    photoPath: raw?.photo_path || null,
  }
}

function toApi(form) {
  return {
    name: form.name,
    name_en: form.nameEn,
    phone: form.phone,
    intro: form.intro,
    address: form.address,
    military_service: form.military,
    education: form.educations,
    experience: form.careers,
    projects: form.projects,
    papers: form.papers,
    patents: form.patents,
    languages: form.languages,
    certifications: form.certs,
  }
}

function calcProgress(form) {
  const filled = [
    !!(form.name && form.phone),
    form.educations.length > 0,
    form.careers.length > 0,
    form.projects.length > 0,
    form.papers.length > 0,
    form.patents.length > 0,
    form.languages.length > 0,
    form.certs.length > 0,
    !!(form.resumeFilePath),
  ]
  return { done: filled.filter(Boolean).length, total: filled.length }
}

/* ── common field components ─────────────────────────── */

function Label({ children, required, hint }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
      <label style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-2)' }}>
        {children}{required && <span style={{ color: 'var(--urgent)', marginLeft: 3 }}>*</span>}
      </label>
      {hint && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{hint}</span>}
    </div>
  )
}

function Field({ label, value, onChange, required, placeholder, full, textarea, hint, helper, mono, prefix }) {
  const max = textarea ? 500 : null
  const inputStyle = { ...ES.input, ...(prefix ? { paddingLeft: 36 } : {}), ...(mono ? { fontFamily: 'var(--font-en)' } : {}) }
  return (
    <div style={{ gridColumn: full ? '1 / -1' : 'auto' }}>
      <Label required={required} hint={hint}>{label}</Label>
      <div style={{ position: 'relative' }}>
        {prefix && <span style={ES.inputPrefix}>{prefix}</span>}
        {textarea ? (
          <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
            style={{ ...ES.input, ...ES.textarea }} />
        ) : (
          <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
        )}
      </div>
      <div style={ES.helperRow}>
        {helper && <span style={ES.helper}>{helper}</span>}
        {max && <span style={ES.charCount}>{(value || '').length}/{max}</span>}
      </div>
    </div>
  )
}

function SegmentField({ label, required, value, onChange, options, full }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : 'auto' }}>
      <Label required={required}>{label}</Label>
      <div style={ES.segments}>
        {options.map(opt => (
          <button key={opt} onClick={() => onChange(opt)}
            style={{ ...ES.segment, ...(value === opt ? ES.segmentActive : {}) }}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

function PeriodField({ label, required, start, end, isCurrent, onStartChange, onEndChange, onCurrentChange, showToggle, full }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : 'auto' }}>
      <Label required={required}>{label}</Label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input value={start || ''} onChange={e => onStartChange(e.target.value)} placeholder="2020.03"
          style={{ ...ES.input, width: 110, fontFamily: 'var(--font-en)' }} />
        <span style={{ color: 'var(--text-3)', fontSize: 13 }}>~</span>
        {isCurrent ? (
          <div style={{ ...ES.input, width: 110, color: 'var(--text-3)', fontFamily: 'var(--font-en)', display: 'flex', alignItems: 'center' }}>현재</div>
        ) : (
          <input value={end || ''} onChange={e => onEndChange(e.target.value)} placeholder="2024.02"
            style={{ ...ES.input, width: 110, fontFamily: 'var(--font-en)' }} />
        )}
        {showToggle && (
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-2)', cursor: 'pointer', marginLeft: 4 }}>
            <input type="checkbox" checked={!!isCurrent} onChange={e => onCurrentChange(e.target.checked)}
              style={{ width: 14, height: 14, accentColor: 'var(--accent)', cursor: 'pointer', margin: 0 }} />
            <span>현재 재직중</span>
          </label>
        )}
      </div>
    </div>
  )
}

function ChipsField({ label, value, onChange, full, hint }) {
  const [draft, setDraft] = useState('')
  const chips = value || []
  const addChip = () => {
    const t = draft.trim()
    if (t && !chips.includes(t)) { onChange([...chips, t]); setDraft('') }
  }
  return (
    <div style={{ gridColumn: full ? '1 / -1' : 'auto' }}>
      <Label hint={hint}>{label}</Label>
      <div style={ES.chipsBox}>
        {chips.map(c => (
          <span key={c} style={ES.chip}>
            {c}
            <button onClick={() => onChange(chips.filter(x => x !== c))} style={ES.chipX}>×</button>
          </span>
        ))}
        <input value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addChip() } }}
          onBlur={addChip}
          placeholder={chips.length === 0 ? '예: Python, AWS (Enter로 추가)' : '추가...'}
          style={ES.chipsInput} />
      </div>
    </div>
  )
}

/* ── entry card ──────────────────────────────────────── */

function EntryCard({ idx, summary, defaultOpen = false, children, onDelete }) {
  const [open, setOpen] = useState(idx === 0 ? true : defaultOpen)
  return (
    <div style={{ ...ES.formCard, ...(open ? {} : { background: 'var(--surface)' }) }}>
      <div style={ES.entryHeadRow}>
        <span style={{ fontFamily: 'var(--font-en)', fontSize: 11.5, color: 'var(--text-3)', fontWeight: 600, minWidth: 22 }}>#{idx + 1}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          {summary && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{summary.title}</span>
              {summary.sub && <span style={{ fontSize: 12, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{summary.sub}</span>}
            </div>
          )}
        </div>
        <button onClick={() => setOpen(o => !o)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--text-3)', fontWeight: 500, padding: '5px 10px', borderRadius: 4 }}>
          {open ? '접기' : '펼치기'}
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <button onClick={onDelete} style={{ width: 28, height: 28, borderRadius: 6, color: 'var(--text-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon.Trash />
        </button>
      </div>
      {open && <div style={ES.entryBody}>{children}</div>}
    </div>
  )
}

function EmptyState({ icon, title, sub, ctaLabel, onAdd }) {
  return (
    <div style={{ padding: '60px 24px', textAlign: 'center', background: 'var(--surface)', border: '1px dashed var(--border-strong)', borderRadius: 'var(--r-lg)' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 18 }}>{sub}</div>
      <button onClick={onAdd} style={ES.addBtn}><Icon.Plus /> {ctaLabel}</button>
    </div>
  )
}

function AddBtn({ label, onClick }) {
  return <button onClick={onClick} style={ES.addBtn}><Icon.Plus /> {label}</button>
}

function SectionHead({ title, count, sub, action }) {
  return (
    <div style={ES.headRow}>
      <div>
        <h2 style={ES.h2}>
          {title}
          {count !== undefined && <span style={{ fontFamily: 'var(--font-en)', fontSize: 14, color: 'var(--text-3)', fontWeight: 500 }}>{count}</span>}
        </h2>
        {sub && <p style={ES.h2Sub}>{sub}</p>}
      </div>
      {action}
    </div>
  )
}

/* ── section edit components ─────────────────────────── */

function EditBasic({ form, onFieldChange, token, onPhotoUploaded }) {
  const fileRef = useRef()
  const [photoUrl, setPhotoUrl] = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!form.photoPath || !token) return
    let url
    fetchProtectedFile(token, form.photoPath).then(u => { url = u; setPhotoUrl(u) })
    return () => { if (url) URL.revokeObjectURL(url) }
  }, [form.photoPath, token])

  async function handlePhotoFile(file) {
    if (!file) return
    setUploading(true)
    try {
      const res = await uploadResumeFile(token, 'photo', file)
      onPhotoUploaded(res.url.replace('/api/uploads/', ''))
      const newUrl = await fetchProtectedFile(token, res.url.replace('/api/uploads/', ''))
      setPhotoUrl(newUrl)
    } finally {
      setUploading(false)
    }
  }

  const initial = (form.name || '?')[0].toUpperCase()
  const colors = ['#2C5F8D', '#6B4A7A', '#5F4A2C', '#1B6B4F', '#2C5F4A', '#1E3A5F']
  const bg = colors[(form.name?.charCodeAt(0) || 0) % colors.length]

  return (
    <div>
      <SectionHead title="기본 정보" sub="이력서 상단에 표시되는 핵심 인적 정보입니다." />
      <div style={ES.formCard}>
        <div style={ES.formCardSection}>
          <div style={ES.cardSectionLabel}>증명사진</div>
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ position: 'relative', width: 96, flexShrink: 0 }}>
              {photoUrl
                ? <img src={photoUrl} alt="photo" style={{ width: 96, height: 96, borderRadius: 12, objectFit: 'cover' }} />
                : <div style={{ width: 96, height: 96, borderRadius: 12, background: bg, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 700, fontFamily: 'var(--font-en)' }}>{initial}</div>
              }
              <button onClick={() => fileRef.current?.click()} style={{ position: 'absolute', bottom: -8, right: -8, width: 32, height: 32, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border-strong)', color: 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)' }}>
                <Icon.Edit />
              </button>
            </div>
            <div style={{ flex: 1, paddingTop: 4 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>증명사진을 업로드하세요</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.7 }}>
                · 권장 크기 350 × 450px (3:4 비율)<br />
                · 최대 5MB · JPG, PNG, WEBP<br />
                · 정면 상반신, 깔끔한 배경
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', background: 'var(--surface)', border: '1px solid var(--border-strong)', padding: '6px 12px', borderRadius: 6 }}>
                  {uploading ? '업로드 중...' : '파일 선택'}
                </button>
              </div>
            </div>
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" style={{ display: 'none' }}
              onChange={e => handlePhotoFile(e.target.files?.[0])} />
          </div>
        </div>

        <div style={ES.cardDivider} />

        <div style={ES.formCardSection}>
          <div style={ES.cardSectionLabel}>인적 사항</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="이름" value={form.name} onChange={v => onFieldChange('name', v)} required />
            <Field label="영문 이름" value={form.nameEn} onChange={v => onFieldChange('nameEn', v)} placeholder="Hong Gil-dong" mono helper="여권 표기와 동일하게 입력" />
            <Field label="이메일" value={form.email} onChange={() => {}} mono prefix="✉" hint="계정 설정에서 변경" />
            <Field label="연락처" value={form.phone} onChange={v => onFieldChange('phone', v)} required mono prefix="☎" placeholder="010-0000-0000" />
            <Field label="주소" value={form.address} onChange={v => onFieldChange('address', v)} full helper="시/구까지만 표시됩니다" />
            <Field label="군필 여부" value={form.military} onChange={v => onFieldChange('military', v)} full hint="해당 없음 시 빈칸" />
            <Field label="자기소개" value={form.intro} onChange={v => onFieldChange('intro', v)} full textarea hint="500자 이내" />
          </div>
        </div>
      </div>
    </div>
  )
}

function EditEducation({ items, onChange }) {
  function update(id, key, val) { onChange(items.map(e => e.id === id ? { ...e, [key]: val } : e)) }
  function remove(id) { onChange(items.filter(e => e.id !== id)) }
  function add() { onChange([...items, { id: genId(), level: '대학교', school: '', major: '', degree: '', start: '', end: '', gpa: '', status: '졸업' }]) }

  if (!items.length) return (
    <div>
      <SectionHead title="학력" sub="대학원 / 대학교 / 고등학교를 모두 입력하세요." />
      <EmptyState icon="🎓" title="등록된 학력이 없습니다" sub="가장 최근 학력부터 순서대로 추가해주세요." ctaLabel="학력 추가" onAdd={add} />
    </div>
  )
  return (
    <div>
      <SectionHead title="학력" count={items.length} sub="대학원 / 대학교 / 고등학교를 모두 입력하세요." action={<AddBtn label="학력 추가" onClick={add} />} />
      <div style={ES.entryList}>
        {items.map((e, idx) => (
          <EntryCard key={e.id} idx={idx} summary={{ title: e.school || '(미입력)', sub: [e.level, e.major].filter(Boolean).join(' · ') }} onDelete={() => remove(e.id)}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <SegmentField label="구분" required value={e.level} onChange={v => update(e.id, 'level', v)} options={['고등학교', '대학교', '대학원 (석사)', '대학원 (박사)']} />
              <Field label="학교명" value={e.school} onChange={v => update(e.id, 'school', v)} required />
              <Field label="전공" value={e.major} onChange={v => update(e.id, 'major', v)} required />
              <Field label="학위" value={e.degree} onChange={v => update(e.id, 'degree', v)} placeholder="학사 / 석사 / 박사" />
              <PeriodField label="재학 기간" required start={e.start} end={e.end} isCurrent={false} onStartChange={v => update(e.id, 'start', v)} onEndChange={v => update(e.id, 'end', v)} onCurrentChange={() => {}} />
              <Field label="학점" value={e.gpa} onChange={v => update(e.id, 'gpa', v)} placeholder="3.8 / 4.5" mono />
              <SegmentField label="졸업 상태" value={e.status} onChange={v => update(e.id, 'status', v)} options={['졸업', '재학중', '휴학중', '수료', '중퇴']} />
            </div>
          </EntryCard>
        ))}
      </div>
    </div>
  )
}

function EditCareer({ items, onChange }) {
  function update(id, key, val) { onChange(items.map(c => c.id === id ? { ...c, [key]: val } : c)) }
  function remove(id) { onChange(items.filter(c => c.id !== id)) }
  function add() { onChange([...items, { id: genId(), company: '', role: '', start: '', end: '', is_current: false, desc: '' }]) }

  if (!items.length) return (
    <div>
      <SectionHead title="직장 경력" sub="가장 최근 경력부터 입력하세요." />
      <EmptyState icon="💼" title="등록된 경력이 없습니다" sub="가장 최근 직장부터 순서대로 추가해주세요." ctaLabel="경력 추가" onAdd={add} />
    </div>
  )
  return (
    <div>
      <SectionHead title="직장 경력" count={items.length} sub="가장 최근 경력부터 입력하세요." action={<AddBtn label="경력 추가" onClick={add} />} />
      <div style={ES.entryList}>
        {items.map((c, idx) => (
          <EntryCard key={c.id} idx={idx} summary={{ title: c.company || '(미입력)', sub: c.role }} onDelete={() => remove(c.id)}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="회사명" value={c.company} onChange={v => update(c.id, 'company', v)} required />
              <Field label="직책/직무" value={c.role} onChange={v => update(c.id, 'role', v)} required placeholder="Senior Security Engineer" />
              <PeriodField label="재직 기간" required start={c.start} end={c.end} isCurrent={c.is_current} onStartChange={v => update(c.id, 'start', v)} onEndChange={v => update(c.id, 'end', v)} onCurrentChange={v => update(c.id, 'is_current', v)} showToggle full />
              <Field label="주요 업무" value={c.desc} onChange={v => update(c.id, 'desc', v)} textarea full helper="구체적인 성과와 임팩트를 함께 기술하세요" />
            </div>
          </EntryCard>
        ))}
      </div>
    </div>
  )
}

function EditProject({ items, onChange }) {
  function update(id, key, val) { onChange(items.map(p => p.id === id ? { ...p, [key]: val } : p)) }
  function remove(id) { onChange(items.filter(p => p.id !== id)) }
  function add() { onChange([...items, { id: genId(), name: '', role: '', start: '', end: '', desc: '', stack: [] }]) }

  if (!items.length) return (
    <div>
      <SectionHead title="프로젝트" sub="업무·사이드·오픈소스 프로젝트 모두 가능합니다." />
      <EmptyState icon="🚀" title="등록된 프로젝트가 없습니다" sub="참여한 프로젝트를 추가해주세요." ctaLabel="프로젝트 추가" onAdd={add} />
    </div>
  )
  return (
    <div>
      <SectionHead title="프로젝트" count={items.length} sub="업무·사이드·오픈소스 프로젝트 모두 가능합니다." action={<AddBtn label="프로젝트 추가" onClick={add} />} />
      <div style={ES.entryList}>
        {items.map((p, idx) => (
          <EntryCard key={p.id} idx={idx} summary={{ title: p.name || '(미입력)', sub: p.role }} onDelete={() => remove(p.id)}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="프로젝트명" value={p.name} onChange={v => update(p.id, 'name', v)} required full />
              <Field label="역할" value={p.role} onChange={v => update(p.id, 'role', v)} placeholder="기술 리드 / 백엔드 / 풀스택" />
              <PeriodField label="기간" start={p.start} end={p.end} isCurrent={false} onStartChange={v => update(p.id, 'start', v)} onEndChange={v => update(p.id, 'end', v)} onCurrentChange={() => {}} />
              <Field label="설명" value={p.desc} onChange={v => update(p.id, 'desc', v)} textarea full helper="기술적 도전과 성과 위주로 작성" />
              <ChipsField label="기술 스택" value={p.stack} onChange={v => update(p.id, 'stack', v)} full hint={`${(p.stack || []).length}개`} />
            </div>
          </EntryCard>
        ))}
      </div>
    </div>
  )
}

function EditPaper({ items, onChange }) {
  function update(id, key, val) { onChange(items.map(p => p.id === id ? { ...p, [key]: val } : p)) }
  function remove(id) { onChange(items.filter(p => p.id !== id)) }
  function add() { onChange([...items, { id: genId(), title: '', venue: '', year: '', authors: '', role: '1저자' }]) }

  if (!items.length) return (
    <div>
      <SectionHead title="논문" sub="국제 학회 / 저널 발표 논문" />
      <EmptyState icon="📄" title="등록된 논문이 없습니다" sub="발표한 논문을 추가해주세요." ctaLabel="논문 추가" onAdd={add} />
    </div>
  )
  return (
    <div>
      <SectionHead title="논문" count={items.length} sub="국제 학회 / 저널 발표 논문" action={<AddBtn label="논문 추가" onClick={add} />} />
      <div style={ES.entryList}>
        {items.map((p, idx) => (
          <EntryCard key={p.id} idx={idx} summary={{ title: p.title || '(미입력)', sub: [p.venue, p.year].filter(Boolean).join(' · ') }} onDelete={() => remove(p.id)}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="제목" value={p.title} onChange={v => update(p.id, 'title', v)} required full />
              <Field label="발표 학회/저널" value={p.venue} onChange={v => update(p.id, 'venue', v)} required placeholder="USENIX Security" />
              <Field label="연도" value={p.year} onChange={v => update(p.id, 'year', v)} required mono placeholder="2024" />
              <Field label="저자" value={p.authors} onChange={v => update(p.id, 'authors', v)} full mono helper="본인 이름은 볼드 표시 권장" />
              <SegmentField label="기여도" value={p.role} onChange={v => update(p.id, 'role', v)} options={['1저자', '공동저자', '교신저자']} />
            </div>
          </EntryCard>
        ))}
      </div>
    </div>
  )
}

function EditPatent({ items, onChange }) {
  function update(id, key, val) { onChange(items.map(p => p.id === id ? { ...p, [key]: val } : p)) }
  function remove(id) { onChange(items.filter(p => p.id !== id)) }
  function add() { onChange([...items, { id: genId(), title: '', number: '', year: '', status: '등록', role: '발명자' }]) }

  if (!items.length) return (
    <div>
      <SectionHead title="특허" />
      <EmptyState icon="💡" title="등록된 특허가 없습니다" sub="보유한 특허를 추가해주세요." ctaLabel="특허 추가" onAdd={add} />
    </div>
  )
  return (
    <div>
      <SectionHead title="특허" count={items.length} action={<AddBtn label="특허 추가" onClick={add} />} />
      <div style={ES.entryList}>
        {items.map((p, idx) => (
          <EntryCard key={p.id} idx={idx} summary={{ title: p.title || '(미입력)', sub: [p.number, p.year].filter(Boolean).join(' · ') }} onDelete={() => remove(p.id)}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="특허명" value={p.title} onChange={v => update(p.id, 'title', v)} required full />
              <Field label="출원/등록번호" value={p.number} onChange={v => update(p.id, 'number', v)} required mono placeholder="KR 10-1234567" />
              <Field label="연도" value={p.year} onChange={v => update(p.id, 'year', v)} required mono />
              <SegmentField label="상태" value={p.status} onChange={v => update(p.id, 'status', v)} options={['출원', '등록']} />
              <SegmentField label="기여도" value={p.role} onChange={v => update(p.id, 'role', v)} options={['발명자', '공동발명자']} />
            </div>
          </EntryCard>
        ))}
      </div>
    </div>
  )
}

function EditLanguage({ items, onChange }) {
  function update(id, key, val) { onChange(items.map(l => l.id === id ? { ...l, [key]: val } : l)) }
  function remove(id) { onChange(items.filter(l => l.id !== id)) }
  function add() { onChange([...items, { id: genId(), language: '영어', test: '', score: '', year: '' }]) }

  if (!items.length) return (
    <div>
      <SectionHead title="어학" sub="공인 어학 시험 점수만 등록 가능합니다." />
      <EmptyState icon="🌐" title="등록된 어학 점수가 없습니다" sub="공인 어학 시험 점수를 추가해주세요." ctaLabel="어학 추가" onAdd={add} />
    </div>
  )
  return (
    <div>
      <SectionHead title="어학" count={items.length} sub="공인 어학 시험 점수만 등록 가능합니다." action={<AddBtn label="어학 추가" onClick={add} />} />
      <div style={ES.entryList}>
        {items.map((l, idx) => (
          <EntryCard key={l.id} idx={idx} summary={{ title: `${l.test || '(미입력)'} ${l.score || ''}`, sub: `${l.language} · ${l.year || ''}` }} onDelete={() => remove(l.id)}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <SegmentField label="언어" required value={l.language} onChange={v => update(l.id, 'language', v)} options={['영어', '일본어', '중국어', '기타']} />
              <Field label="시험명" value={l.test} onChange={v => update(l.id, 'test', v)} required placeholder="TOEIC / OPIc / JLPT" />
              <Field label="점수/등급" value={l.score} onChange={v => update(l.id, 'score', v)} required mono />
              <Field label="취득 연도" value={l.year} onChange={v => update(l.id, 'year', v)} required mono />
            </div>
          </EntryCard>
        ))}
      </div>
    </div>
  )
}

function EditCert({ items, onChange }) {
  function update(id, key, val) { onChange(items.map(c => c.id === id ? { ...c, [key]: val } : c)) }
  function remove(id) { onChange(items.filter(c => c.id !== id)) }
  function add() { onChange([...items, { id: genId(), name: '', issuer: '', year: '', expires: '' }]) }

  if (!items.length) return (
    <div>
      <SectionHead title="자격증" />
      <EmptyState icon="🏅" title="등록된 자격증이 없습니다" sub="보유한 자격증을 추가해주세요." ctaLabel="자격증 추가" onAdd={add} />
    </div>
  )
  return (
    <div>
      <SectionHead title="자격증" count={items.length} action={<AddBtn label="자격증 추가" onClick={add} />} />
      <div style={ES.entryList}>
        {items.map((c, idx) => (
          <EntryCard key={c.id} idx={idx} summary={{ title: c.name || '(미입력)', sub: `${c.issuer || ''} · ${c.year || ''}` }} onDelete={() => remove(c.id)}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="자격증명" value={c.name} onChange={v => update(c.id, 'name', v)} required />
              <Field label="발급 기관" value={c.issuer} onChange={v => update(c.id, 'issuer', v)} required />
              <Field label="취득 연도" value={c.year} onChange={v => update(c.id, 'year', v)} required mono />
              <Field label="만료일" value={c.expires || ''} onChange={v => update(c.id, 'expires', v)} placeholder="만료 없음" mono helper="만료가 없으면 비워두세요" />
            </div>
          </EntryCard>
        ))}
      </div>
    </div>
  )
}

function EditFiles({ form, token, onUploaded }) {
  const resumeRef = useRef()
  const portfolioRef = useRef()
  const [uploading, setUploading] = useState({ resume: false, portfolio: false })

  async function handleFile(fileType, file) {
    if (!file) return
    setUploading(u => ({ ...u, [fileType]: true }))
    try {
      const res = await uploadResumeFile(token, fileType, file)
      onUploaded(fileType, res.url.replace('/api/uploads/', ''))
    } finally {
      setUploading(u => ({ ...u, [fileType]: false }))
    }
  }

  const basename = path => path?.split('/').pop() || ''

  const DropZone = ({ type, fileType, filePath, accept, desc, required, inputRef }) => {
    const [hover, setHover] = useState(false)
    return (
      <div>
        <div style={{ marginBottom: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{type}{required && <span style={{ color: 'var(--urgent)', marginLeft: 4 }}>*</span>}</span>
          {desc && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{desc}</div>}
        </div>
        <div
          onDragOver={e => { e.preventDefault(); setHover(true) }}
          onDragLeave={() => setHover(false)}
          onDrop={e => { e.preventDefault(); setHover(false); handleFile(fileType, e.dataTransfer.files[0]) }}
          onClick={() => !filePath && inputRef.current?.click()}
          style={{ minHeight: 96, padding: 20, border: filePath ? '1.5px solid var(--border)' : `1.5px dashed ${hover ? 'var(--accent)' : 'var(--border-strong)'}`, borderRadius: 'var(--r-md)', background: hover ? 'var(--accent-soft)' : 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', cursor: filePath ? 'default' : 'pointer' }}
        >
          {filePath ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%' }}>
              <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon.File size={22} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{basename(filePath)}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-3)', marginTop: 3 }}>
                  <span style={{ color: 'var(--new)', fontWeight: 600 }}>✓ 업로드 완료</span>
                </div>
              </div>
              <button style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', background: 'var(--surface)', border: '1px solid var(--border-strong)', padding: '6px 12px', borderRadius: 6 }}
                onClick={e => { e.stopPropagation(); inputRef.current?.click() }}>교체</button>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--text-3)', marginBottom: 8 }}><Icon.Upload size={28} /></div>
              <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 4, fontWeight: 500 }}>
                여기에 파일을 드래그하거나 <span style={{ color: 'var(--accent)', textDecoration: 'underline' }}>파일 선택</span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'var(--font-en)' }}>{accept}</div>
            </div>
          )}
        </div>
        <input ref={inputRef} type="file" accept={accept} style={{ display: 'none' }}
          onChange={e => handleFile(fileType, e.target.files?.[0])} />
      </div>
    )
  }

  return (
    <div>
      <SectionHead title="첨부 파일" sub="채용 지원 시 함께 전송됩니다." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <DropZone type="이력서" fileType="resume" filePath={form.resumeFilePath} accept=".pdf, .docx" desc="채용 담당자가 가장 먼저 보는 파일입니다. PDF 형식을 권장합니다." required inputRef={resumeRef} />
        <DropZone type="포트폴리오" fileType="portfolio" filePath={form.portfolioFilePath} accept=".pdf" desc="프로젝트 결과물, 코드 샘플 등을 첨부하세요." inputRef={portfolioRef} />
      </div>
    </div>
  )
}

/* ── styles ──────────────────────────────────────────── */
const ES = {
  input: { width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: 13.5, background: 'var(--surface)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit' },
  textarea: { resize: 'vertical', lineHeight: 1.55, minHeight: 80 },
  inputPrefix: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', fontSize: 13, pointerEvents: 'none' },
  helperRow: { display: 'flex', justifyContent: 'space-between', marginTop: 4, minHeight: 14 },
  helper: { fontSize: 11, color: 'var(--text-3)' },
  charCount: { fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-en)' },
  segments: { display: 'inline-flex', padding: 3, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', gap: 1 },
  segment: { fontSize: 12.5, fontWeight: 500, color: 'var(--text-2)', padding: '5px 10px', borderRadius: 5 },
  segmentActive: { background: 'var(--surface)', color: 'var(--accent)', fontWeight: 600, boxShadow: 'var(--shadow-sm)' },
  chipsBox: { display: 'flex', flexWrap: 'wrap', gap: 6, padding: 8, border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', background: 'var(--surface)', minHeight: 38 },
  chip: { display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-en)', fontSize: 12, fontWeight: 500, color: 'var(--text-2)', background: 'var(--surface-2)', padding: '3px 4px 3px 9px', borderRadius: 4 },
  chipX: { width: 16, height: 16, borderRadius: 3, color: 'var(--text-3)', fontSize: 14, fontWeight: 500, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  chipsInput: { flex: 1, minWidth: 120, border: 'none', outline: 'none', padding: '4px 6px', fontSize: 13, background: 'transparent', color: 'var(--text)', fontFamily: 'var(--font-en)' },
  formCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden' },
  formCardSection: { padding: '20px 22px' },
  cardSectionLabel: { fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 },
  cardDivider: { height: 1, background: 'var(--border)' },
  entryList: { display: 'flex', flexDirection: 'column', gap: 10 },
  entryHeadRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' },
  entryBody: { padding: '20px 22px' },
  addBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-soft)', padding: '9px 14px', borderRadius: 'var(--r-md)' },
  headRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 22, paddingBottom: 14, borderBottom: '1px solid var(--border)' },
  h2: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', margin: '0 0 6px', display: 'flex', alignItems: 'baseline', gap: 10 },
  h2Sub: { fontSize: 13, color: 'var(--text-2)', margin: 0 },
}

/* ── main page ───────────────────────────────────────── */

export default function ResumeEditPage() {
  const { user, token, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dirty, setDirty] = useState(false)
  const [saveState, setSaveState] = useState('idle') // idle | saving | saved
  const [active, setActive] = useState(location.state?.section || 'basic')

  useEffect(() => {
    if (!authLoading && !user) navigate('/login', { replace: true })
  }, [authLoading, user, navigate])

  useEffect(() => {
    if (!token) return
    fetchResume(token)
      .then(raw => setForm(fromApi(raw, user?.email)))
      .catch(() => setForm(fromApi(null, user?.email)))
      .finally(() => setLoading(false))
  }, [token, user?.email])

  const handleSave = useCallback(async () => {
    if (!form || saveState === 'saving') return
    setSaveState('saving')
    try {
      await upsertResume(token, toApi(form))
      setDirty(false)
      setSaveState('saved')
      navigate('/resume', { state: { section: active } })
    } catch (e) {
      setSaveState('idle')
      alert('저장 실패: ' + e.message)
    }
  }, [form, saveState, token])

  useEffect(() => {
    const handler = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); handleSave() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSave])

  function setField(key, value) { setForm(f => ({ ...f, [key]: value })); setDirty(true) }
  function setSection(key, value) { setForm(f => ({ ...f, [key]: value })); setDirty(true) }

  if (authLoading || loading || !form) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-3)', fontSize: 14 }}>로딩 중...</div>
  }

  const { done, total } = calcProgress(form)
  const progressPct = Math.round(done / total * 100)

  const sections = [
    { id: 'basic', label: '기본 정보', required: true, filled: !!(form.name && form.phone) },
    { id: 'education', label: '학력', count: form.educations.length, filled: form.educations.length > 0 },
    { id: 'career', label: '직장 경력', count: form.careers.length, filled: form.careers.length > 0 },
    { id: 'project', label: '프로젝트', count: form.projects.length, filled: form.projects.length > 0 },
    { id: 'paper', label: '논문', count: form.papers.length, filled: form.papers.length > 0 },
    { id: 'patent', label: '특허', count: form.patents.length, filled: form.patents.length > 0 },
    { id: 'language', label: '어학', count: form.languages.length, filled: form.languages.length > 0 },
    { id: 'cert', label: '자격증', count: form.certs.length, filled: form.certs.length > 0 },
    { id: 'files', label: '첨부 파일', filled: !!(form.resumeFilePath) },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/resume', { state: { section: active } })} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-2)', fontWeight: 500, padding: '6px 10px', borderRadius: 'var(--r-sm)' }}>
            <Icon.Back /> 조회로 돌아가기
          </button>
          <span style={{ color: 'var(--text-3)' }}>/</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>이력서 수정</span>
          {saveState === 'saving' && <span style={{ fontSize: 11.5, color: 'var(--text-3)', marginLeft: 8, fontWeight: 500 }}>저장 중...</span>}
          {saveState === 'saved' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: 'var(--new)', marginLeft: 8, fontWeight: 600 }}><Icon.Check size={11} /> 저장됨</span>}
          {dirty && saveState === 'idle' && <span style={{ fontSize: 11.5, color: 'var(--urgent)', marginLeft: 8, fontWeight: 600 }}>● 저장하지 않은 변경사항</span>}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-3)', marginRight: 6 }}>
            <kbd style={{ fontFamily: 'var(--font-en)', fontSize: 10.5, fontWeight: 600, padding: '2px 5px', border: '1px solid var(--border)', borderBottom: '2px solid var(--border-strong)', borderRadius: 4, background: 'var(--surface-2)', color: 'var(--text-2)' }}>⌘</kbd>
            <kbd style={{ fontFamily: 'var(--font-en)', fontSize: 10.5, fontWeight: 600, padding: '2px 5px', border: '1px solid var(--border)', borderBottom: '2px solid var(--border-strong)', borderRadius: 4, background: 'var(--surface-2)', color: 'var(--text-2)' }}>S</kbd>
            저장
          </span>
          <button onClick={() => navigate('/resume', { state: { section: active } })} style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', background: 'var(--surface)', border: '1px solid var(--border)', padding: '9px 16px', borderRadius: 'var(--r-md)' }}>취소</button>
          <button onClick={handleSave} disabled={saveState === 'saving'}
            style={{ fontSize: 13, fontWeight: 600, color: '#FFF', background: 'var(--accent)', padding: '9px 18px', borderRadius: 'var(--r-md)', opacity: saveState === 'saving' ? 0.6 : 1 }}>
            {saveState === 'saving' ? '저장 중...' : '저장'}
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: 'calc(100vh - 57px)' }}>
        {/* Sidenav */}
        <aside style={{ padding: '20px 14px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--surface)' }}>
          <div style={{ padding: '14px 14px 12px', background: 'var(--accent-soft)', borderRadius: 'var(--r-md)', margin: '0 0 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <span style={{ fontSize: 11.5, color: 'var(--accent)', fontWeight: 600 }}>전체 진행률</span>
              <span style={{ fontFamily: 'var(--font-en)', fontSize: 18, fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.02em' }}>{progressPct}%</span>
            </div>
            <div style={{ height: 4, background: 'rgba(30, 58, 95, 0.15)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--accent)', borderRadius: 2, width: `${progressPct}%`, transition: 'width 0.3s ease' }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--accent)', opacity: 0.75, marginTop: 6, fontWeight: 500 }}>{done} / {total} 섹션 완료</div>
          </div>

          <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0 12px', marginBottom: 8 }}>섹션</div>
          {sections.map(s => (
            <button key={s.id} onClick={() => setActive(s.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 'var(--r-sm)', fontSize: 13.5, color: active === s.id ? 'var(--accent)' : 'var(--text-2)', fontWeight: active === s.id ? 600 : 500, width: '100%', background: active === s.id ? 'var(--accent-soft)' : 'transparent' }}>
              <span style={{ width: 14, display: 'inline-flex', justifyContent: 'center', flexShrink: 0 }}>
                {s.filled
                  ? <span style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--new)', color: '#FFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon.Check size={9} /></span>
                  : <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'transparent', border: '1.5px dashed var(--border-strong)' }} />
                }
              </span>
              <span style={{ flex: 1, textAlign: 'left' }}>
                {s.label}{s.required && <span style={{ color: 'var(--urgent)', fontWeight: 700, marginLeft: 4 }}>*</span>}
              </span>
              {s.count !== undefined && <span style={{ fontFamily: 'var(--font-en)', fontSize: 11.5, color: 'var(--text-3)', fontWeight: 500 }}>{s.count}</span>}
            </button>
          ))}

          <div style={{ marginTop: 'auto', padding: '20px 0 8px' }}>
            <div style={{ padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>💡 팁</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.5 }}>이력서 완성도가 높을수록<br />매칭 점수가 올라갑니다.</div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main style={{ padding: '32px 40px 100px' }}>
          {active === 'basic' && <EditBasic form={form} onFieldChange={setField} token={token} onPhotoUploaded={path => setField('photoPath', path)} />}
          {active === 'education' && <EditEducation items={form.educations} onChange={v => setSection('educations', v)} />}
          {active === 'career' && <EditCareer items={form.careers} onChange={v => setSection('careers', v)} />}
          {active === 'project' && <EditProject items={form.projects} onChange={v => setSection('projects', v)} />}
          {active === 'paper' && <EditPaper items={form.papers} onChange={v => setSection('papers', v)} />}
          {active === 'patent' && <EditPatent items={form.patents} onChange={v => setSection('patents', v)} />}
          {active === 'language' && <EditLanguage items={form.languages} onChange={v => setSection('languages', v)} />}
          {active === 'cert' && <EditCert items={form.certs} onChange={v => setSection('certs', v)} />}
          {active === 'files' && <EditFiles form={form} token={token} onUploaded={(fileType, path) => { if (fileType === 'resume') setField('resumeFilePath', path); else if (fileType === 'portfolio') setField('portfolioFilePath', path) }} />}
        </main>
      </div>
    </div>
  )
}
