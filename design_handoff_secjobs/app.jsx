// SecJobs - Compact Table + Sidebar (메인)
// - 데스크탑: 사이드바 + 테이블 행
// - 모바일: 사이드바 드로어, 행 → 카드
// - Tweaks: 사이드바 접기/펼치기, 디바이스 프리뷰

const { useState, useMemo, useEffect } = React;

const SecJobsApp = () => {
  const [tweaks, setTweak] = useTweaks(/*EDITMODE-BEGIN*/{
    "sidebarCollapsed": false,
    "device": "desktop"
  }/*EDITMODE-END*/);

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("dday");
  const [activeDomain, setActiveDomain] = useState("all");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState({});

  const isMobile = tweaks.device === "mobile";
  const sidebarCollapsed = tweaks.sidebarCollapsed && !isMobile;

  let pool = window.JOB_DATA;
  if (activeDomain !== "all") {
    pool = pool.filter((j) => j.domain === activeDomain);
  }
  const jobs = useFilteredJobs(pool, query, sort);

  const domainCounts = useMemo(() => {
    const counts = {};
    window.JOB_DATA.forEach((j) => { counts[j.domain] = (counts[j.domain] || 0) + 1; });
    return counts;
  }, []);

  const sourceCounts = useMemo(() => {
    const counts = {};
    window.JOB_DATA.forEach((j) => { counts[j.source] = (counts[j.source] || 0) + 1; });
    return counts;
  }, []);

  const toggleBookmark = (id) => {
    setBookmarks((b) => ({ ...b, [id]: !b[id] }));
  };

  return (
    <DeviceFrame device={tweaks.device}>
      <div style={appStyles.root}>
        <Header
          isMobile={isMobile}
          query={query}
          setQuery={setQuery}
          onMenuClick={() => setMobileFiltersOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setTweak("sidebarCollapsed", !tweaks.sidebarCollapsed)}
        />
        <div
          style={{
            ...appStyles.body,
            gridTemplateColumns: isMobile
              ? "1fr"
              : sidebarCollapsed
              ? "0px 1fr"
              : "240px 1fr",
          }}
        >
          {!isMobile && !sidebarCollapsed && (
            <Sidebar
              activeDomain={activeDomain}
              setActiveDomain={setActiveDomain}
              domainCounts={domainCounts}
              sourceCounts={sourceCounts}
            />
          )}
          {isMobile && mobileFiltersOpen && (
            <MobileFilterDrawer
              onClose={() => setMobileFiltersOpen(false)}
              activeDomain={activeDomain}
              setActiveDomain={(d) => { setActiveDomain(d); setMobileFiltersOpen(false); }}
              domainCounts={domainCounts}
              sourceCounts={sourceCounts}
            />
          )}
          <Main
            isMobile={isMobile}
            jobs={jobs}
            activeDomain={activeDomain}
            sort={sort}
            setSort={setSort}
            bookmarks={bookmarks}
            toggleBookmark={toggleBookmark}
          />
        </div>
      </div>
      <SecJobsTweaks tweaks={tweaks} setTweak={setTweak} />
    </DeviceFrame>
  );
};

// ============== Device Frame ==============
const DeviceFrame = ({ device, children }) => {
  if (device === "desktop") {
    return <div style={{ width: "100%", minHeight: "100vh" }}>{children}</div>;
  }
  // mobile frame - center and cap width
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--surface-2)",
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
      padding: "32px 16px",
    }}>
      <div style={{
        width: 390,
        minHeight: 800,
        background: "var(--bg)",
        borderRadius: 32,
        overflow: "hidden",
        border: "10px solid #18181B",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        position: "relative",
      }}>
        {/* Status bar */}
        <div style={{
          height: 36,
          background: "var(--surface)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          fontFamily: "var(--font-en)",
          fontSize: 13,
          fontWeight: 600,
        }}>
          <span>9:41</span>
          <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <span style={{ fontSize: 11 }}>●●●●●</span>
          </span>
        </div>
        {children}
      </div>
    </div>
  );
};

