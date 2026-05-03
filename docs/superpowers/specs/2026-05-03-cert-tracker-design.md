# 자격증 트래커 설계

**날짜:** 2026-05-03
**대상:** 보안 업계 종사자 (로그인 사용자)
**라우트:** `/certs`

---

## 개요

보안 자격증의 취득 현황과 공부 진행도를 사용자별로 관리하는 탭.
사전 정의된 자격증 목록을 제공하되, 사용자가 직접 추가도 가능하다.

---

## 데이터 모델

### `certifications` — 사전 정의 목록 (시드 데이터)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | |
| name | TEXT NOT NULL | 자격증명 |
| category | TEXT NOT NULL | 국내자격증 / 해외자격증 / 침투테스트 / 클라우드보안 / 거버넌스 |
| issuer | TEXT | 발급기관 |

**시드 데이터:**
- 국내자격증: 정보보안기사, 정보보안산업기사, ISMS-P 심사원
- 해외자격증: CISSP, CISA, CISM, CEH, CompTIA Security+
- 침투테스트: OSCP, eJPT, PNPT
- 클라우드보안: AWS Security Specialty, CCSP
- 거버넌스: ISO 27001 Lead Auditor, ISO 27001 Lead Implementer

### `user_certifications` — 사용자별 트래킹

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | |
| user_id | FK → users | |
| cert_name | TEXT NOT NULL | 자격증명 (사전목록 복사 또는 직접입력) |
| category | TEXT NOT NULL | |
| issuer | TEXT | |
| status | VARCHAR(20) | not_started / studying / acquired |
| progress | INTEGER | 0–100 (%), default 0 |
| target_date | DATE | 목표 날짜 (nullable) |
| acquired_date | DATE | 취득일 (nullable) |
| notes | TEXT | 메모 (nullable) |
| links | JSONB | `[{"url": "...", "label": "..."}]` 형식, default [] |
| created_at | TIMESTAMP | server default NOW() |
| updated_at | TIMESTAMP | 변경 시 자동 갱신 (SQLAlchemy onupdate) |

사전 목록에 없는 자격증은 `cert_name`/`category`를 직접 입력하고 저장한다.

---

## API 엔드포인트

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/api/certifications` | 불필요 | 사전 정의 목록 반환 (카테고리별 그룹핑) |
| GET | `/api/user-certifications` | 필수 | 내 트래커 목록 |
| POST | `/api/user-certifications` | 필수 | 자격증 추가 |
| PUT | `/api/user-certifications/{id}` | 필수 | 상태·진행도·날짜·링크·메모 수정 |
| DELETE | `/api/user-certifications/{id}` | 필수 | 삭제 |

---

## UI / UX

### 레이아웃
기존 채용공고·뉴스 페이지와 동일한 사이드바 + 메인 구조.

**헤더:** 기존 탭에 "자격증" 추가 (`/certs`)

**사이드바 필터:**
- 상태: 전체 / 미시작 / 공부중 / 취득완료
- 카테고리: 국내자격증 / 해외자격증 / 침투테스트 / 클라우드보안 / 거버넌스

**메인 영역:** 자격증 카드 목록 + 우측 상단 "자격증 추가" 버튼

### 카드 구성
- 자격증명 + 카테고리 배지 + 발급기관
- 진행도 프로그레스 바 (0–100%)
- 상태 배지 (미시작 / 공부중 / 취득완료)
- 목표일 / 취득일
- 관련 링크·메모 (접힌 상태, 클릭 시 펼침)
- 수정 / 삭제 버튼

### 자격증 추가 / 수정 모달
추가와 수정 모두 동일한 모달을 사용한다. 수정 시 기존 값이 pre-fill된다.

**추가 플로우:**
1. 사전 목록 검색·선택 (카테고리별 그룹핑)
2. 목록에 없으면 "직접 입력" 선택 → 이름·카테고리 수동 입력
3. 초기값: status=not_started, progress=0

**수정 플로우:**
카드의 수정 버튼 클릭 → 동일 모달에 기존 값 pre-fill → 저장 시 PUT 호출

### 모바일
사이드바 → 기존 패턴(필터 드로어)으로 대체.

---

## 파일 구조 (신규/수정)

```
backend/
  models.py              # Certification, UserCertification 모델 추가
  schemas.py             # CertificationRead, UserCertRead/Write 스키마 추가
  routers/
    certifications.py    # 신규 라우터
  main.py                # router 등록

frontend/src/
  pages/
    CertsPage.jsx        # 신규 페이지
  components/
    Header.jsx           # "자격증" 탭 추가
  api.js                 # fetchCertifications, fetchUserCerts, addUserCert, updateUserCert, deleteUserCert 추가
```
