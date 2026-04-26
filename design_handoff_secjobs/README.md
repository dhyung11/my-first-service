# Handoff: SecJobs · 보안 채용 큐레이션 서비스

## Overview
보안 분야 채용 공고만 수집·큐레이션하여 시니어 보안 전문가에게 보여주는 웹 서비스입니다. 원티드/잡코리아/LinkedIn/사람인 등 다수 채널에서 자동 수집한 정보보안·SecOps·클라우드 보안 포지션을 컴팩트한 데이터 테이블 형태로 보여주고, 도메인별 사이드 필터, 키워드 검색, 정렬, 북마크, 모바일 반응형을 제공합니다.

## About the Design Files
이 번들에 포함된 파일들은 **HTML로 만든 디자인 레퍼런스(프로토타입)**입니다. 의도한 비주얼과 인터랙션을 보여주기 위한 것이며, 그대로 프로덕션 코드로 가져다 쓰기 위한 것이 아닙니다.

작업의 목표는 **이 HTML 디자인을 대상 코드베이스의 기존 환경(예: React/Next.js, Vue/Nuxt, SwiftUI 등)에 맞게 재구현**하는 것입니다. 환경이 아직 없다면 프로젝트 성격에 가장 적합한 프레임워크를 선택해 적용하세요. 인라인 스타일 객체(`appStyles`)는 데모용이며, 실제 코드베이스에서는 이미 사용 중인 스타일링 솔루션(Tailwind, CSS Modules, styled-components, Emotion 등)으로 옮기는 것을 권장합니다.

## Fidelity
**High-fidelity (hifi)** — 최종 색상, 타이포그래피, 간격, 인터랙션이 모두 확정된 픽셀-퍼펙트 목업입니다. 디자인 토큰(컬러/타입/스페이싱)과 컴포넌트 구조를 그대로 따라 구현해주세요.

---

## Screens / Views

### 1. 메인 리스트 화면 (데스크탑)
- **Purpose**: 사용자가 수집된 모든 보안 공고를 한눈에 스캔하고, 도메인/키워드/정렬로 필터링해 관심 공고를 빠르게 식별
- **Layout**:
  - 상단 sticky 헤더 (높이 ~60px, 좌측 브랜드 + 사이드바 토글, 우측 검색 + 알림)
  - 메인은 `grid-template-columns: 240px 1fr` (사이드바 펼침) 또는 `0px 1fr` (접힘) — `transition: grid-template-columns 0.25s ease`
  - 좌측 사이드바: 도메인 필터, 출처별 카운트, 수집 현황
  - 우측 메인: 페이지 헤더(타이틀 + 정렬 셀렉트) + 컬럼 헤더 + 행 리스트
- **컬럼 그리드**: `minmax(0, 1.7fr) 130px 80px 130px 130px 90px`, gap 16px
- **컬럼**: 회사/직무 · 도메인 · 경력 · 연봉 · 출처 · 마감
- **행 인터랙션**: hover 시 `background: var(--surface-2)`, 우측에 북마크 버튼 등장 (opacity 0→1)

### 2. 메인 리스트 화면 (모바일)
- **Breakpoint**: 디자인에서는 Tweaks의 device 토글로 시뮬레이션하지만, 실제 구현은 `max-width: 640px` 기준으로 분기
- **Layout 변화**:
  - 헤더의 사이드바 토글 → 햄버거 메뉴 버튼으로 교체 (드로어 오픈)
  - 검색바 → 헤더에서 사라지고 검색 아이콘 버튼으로 축소 (탭하면 검색 화면 또는 인라인 검색바 노출)
  - 행 → 카드 형태로 (`MobileJobCard` 참조)
  - 컬럼 헤더 숨김
- **카드 구조**: 회사 로고+이름+직무 / 도메인 핀 + 경력 + 지역 / 하단 출처+연봉 + D-day

### 3. 모바일 필터 드로어
- 좌측에서 슬라이드 인, 너비 280px, 어두운 오버레이(40% black) 백드롭
- 사이드바와 동일한 콘텐츠(`SidebarContent`) 재사용
- 도메인 선택 시 자동 닫힘

---

## Components