// ============== Header ==============
const Header = ({ isMobile, query, setQuery, onMenuClick, sidebarCollapsed, onToggleSidebar }) => {
  return (
    <header style={{
      ...appStyles.header,
      padding: isMobile ? "12px 16px" : "14px 28px",
    }}>
      <div style={appStyles.brandWrap}>
        {isMobile && (
          <button onClick={onMenuClick} style={appStyles.menuBtn} aria-label="필터 열기">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
        )}
        {!isMobile && (
          <button onClick={onToggleSidebar} style={appStyles.menuBtn} aria-label="사이드바 토글">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2.5" y="3" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M7 3v12" stroke="currentColor" strokeWidth="1.4"/>
              {!sidebarCollapsed && <rect x="2.5" y="3" width="4.5" height="12" fill="currentColor" opacity="0.15"/>}
            </svg>
          </button>
        )}
        <span style={{ color: "var(--accent)", display: "flex" }}><Icon.Logo size={20} /></span>
        <span style={appStyles.brandText}>SecJobs</span>
        {!isMobile && (
          <>
            <span style={appStyles.brandSlash}>/</span>
            <span style={appStyles.brandSection}>전체 공고</span>
          </>
        )}
      </div>
      <div style={appStyles.headerRight}>
        {!isMobile && <SearchBar value={query} onChange={setQuery} width={280} />}
        {!isMobile && <button style={appStyles.primaryBtn}>알림 받기</button>}
        {isMobile && (
          <button style={appStyles.iconBtn} aria-label="검색">
            <Icon.Search size={18} />
          </button>
        )}
      </div>
    </header>
  );
};

// ============== Sidebar ==============
const Sidebar = ({ activeDomain, setActiveDomain, domainCounts, sourceCounts }) => {
  return (
    <aside style={appStyles.sidebar}>
      <SidebarContent
        activeDomain={activeDomain}
        setActiveDomain={setActiveDomain}
        domainCounts={domainCounts}
        sourceCounts={sourceCounts}
      />
    </aside>
  );
};

const SidebarContent = ({ activeDomain, setActiveDomain, domainCounts, sourceCounts }) => (
  <>
    <div style={appStyles.sideSection}>
      <div style={appStyles.sideLabel}>도메인</div>
      <button
        onClick={() => setActiveDomain("all")}
        style={{ ...appStyles.sideItem, ...(activeDomain === "all" ? appStyles.sideItemActive : {}) }}
      >
        <span>전체</span>
        <span style={appStyles.sideCount}>{window.JOB_DATA.length}</span>
      </button>
      {["정보보안", "보안 엔지니어링", "SecOps", "클라우드 보안"].map((d) => (
        <button
          key={d}
          onClick={() => setActiveDomain(d)}
          style={{ ...appStyles.sideItem, ...(activeDomain === d ? appStyles.sideItemActive : {}) }}
        >
          <span>{d}</span>
          <span style={appStyles.sideCount}>{domainCounts[d] || 0}</span>
        </button>
      ))}
    </div>
    <div style={appStyles.sideDivider} />
    <div style={appStyles.sideSection}>
      <div style={appStyles.sideLabel}>수집 출처</div>
      {Object.entries(sourceCounts).map(([src, cnt]) => (
        <div key={src} style={appStyles.sourceRow}>
          <span style={{ color: "var(--text-2)" }}>{src}</span>
          <span style={appStyles.sourceCount}>{cnt}</span>
        </div>
      ))}
    </div>
    <div style={appStyles.sideDivider} />
    <div style={appStyles.sideSection}>
      <div style={appStyles.sideLabel}>수집 현황</div>
      <div style={appStyles.statusRow}>
        <span style={appStyles.statusDot} />
        <span style={{ fontSize: 12.5, color: "var(--text-2)" }}>실시간 수집 중</span>
      </div>
      <div style={appStyles.statusMeta}>마지막 동기화 · 09:14 KST</div>
      <div style={appStyles.statusMeta}>오늘 신규 4건 추가됨</div>
    </div>
  </>
);

// ============== Mobile Filter Drawer ==============
const MobileFilterDrawer = ({ onClose, activeDomain, setActiveDomain, domainCounts, sourceCounts }) => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        zIndex: 50,
        display: "flex",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 280,
          background: "var(--surface)",
          padding: "20px",
          height: "100%",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>필터</span>
          <button onClick={onClose} style={{ color: "var(--text-2)", fontSize: 14 }}>닫기</button>
        </div>
        <SidebarContent
          activeDomain={activeDomain}
          setActiveDomain={setActiveDomain}
          domainCounts={domainCounts}
          sourceCounts={sourceCounts}
        />
      </div>
    </div>
  );
};

