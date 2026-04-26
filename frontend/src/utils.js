const SOURCE_MAP = { saramin: '사람인', jobkorea: '잡코리아', wanted: '원티드' };

export function domainClass(en) {
  if (en === 'Cloud') return 'domain-cloud';
  if (en === 'SecOps' || en === 'DevSecOps') return 'domain-secops';
  if (en === 'GRC') return 'domain-grc';
  return 'domain-seceng';
}

export function formatDday(d) {
  if (d <= 0) return '마감';
  return `D-${d}`;
}

export function ddayColor(d) {
  if (d <= 3) return 'var(--urgent)';
  if (d <= 7) return '#C77A0E';
  return 'var(--text-2)';
}

function classifyDomain(title, desc) {
  const text = `${title} ${desc || ''}`.toLowerCase();
  if (/클라우드|cloud|aws|azure|gcp/.test(text)) return { domain: '클라우드 보안', domainEn: 'Cloud' };
  if (/devsecops|secops|siem|관제|soc/.test(text)) return { domain: 'SecOps', domainEn: 'SecOps' };
  if (/취약점|pentest|침투|버그바운티|리버싱|악성코드|포렌식|appsec/.test(text)) return { domain: '보안 엔지니어링', domainEn: 'SecEng' };
  return { domain: '정보보안', domainEn: 'GRC' };
}

function getCompanyShort(company) {
  return company.replace(/\s*(주식회사|㈜|\(주\)|\(유\)|co\.,?\s*ltd\.?)/gi, '').trim().slice(0, 2);
}

const LOGO_COLORS = [
  '#0F4C81', '#1B5E20', '#4A148C', '#B71C1C',
  '#E65100', '#006064', '#1A237E', '#880E4F',
  '#33691E', '#1565C0',
];

function getLogoColor(company) {
  let h = 0;
  for (const c of company) h = (h * 31 + c.charCodeAt(0)) & 0xFFFF;
  return LOGO_COLORS[h % LOGO_COLORS.length];
}

function calcDday(deadline) {
  if (!deadline) return 30;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(deadline) - today) / 86400000);
}

function isNewJob(createdAt) {
  return (Date.now() - new Date(createdAt)) / 86400000 <= 3;
}

function extractTags(title) {
  const rules = [
    ['SIEM', /siem/i], ['EDR', /edr/i], ['WAF', /waf/i],
    ['DevSecOps', /devsecops/i], ['AppSec', /appsec/i],
    ['침해대응', /침해대응/], ['취약점분석', /취약점/],
    ['보안관제', /관제/], ['ISMS', /isms/i],
    ['클라우드', /클라우드/], ['AI보안', /ai.{0,2}보안|보안.{0,2}ai/i],
  ];
  return rules.filter(([, re]) => re.test(title)).map(([tag]) => tag).slice(0, 3);
}

export function adaptJob(job) {
  const { domain, domainEn } = classifyDomain(job.title, job.description);
  const dday = calcDday(job.deadline);
  return {
    ...job,
    companyShort: getCompanyShort(job.company),
    logoColor: getLogoColor(job.company),
    domain,
    domainEn,
    expYears: 0,
    salary: '협의',
    salaryNum: 0,
    dday,
    source: SOURCE_MAP[job.source] || job.source,
    posted: job.created_at,
    isNew: isNewJob(job.created_at),
    tags: extractTags(job.title),
    remote: '출근',
  };
}
