export const Icon = {
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
  ArrowDown: ({ size = 12 }) => (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Logo: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L4 5V11C4 16 7.5 20 12 22C16.5 20 20 16 20 11V5L12 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M9 11.5L11 13.5L15 9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Bookmark: ({ size = 16, filled = false }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={filled ? 'currentColor' : 'none'}>
      <path d="M4 2H12V14L8 11L4 14V2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  ),
  Refresh: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5a5.5 5.5 0 0 1 3.889 1.611" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M12 2v3h-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

export const CompanyLogo = ({ company, color, size = 36 }) => (
  <div style={{
    width: size, height: size,
    borderRadius: size * 0.28,
    background: color,
    color: '#FFFFFF',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-en)',
    fontWeight: 700,
    fontSize: size * 0.42,
    flexShrink: 0,
    letterSpacing: '-0.02em',
  }}>
    {company}
  </div>
);