// ============== Main ==============
const Main = ({ isMobile, jobs, activeDomain, sort, setSort, bookmarks, toggleBookmark }) => {
  return (
    <main style={{
      ...appStyles.main,
      padding: isMobile ? "16px 16px 60px" : "28px 36px 60px",
    }}>
      <div style={appStyles.mainHead}>
        <div>
          <h2 style={{ ...appStyles.h2, fontSize: isMobile ? 19 : 24 }}>
            {activeDomain === "all" ? "전체 보안 공고" : activeDomain}
            <span style={appStyles.h2Count}>{jobs.length}</span>
          </h2>
          {!isMobile && (
            <p style={appStyles.h2Sub}>시니어 5년차 이상 보안 포지션을 자동 큐레이션합니다.</p>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {!isMobile && <span style={appStyles.toolMeta}>정렬</span>}
          <SortSelect value={sort} onChange={setSort} />
        </div>
      </div>

      {isMobile ? (
        <ul style={appStyles.cardList}>
          {jobs.map((job) => (
            <MobileJobCard
              key={job.id}
              job={job}
              bookmarked={bookmarks[job.id]}
              onBookmark={() => toggleBookmark(job.id)}
            />
          ))}
        </ul>
      ) : (
        <>
          <div style={appStyles.thead}>
            <div>회사 / 직무</div>
            <div>도메인</div>
            <div>경력</div>
            <div>연봉</div>
            <div>출처</div>
            <div style={{ textAlign: "right" }}>마감</div>
          </div>
          <ul style={appStyles.rows}>
            {jobs.map((job) => (
              <DesktopJobRow
                key={job.id}
                job={job}
                bookmarked={bookmarks[job.id]}
                onBookmark={() => toggleBookmark(job.id)}
              />
            ))}
          </ul>
        </>
      )}
    </main>
  );
};

// ============== Desktop Row ==============
const DesktopJobRow = ({ job, bookmarked, onBookmark }) => {
  const [hover, setHover] = useState(false);
  return (
    <li
      style={{ ...appStyles.row, background: hover ? "var(--surface-2)" : "transparent" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={appStyles.cellCompany}>
        <Logo company={job.companyShort} color={job.logoColor} text={job.logoText} size={36} />
        <div style={{ minWidth: 0 }}>
          <div style={appStyles.cellCompanyTop}>
            <span style={appStyles.cellCompanyName}>{job.company}</span>
            {job.isNew && <span style={appStyles.newDot} title="신규 공고" />}
          </div>
          <div style={appStyles.cellTitle}>{job.title}</div>
          <div style={appStyles.cellTags}>
            {job.tags.slice(0, 3).map((t, i) => (
              <span key={t} style={appStyles.cellTag}>
                {t}{i < Math.min(job.tags.length, 3) - 1 && <span style={appStyles.cellTagSep}>·</span>}
              </span>
            ))}
            <span style={appStyles.cellPin}>
              <Icon.Pin size={11} /> {job.location}
            </span>
          </div>
        </div>
      </div>
      <div>
        <span className={domainClass(job.domainEn)} style={appStyles.domainPill}>{job.domain}</span>
      </div>
      <div style={appStyles.cellExp}>{job.expYears}년+</div>
      <div style={appStyles.cellSalary}>{job.salary}</div>
      <div>
        <span style={appStyles.sourceTag}>{job.source}</span>
      </div>
      <div style={appStyles.cellDday}>
        <button
          onClick={(e) => { e.stopPropagation(); onBookmark(); }}
          style={{ ...appStyles.bookmarkBtn, opacity: hover || bookmarked ? 1 : 0, color: bookmarked ? "var(--accent)" : "var(--text-3)" }}
          aria-label="북마크"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill={bookmarked ? "currentColor" : "none"}>
            <path d="M4 2H12V14L8 11L4 14V2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <span style={{ ...appStyles.dday, color: ddayColor(job.dday) }}>
            {formatDday(job.dday)}
          </span>
          <span style={appStyles.deadline}>{job.deadline.slice(5).replace("-", ".")}</span>
        </div>
      </div>
    </li>
  );
};

// ============== Mobile Card ==============
const MobileJobCard = ({ job, bookmarked, onBookmark }) => {
  return (
    <li style={appStyles.mCard}>
      <div style={appStyles.mCardHead}>
        <Logo company={job.companyShort} color={job.logoColor} text={job.logoText} size={32} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 1 }}>
            <span style={{ fontSize: 11.5, color: "var(--text-2)", fontWeight: 500 }}>{job.company}</span>
            {job.isNew && <span style={appStyles.newBadgeMini}>NEW</span>}
          </div>
          <div style={appStyles.mTitle}>{job.title}</div>
        </div>
        <button
          onClick={onBookmark}
          style={{ color: bookmarked ? "var(--accent)" : "var(--text-3)", padding: 4 }}
          aria-label="북마크"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill={bookmarked ? "currentColor" : "none"}>
            <path d="M4 2H12V14L8 11L4 14V2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div style={appStyles.mPills}>
        <span className={domainClass(job.domainEn)} style={appStyles.domainPill}>{job.domain}</span>
        <span style={appStyles.mMeta}>{job.expYears}년+</span>
        <span style={appStyles.mDot}>·</span>
        <span style={appStyles.mMeta}>{job.location}</span>
      </div>

      <div style={appStyles.mBottom}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={appStyles.sourceTag}>{job.source}</span>
          <span style={{ fontFamily: "var(--font-en)", fontSize: 12, color: "var(--text-2)" }}>{job.salary}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <span style={{ ...appStyles.ddaySm, color: ddayColor(job.dday) }}>{formatDday(job.dday)}</span>
          <span style={appStyles.deadlineSm}>{job.deadline.slice(5).replace("-", ".")}</span>
        </div>
      </div>
    </li>
  );
};

// ============== Tweaks ==============
const SecJobsTweaks = ({ tweaks, setTweak }) => {
  return (
    <TweaksPanel>
      <TweakSection label="레이아웃" />
      <TweakToggle
        label="사이드바 펼침"
        value={!tweaks.sidebarCollapsed}
        onChange={(v) => setTweak("sidebarCollapsed", !v)}
      />
      <TweakSection label="디바이스 프리뷰" />
      <TweakRadio
        label="디바이스"
        value={tweaks.device}
        options={["desktop", "mobile"]}
        onChange={(v) => setTweak("device", v)}
      />
    </TweaksPanel>
  );
};

// ============== Styles ==============
const appStyles = {
  root: {
    background: "var(--bg)",
    color: "var(--text)",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid var(--border)",
    background: "var(--surface)",
    position: "sticky",
    top: 0,
    zIndex: 20,
  },
  brandWrap: { display: "flex", alignItems: "center", gap: 10 },
  brandText: {
    fontFamily: "var(--font-en)",
    fontSize: 17,
    fontWeight: 700,
    letterSpacing: "-0.02em",
  },
  brandSlash: { color: "var(--text-3)", fontSize: 16 },
  brandSection: { fontSize: 14, color: "var(--text-2)", fontWeight: 500 },
  menuBtn: {
    width: 32,
    height: 32,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "var(--r-sm)",
    color: "var(--text-2)",
    transition: "background 0.12s",
  },
  iconBtn: {
    width: 36,
    height: 36,
    border: "1px solid var(--border)",
    borderRadius: "var(--r-md)",
    color: "var(--text-2)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--surface)",
  },
  headerRight: { display: "flex", alignItems: "center", gap: 10 },
  primaryBtn: {
    fontSize: 13,
    fontWeight: 500,
    color: "#FFFFFF",
    background: "var(--accent)",
    padding: "10px 16px",
    borderRadius: "var(--r-md)",
  },
  body: {
    display: "grid",
    flex: 1,
    minHeight: 0,
    transition: "grid-template-columns 0.25s ease",
  },
  sidebar: {
    padding: "28px 24px",
    borderRight: "1px solid var(--border)",
    background: "var(--surface)",
    overflow: "hidden",
  },
  sideSection: { display: "flex", flexDirection: "column", gap: 4 },
  sideLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--text-3)",
    marginBottom: 8,
  },
  sideItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 10px",
    borderRadius: "var(--r-sm)",
    fontSize: 13.5,
    color: "var(--text-2)",
    fontWeight: 500,
    transition: "all 0.12s",
    width: "100%",
    textAlign: "left",
  },
  sideItemActive: {
    background: "var(--accent-soft)",
    color: "var(--accent)",
    fontWeight: 600,
  },
  sideCount: {
    fontFamily: "var(--font-en)",
    fontSize: 11.5,
    color: "var(--text-3)",
    fontWeight: 500,
  },
  sideDivider: { height: 1, background: "var(--border)", margin: "20px 0" },
  sourceRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "5px 10px",
    fontSize: 12.5,
  },
  sourceCount: {
    fontFamily: "var(--font-en)",
    fontSize: 11.5,
    color: "var(--text-3)",
  },
  statusRow: { display: "flex", alignItems: "center", gap: 8, padding: "4px 10px" },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "var(--new)",
    boxShadow: "0 0 0 3px var(--new-soft)",
  },
  statusMeta: {
    fontSize: 11.5,
    color: "var(--text-3)",
    padding: "2px 10px",
    fontFamily: "var(--font-en)",
  },
  main: { minWidth: 0 },
  mainHead: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 18,
    gap: 12,
  },
  h2: {
    fontWeight: 700,
    letterSpacing: "-0.025em",
    margin: 0,
    display: "flex",
    alignItems: "baseline",
    gap: 10,
  },
  h2Count: {
    fontFamily: "var(--font-en)",
    fontSize: 14,
    color: "var(--text-3)",
    fontWeight: 500,
  },
  h2Sub: {
    fontSize: 13,
    color: "var(--text-2)",
    margin: "6px 0 0",
  },
  toolMeta: { fontSize: 12.5, color: "var(--text-3)" },
  thead: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.7fr) 130px 80px 130px 130px 90px",
    gap: 16,
    alignItems: "center",
    padding: "10px 16px",
    borderBottom: "1px solid var(--border)",
    fontSize: 11,
    fontWeight: 600,
    color: "var(--text-3)",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  rows: { listStyle: "none", margin: 0, padding: 0 },
  row: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.7fr) 130px 80px 130px 130px 90px",
    gap: 16,
    alignItems: "center",
    padding: "16px",
    borderBottom: "1px solid var(--border)",
    transition: "background 0.12s",
    cursor: "pointer",
    position: "relative",
  },
  cellCompany: { display: "flex", gap: 14, alignItems: "center", minWidth: 0 },
  cellCompanyTop: { display: "flex", alignItems: "center", gap: 6, marginBottom: 2 },
  cellCompanyName: { fontSize: 12.5, color: "var(--text-2)", fontWeight: 500 },
  newDot: { width: 5, height: 5, borderRadius: "50%", background: "var(--new)" },
  cellTitle: {
    fontSize: 14.5,
    fontWeight: 600,
    color: "var(--text)",
    letterSpacing: "-0.01em",
    marginBottom: 4,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  cellTags: { display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" },
  cellTag: {
    fontFamily: "var(--font-en)",
    fontSize: 11.5,
    color: "var(--text-3)",
    fontWeight: 500,
  },
  cellTagSep: { marginLeft: 6, color: "var(--border-strong)" },
  cellPin: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 11.5,
    color: "var(--text-3)",
    marginLeft: 4,
  },
  domainPill: {
    fontSize: 11.5,
    fontWeight: 500,
    padding: "3px 8px",
    borderRadius: 999,
    display: "inline-block",
  },
  cellExp: {
    fontFamily: "var(--font-en)",
    fontSize: 13,
    color: "var(--text-2)",
    fontWeight: 500,
  },
  cellSalary: {
    fontFamily: "var(--font-en)",
    fontSize: 13,
    color: "var(--text)",
    fontWeight: 500,
  },
  sourceTag: {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    color: "var(--text-2)",
    background: "var(--surface-2)",
    padding: "3px 8px",
    borderRadius: 4,
  },
  cellDday: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  bookmarkBtn: {
    transition: "opacity 0.12s",
    padding: 4,
    display: "inline-flex",
  },
  dday: {
    fontFamily: "var(--font-en)",
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: "-0.02em",
  },
  deadline: {
    fontFamily: "var(--font-en)",
    fontSize: 11,
    color: "var(--text-3)",
    marginTop: 2,
  },

  // mobile
  cardList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  mCard: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--r-lg)",
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  mCardHead: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
  },
  mTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "var(--text)",
    letterSpacing: "-0.01em",
    lineHeight: 1.35,
    textWrap: "pretty",
  },
  newBadgeMini: {
    fontFamily: "var(--font-en)",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.04em",
    color: "var(--new)",
    background: "var(--new-soft)",
    padding: "1px 4px",
    borderRadius: 3,
  },
  mPills: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" },
  mMeta: { fontSize: 11.5, color: "var(--text-3)", fontFamily: "var(--font-en)" },
  mDot: { color: "var(--border-strong)", fontSize: 11 },
  mBottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: 8,
    borderTop: "1px solid var(--border)",
  },
  ddaySm: {
    fontFamily: "var(--font-en)",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "-0.02em",
  },
  deadlineSm: {
    fontFamily: "var(--font-en)",
    fontSize: 10.5,
    color: "var(--text-3)",
  },
};

window.SecJobsApp = SecJobsApp;