### Header
- 높이: 약 56-60px (데스크탑 14px padding-y, 모바일 12px)
- 배경: `var(--surface)` `#FFFFFF`, 하단 1px border `var(--border)` `#ECECEA`
- 좌측: 사이드바 토글 아이콘(데스크탑) / 햄버거(모바일) → 로고 SVG → 워드마크 "SecJobs" → "/" → 섹션명
- 우측: SearchBar (280px 데스크탑) → 알림 받기 버튼 (accent 배경, 흰 텍스트)

### Sidebar (240px width)
- 패딩: 28px 24px
- **도메인 섹션**: 라벨 "도메인" → "전체" + 4개 도메인 항목
  - 각 항목: `padding: 8px 10px`, `border-radius: 6px`, 좌측 도메인명 + 우측 카운트
  - 활성 상태: `background: var(--accent-soft) #EDF1F6`, `color: var(--accent) #1E3A5F`, `font-weight: 600`
- **수집 출처 섹션**: 출처명 + 카운트 (텍스트만)
- **수집 현황 섹션**: 초록 dot(`var(--new) #1B6B4F`, glow ring) + "실시간 수집 중", 마지막 동기화 시각

### Job Row (Desktop)
- 패딩: 16px, `border-bottom: 1px solid var(--border)`
- **회사/직무 셀**:
  - 회사 로고 (36px, 회사 컬러 배경, 이니셜, `border-radius: 28%`)
  - 회사명(작게, `var(--text-2)`) + NEW dot (5px, `var(--new)`)
  - 직무명 (14.5px, weight 600, `letter-spacing: -0.01em`, ellipsis)
  - 태그 3개(점 구분자) + 위치 핀 아이콘 + 지역명
- **도메인 셀**: 도메인 색상 핀 (`fontSize: 11.5`, `padding: 3px 8px`, `border-radius: 999`)
- **경력**: "5년+" 형식, Inter 폰트
- **연봉**: "8,000 - 1.2억" 또는 "협의", Inter 폰트
- **출처**: 모노스페이스(JetBrains Mono) 11px, `var(--surface-2)` 배경, `border-radius: 4px`
- **마감 셀**: 우측 정렬, D-day(15px weight 700, 색상은 `ddayColor`로 단계별) + 작은 마감일자 (월.일)

### Job Card (Mobile)
- 패딩: 14px, `border: 1px solid var(--border)`, `border-radius: 14px`
- 상단: 32px 로고 + 회사명/NEW + 직무명 + 북마크 버튼
- 중간: 도메인 핀 + 경력 + 지역
- 하단(상단과 1px 구분선): 출처 태그 + 연봉 / D-day + 마감일

### SearchBar
- 검색 아이콘 + input + 입력 시 "지우기" 버튼
- `padding: 9px 12px`, `border: 1px solid var(--border)`, `border-radius: 10px`
- placeholder: "회사·직무·기술 키워드 검색"

### SortSelect
- 네이티브 `<select>` 커스텀 스타일링
- 옵션: 최신순(latest) / 마감임박순(dday) / 연봉순(salary)

### Logo (placeholder)
- 회사 이니셜을 색상 배경 위에 흰색(또는 지정 컬러)으로 렌더
- `border-radius: 28%` (size에 비례)
- 실제 구현 시: 회사 로고 이미지가 있으면 이미지로, 없으면 이 placeholder fallback

---

## Interactions & Behavior

### 정렬
- 셀렉트 변경 시 즉시 리스트 재정렬
- `latest`: `posted` 날짜 내림차순
- `dday`: `dday` 오름차순 (마감 임박 먼저)
- `salary`: `salaryNum` 내림차순

### 검색
- 입력 시 즉시 필터 (debounce 권장: 150ms)
- 매칭: 회사명, 직무, 도메인, 태그 중 하나라도 포함하면 노출 (case-insensitive)

### 도메인 필터
- 사이드바 클릭 시 `activeDomain` state 변경, 리스트 즉시 필터
- "전체" 선택 시 모든 공고 노출

### 사이드바 토글
- 헤더의 토글 아이콘 클릭 → grid-template-columns 애니메이션 (250ms ease)
- 모바일에서는 햄버거 → 드로어 슬라이드 (overlay 클릭 시 닫힘)

