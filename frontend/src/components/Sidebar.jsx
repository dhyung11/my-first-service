export default function Sidebar({ activeDomain, setActiveDomain, activeSource, setActiveSource, activeEnterprise, setActiveEnterprise, domainCounts, totalCount, bookmarkCount, enterpriseCount, lastCrawlAt }) {
  return (
    <aside style={{
      padding: '28px 24px',
      borderRight: '1px solid var(--border)',
      background: 'var(--surface)',
      overflowY: 'auto',
    }}>
      <SidebarContent
        activeDomain={activeDomain}
        setActiveDomain={setActiveDomain}
        activeSource={activeSource}
        setActiveSource={setActiveSource}
        activeEnterprise={activeEnterprise}
        setActiveEnterprise={setActiveEnterprise}
        domainCounts={domainCounts}
        totalCount={totalCount}
        bookmarkCount={bookmarkCount}
        enterpriseCount={enterpriseCount}
        lastCrawlAt={lastCrawlAt}
      />
    </aside>
  )
}

function formatCrawlAt(iso) {
  if (!iso) return null
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function SidebarContent({ activeDomain, setActiveDomain, activeSource, setActiveSource, activeEnterprise, setActiveEnterprise, domainCounts, totalCount, bookmarkCount, enterpriseCount, lastCrawlAt }) {
  const domains = ['정보보안', '보안 엔지니어링', 'SecOps', '클라우드 보안']

  return (
    <>
      <div style={sectionStyle}>
        <div style={labelStyle}>즐겨찾기</div>
        <SideItem active={activeSource === 'bookmarked'} onClick={() => setActiveSource(activeSource === 'bookmarked' ? 'all' : 'bookmarked')}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13 }}>★</span> 즐겨찾기
          </span>
          <span style={countStyle}>{bookmarkCount}</span>
        </SideItem>
      </div>

      <div style={dividerStyle} />

      <div style={sectionStyle}>
        <div style={labelStyle}>기업 규모</div>
        <SideItem active={activeEnterprise} onClick={() => setActiveEnterprise(!activeEnterprise)}>
          <span>대기업</span>
          <span style={countStyle}>{enterpriseCount}</span>
        </SideItem>
      </div>

      <div style={dividerStyle} />

      <div style={sectionStyle}>
        <div style={labelStyle}>도메인</div>
        <SideItem active={activeDomain === 'all'} onClick={() => setActiveDomain('all')}>
          <span>전체</span>
          <span style={countStyle}>{totalCount}</span>
        </SideItem>
        {domains.map(d => (
          <SideItem key={d} active={activeDomain === d} onClick={() => setActiveDomain(d)}>
            <span>{d}</span>
            <span style={countStyle}>{domainCounts[d] || 0}</span>
          </SideItem>
        ))}
      </div>


      <div style={dividerStyle} />

      <div style={sectionStyle}>
        <div style={labelStyle}>수집 현황</div>
        <div style={{ padding: '4px 10px' }}>
          {lastCrawlAt ? (
            <>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 3 }}>마지막 수집</div>
              <div style={{ fontFamily: 'var(--font-en)', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '-0.01em' }}>
                {formatCrawlAt(lastCrawlAt)}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>수집 기록 없음</div>
          )}
        </div>
      </div>
    </>
  )
}

function SideItem({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 10px', borderRadius: 'var(--r-sm)',
        fontSize: 13.5, fontWeight: active ? 600 : 500,
        color: active ? 'var(--accent)' : 'var(--text-2)',
        background: active ? 'var(--accent-soft)' : 'transparent',
        transition: 'all 0.12s',
        width: '100%', textAlign: 'left',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

const sectionStyle = { display: 'flex', flexDirection: 'column', gap: 4 }
const labelStyle = {
  fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
  textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8,
}
const dividerStyle = { height: 1, background: 'var(--border)', margin: '20px 0' }
const countStyle = { fontFamily: 'var(--font-en)', fontSize: 11.5, color: 'var(--text-3)', fontWeight: 500 }
