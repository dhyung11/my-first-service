// 공통 헬퍼 + 작은 컴포넌트들

const domainClass = (en) => {
  if (en === "Cloud") return "domain-cloud";
  if (en === "SecOps" || en === "DevSecOps") return "domain-secops";
  if (en === "GRC") return "domain-grc";
  return "domain-seceng";
};

const formatDday = (d) => {
  if (d <= 0) return "마감";
  return `D-${d}`;
};

const ddayColor = (d) => {
  if (d <= 3) return "var(--urgent)";
  if (d <= 7) return "#C77A0E";
  return "var(--text-2)";
};

// 회사 로고 (placeholder - 동그라미 + 이니셜)
const Logo = ({ company, color, text, size = 40 }) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: color,
        color: text || "#FFFFFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-en)",
        fontWeight: 700,
        fontSize: size * 0.42,
        flexShrink: 0,
        letterSpacing: "-0.02em",
      }}
    >
      {company}
    </div>
  );
};

// Source 출처 뱃지 (작은 모노스페이스 텍스트)
const SourceTag = ({ source }) => {
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        color: "var(--text-3)",
        letterSpacing: "-0.01em",
      }}
    >
      via {source}
    </span>
  );
};

// 작은 아이콘들 (라인 SVG)
const Icon = {
  Search: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Pin: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M7 13C7 13 11 8.5 11 5.5C11 3.29 9.21 1.5 7 1.5C4.79 1.5 3 3.29 3 5.5C3 8.5 7 13 7 13Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      <circle cx="7" cy="5.5" r="1.5" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  ),
  Briefcase: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <rect x="2" y="4" width="10" height="8" rx="1.2" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M5 4V3C5 2.45 5.45 2 6 2H8C8.55 2 9 2.45 9 3V4" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M2 7H12" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  ),
  Clock: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.3" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M7 4V7L9 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
  Won: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M2 3.5L4 10L6 4.5L7 8L8 4.5L10 10L12 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 6.5H12" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  ),
  ArrowDown: ({ size = 12 }) => (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Arrow: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M3 7H11M11 7L7.5 3.5M11 7L7.5 10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Logo: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L4 5V11C4 16 7.5 20 12 22C16.5 20 20 16 20 11V5L12 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M9 11.5L11 13.5L15 9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

// 정렬 셀렉트
const SortSelect = ({ value, onChange }) => {
  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          appearance: "none",
          fontFamily: "var(--font-kr)",
          fontSize: 13,
          fontWeight: 500,
          color: "var(--text)",
          background: "transparent",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-md)",
          padding: "8px 30px 8px 12px",
          cursor: "pointer",
        }}
      >
        <option value="latest">최신순</option>
        <option value="dday">마감임박순</option>
        <option value="salary">연봉순</option>
      </select>
      <div style={{ position: "absolute", right: 10, pointerEvents: "none", color: "var(--text-3)" }}>
        <Icon.ArrowDown />
      </div>
    </div>
  );
};

// 검색바
const SearchBar = ({ value, onChange, placeholder = "회사·직무·기술 키워드 검색", width = 360 }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        width,
        padding: "9px 12px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-md)",
      }}
    >
      <span style={{ color: "var(--text-3)" }}><Icon.Search /></span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          border: "none",
          outline: "none",
          background: "transparent",
          fontSize: 13.5,
          color: "var(--text)",
        }}
      />
      {value && (
        <button onClick={() => onChange("")} style={{ color: "var(--text-3)", fontSize: 11 }}>지우기</button>
      )}
    </div>
  );
};

// 필터링 + 정렬 훅
const useFilteredJobs = (jobs, query, sort) => {
  return React.useMemo(() => {
    let result = [...jobs];
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (j) =>
          j.company.toLowerCase().includes(q) ||
          j.title.toLowerCase().includes(q) ||
          j.domain.toLowerCase().includes(q) ||
          j.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (sort === "latest") {
      result.sort((a, b) => new Date(b.posted) - new Date(a.posted));
    } else if (sort === "dday") {
      result.sort((a, b) => a.dday - b.dday);
    } else if (sort === "salary") {
      result.sort((a, b) => b.salaryNum - a.salaryNum);
    }
    return result;
  }, [jobs, query, sort]);
};

Object.assign(window, {
  domainClass,
  formatDday,
  ddayColor,
  Logo,
  SourceTag,
  Icon,
  SortSelect,
  SearchBar,
  useFilteredJobs,
});