### 북마크
- 행 호버 또는 모바일 카드의 아이콘 클릭 시 토글
- 북마크된 상태: `fill: var(--accent)`, 항상 visible
- 미북마크: 호버 시에만 visible (데스크탑), `var(--text-3)` 색상
- 실제 구현: 사용자 계정에 저장 (또는 비로그인 시 localStorage)

### D-day 색상 단계
- `dday <= 3`: `var(--urgent) #B83C2B` (임박)
- `dday <= 7`: `#C77A0E` (주의)
- 그 외: `var(--text-2) #52525B`

### NEW 뱃지 / dot
- 등록일이 최근 3일 이내인 공고에 표시
- 데스크탑 행: 5px 초록 dot (회사명 옆)
- 모바일 카드: "NEW" 텍스트 뱃지 (9px, weight 700, letter-spacing 0.04em)

### Sticky Header
- 데스크탑/모바일 모두 `position: sticky; top: 0; z-index: 20;`

---

## State Management

### 클라이언트 상태
- `query: string` — 검색어
- `sort: 'latest' | 'dday' | 'salary'` — 정렬 모드
- `activeDomain: 'all' | string` — 선택된 도메인
- `bookmarks: Record<jobId, boolean>` — 북마크 (서버 또는 localStorage 동기화)
- `mobileFiltersOpen: boolean` — 모바일 드로어 상태
- `sidebarCollapsed: boolean` — 데스크탑 사이드바 접힘 상태 (localStorage 권장)

### 서버 데이터
- `jobs: Job[]` — 수집된 공고 목록 (실시간 또는 주기적 fetch)
- 데이터 스키마는 `data.js` 참조 (Job 타입)

### 데이터 fetch
- 서버에서 정기 스크레이핑 → DB 저장 → API로 노출
- 클라이언트는 `/api/jobs?domain=&sort=&query=` 형태 권장
- 또는 전체 fetch 후 클라이언트에서 필터/정렬 (현재 디자인이 채택한 방식, 공고 100건 이하라면 충분)

---

## Design Tokens

### Colors
```css
/* Neutrals */
--bg: #FAFAF9;
--surface: #FFFFFF;
--surface-2: #F4F4F2;
--border: #ECECEA;
--border-strong: #D9D9D5;
--text: #18181B;
--text-2: #52525B;
--text-3: #A1A1AA;

/* Accent (slate-blue) */
--accent: #1E3A5F;
--accent-soft: #EDF1F6;

/* Semantic */
--urgent: #B83C2B;          /* D-day 임박 */
--urgent-soft: #FBEEEB;
--new: #1B6B4F;             /* 신규 */
--new-soft: #E8F2EE;

/* Domain hues (각각 soft 페어) */
--domain-cloud: #2C5F8D;    --domain-cloud-soft: #E9F0F7;
--domain-secops: #6B4A7A;   --domain-secops-soft: #F1ECF4;
--domain-grc: #5F4A2C;      --domain-grc-soft: #F4EFE8;
--domain-seceng: #2C5F4A;   --domain-seceng-soft: #E8F1ED;
```

### Typography
- **한글**: Pretendard (`@import 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css'`)
- **라틴/숫자**: Inter (Google Fonts, 400/500/600/700)
- **모노**: JetBrains Mono (Google Fonts, 400/500)
- font-feature-settings: `'tnum' 1, 'ss01' 1`

### Spacing / Radius
```css
--r-sm: 6px;
--r-md: 10px;
--r-lg: 14px;
```

### Shadows
```css
--shadow-sm: 0 1px 2px rgba(20, 20, 25, 0.04);
--shadow-md: 0 2px 8px rgba(20, 20, 25, 0.06);
```

---

## Data Schema

`data.js`의 Job 객체 형태입니다 (DB/API 응답 스키마 권장):

```ts
interface Job {
  id: number | string;
  company: string;            // "토스"
  companyShort: string;       // "T" — 로고 이니셜용
  logoColor: string;          // "#0064FF" — 로고 배경
  logoText?: string;          // 텍스트 색상 (밝은 배경 시)
  title: string;              // "Security Engineer (Application Security)"
  domain: string;             // "보안 엔지니어링" | "정보보안" | "SecOps" | "클라우드 보안"
  domainEn: string;           // "AppSec" | "GRC" | "SecOps" | "Cloud" | "DevSecOps" | "SecEng" | "Research"
  experience: string;         // "경력 5년 이상"
  expYears: number;           // 5
  location: string;           // "서울 강남구"
  remote: '하이브리드' | '출근' | '원격 가능';
  salary: string;             // "8,000 - 1.2억" | "협의"
  salaryNum: number;          // 정렬용 (만원 단위, 협의는 추정값)
  deadline: string;           // "2026-05-08" (ISO date)
  dday: number;               // 서버에서 계산해 내려주거나 클라이언트 계산
  source: string;             // "원티드" | "잡코리아" | "LinkedIn" | "사람인" | ...
  posted: string;             // "2026-04-22"
  isNew: boolean;             // 등록 3일 이내
  tags: string[];             // ["AppSec", "SDLC", "Threat Modeling"]
}
```

### 백엔드 측 권장 사항
- 채널별 스크레이퍼 모듈 분리 (원티드/잡코리아/LinkedIn/사람인/회사 채용 페이지)
- 도메인 분류는 키워드 매칭 + 직무명 패턴 (필요 시 LLM 분류기)
- 중복 제거: (company, title, deadline) 또는 원문 URL 해시
- 수집 주기: 1시간마다 cron 또는 워커
- 만료 처리: deadline 지난 공고는 별도 archive

---

## Assets

### 외부 의존성
- **Pretendard** — jsDelivr CDN
- **Inter, JetBrains Mono** — Google Fonts
- **로고 이미지**: 현재는 컬러 배경 + 이니셜 placeholder. 실제 구현에서는:
  - 회사별 로고 이미지를 자체 호스팅(Cloudinary, S3 등)
  - 없을 때 placeholder로 fallback
- **아이콘**: 인라인 SVG (Search, Pin, Briefcase, Clock, Won, ArrowDown, Arrow, Logo). Lucide/Heroicons 등으로 교체 가능

---

## Files in this handoff

- `SecJobs.html` — 엔트리 HTML
- `styles.css` — 디자인 토큰 + 베이스 스타일
- `app.jsx` — 메인 React 앱 (Header / Sidebar / Main / Row / Card / Tweaks)
- `shared.jsx` — 공통 헬퍼 (Logo, Icon, SearchBar, SortSelect, useFilteredJobs)
- `data.js` — 샘플 Job 데이터 (스키마 참고용)
- `tweaks-panel.jsx` — Tweaks UI (구현 시 제외)
- `design-canvas.jsx` — 디자인 캔버스 (구현 시 제외)

### Claude Code에 적용하는 단계 가이드
1. **이 zip을 다운받아 코드베이스 루트에 풀거나, 별도 `design/` 폴더에 저장**
2. **Claude Code에 다음과 같이 요청**:
   > "design_handoff_secjobs/README.md를 읽고, SecJobs 보안 채용 큐레이션 화면을 우리 [Next.js/React/...] 프로젝트에 구현해줘. 디자인 토큰은 우리 [Tailwind config / theme.ts]에 추가하고, 컴포넌트는 [src/components/...]에 만들어줘. 데이터는 우선 mock으로 시작하고, API 엔드포인트 형태도 같이 제안해줘."
3. **Claude Code가 단계별로**:
   - styles.css의 토큰을 코드베이스 컨벤션으로 이식
   - Header / Sidebar / JobTable / JobRow / JobCard 컴포넌트 생성
   - 상태 관리(useState 또는 store) 셋업
   - Job API 라우트 또는 데이터 페치 훅 작성
   - 모바일 반응형 미디어 쿼리 적용
4. **검수 포인트**:
   - 디자인 토큰 색상값이 정확히 옮겨졌는지
   - D-day 색상 단계 로직이 동작하는지
   - 사이드바 토글 애니메이션이 자연스러운지
   - 모바일 breakpoint에서 카드 레이아웃이 정상인지
