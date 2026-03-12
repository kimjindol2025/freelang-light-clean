# FreeLang Hybrid: 풀스택 통합 아키텍처

**상태**: ✅ **Phase 3 - 완전한 FreeLang 기반 설계**

---

## 📐 시스템 구성

```
┌──────────────────────────────────────────────────────────┐
│                 React UI (렌더링만)                      │
│          - JSX Components                                │
│          - useState for UI state                         │
│          - Event Handlers                                │
└──────────────────┬───────────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────────┐
│        FreeLang Bridge (TypeScript/JavaScript)           │
│  - React Hook 바인딩 (useFreeLang, useAction)           │
│  - 상태 동기화                                           │
│  - Context API 통합                                      │
└──────────────────┬───────────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────────┐
│   FreeLang Core Logic (freelang/frontend/state.free)     │
│  - 전역 상태 (AppState)                                  │
│  - 액션 함수들                                           │
│  - 시간 여행 디버깅                                      │
│  - 비즈니스 로직                                         │
│  - 벨리데이션                                           │
└──────────────────┬───────────────────────────────────────┘
                   │
            REST API 호출
                   │
┌──────────────────▼───────────────────────────────────────┐
│   FreeLang Core Logic (freelang/backend/api.free)       │
│  - 백엔드 상태 (BackendState)                            │
│  - API 라우팅                                            │
│  - 데이터 검증                                           │
│  - HTTP 응답 생성                                        │
└──────────────────┬───────────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────────┐
│      HTTP Server (backend/api.js - JavaScript)          │
│  - Node.js http 모듈                                     │
│  - 라우팅 및 미들웨어                                    │
│  - 요청/응답 처리                                        │
└──────────────────┬───────────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────────┐
│            Database (backend/db.js)                      │
│  - JSON 파일 기반                                        │
│  - 자동 저장                                             │
│  - 트랜잭션 지원                                         │
└──────────────────────────────────────────────────────────┘
```

---

## 🎯 각 계층의 역할

### 1️⃣ React UI 계층
- **책임**: 렌더링만
- **사용 기술**: React Components, JSX
- **특징**:
  - 상태 관리 로직 없음
  - 이벤트 핸들러는 FreeLang 함수 호출만 수행
  - props: `state`, `actions`만 받음

### 2️⃣ FreeLang Bridge 계층
- **책임**: React ↔ FreeLang 연결
- **구현**: TypeScript/JavaScript
- **역할**:
  - React Hooks 제공 (`useFreeLang`, `useAction`, `useAsyncAction`)
  - FreeLang 상태 → React state로 변환
  - React 이벤트 → FreeLang 함수 호출

**예시**:
```typescript
const { count, increment } = useFreeLang('counter');
// 내부적으로:
// 1. FreeLang의 AppState.counter 읽음
// 2. React state로 변환
// 3. increment 함수 바인딩
```

### 3️⃣ FreeLang 로직 계층
- **책임**: 모든 비즈니스 로직
- **구현**: FreeLang (.free 파일)
- **특징**:
  - 타입 안전 (record, interface)
  - 상태 불변성 자동 보장
  - 함수형 프로그래밍

**프론트엔드** (`freelang/frontend/state.free`):
```freelang
func incrementCounter(amount: number = 1) -> Counter {
  AppState.counter.count += amount
  AppState.counter.updatedAt = now()
  recordAction({...})
  return AppState.counter
}
```

**백엔드** (`freelang/backend/api.free`):
```freelang
func incrementCounter(amount: number = 1) -> ApiResponse<record> {
  BackendState.counter.count += amount
  BackendState.counter.updatedAt = now()
  return {
    status: "success",
    statusCode: 200,
    data: { counter: BackendState.counter },
    message: null
  }
}
```

### 4️⃣ HTTP 서버 계층
- **책임**: 요청/응답 처리
- **구현**: JavaScript (Node.js http)
- **특징**:
  - 라우팅
  - CORS
  - 에러 핸들링
  - 요청 로깅

### 5️⃣ 데이터베이스 계층
- **책임**: 영속성
- **구현**: JSON 파일 + Node.js
- **특징**:
  - 자동 저장 (1초마다)
  - 쿼리 필터링
  - 트랜잭션

---

## 🔄 데이터 흐름

### 프론트엔드 액션 흐름

```
1. 사용자 클릭
   ↓
2. React onClick handler 호출
   ↓
3. useAction 통해 FreeLang 함수 호출 (increment)
   ↓
4. AppState.counter.count += 1
   ↓
5. recordAction() 으로 히스토리 저장
   ↓
6. FreeLang이 상태 변경 반환
   ↓
7. React Hook이 상태 감지
   ↓
8. React 자동 리렌더링 ✨
```

### 백엔드 API 흐름

```
1. 프론트에서 POST /api/counter/increment 호출
   ↓
2. HTTP 서버가 요청 수신
   ↓
3. 라우팅: routeRequest("POST", "/api/counter/increment", body)
   ↓
4. FreeLang 함수 호출: incrementCounter(body.amount)
   ↓
5. BackendState.counter.count += amount
   ↓
6. ApiResponse<record> 반환
   ↓
7. HTTP 서버가 JSON으로 변환
   ↓
8. 응답 전송: { status, statusCode, data }
   ↓
9. 프론트 useAsyncAction이 데이터 수신
   ↓
10. AppState 동기화 (선택사항)
```

---

## 📦 파일 구조

```
freelang-hybrid/
├── freelang/                          # FreeLang 소스코드
│   ├── shared/
│   │   └── types.free                # 공유 타입 정의 (200줄)
│   │       - Todo, Counter, ApiResponse
│   │       - AsyncState, ValidationRule
│   │       - SystemHealth, PaginationResult
│   │
│   ├── frontend/
│   │   └── state.free                # 프론트엔드 상태 관리 (450줄)
│   │       - global AppState
│   │       - Counter 액션들 (increment, decrement, reset, set)
│   │       - Todo 액션들 (add, update, delete, toggle)
│   │       - 시간 여행 (undo, redo, saveSnapshot)
│   │       - 헬퍼 함수들
│   │
│   └── backend/
│       └── api.free                  # 백엔드 API (550줄)
│           - global BackendState
│           - Health check endpoint
│           - Counter API (GET, POST)
│           - Todo CRUD API
│           - 라우팅 로직 (routeRequest)
│           - 에러 처리
│
├── src/pages/                        # React 페이지들
│   ├── index.tsx                     # 홈페이지 (완료)
│   ├── blog.tsx                      # 블로그 (완료)
│   ├── counter.tsx                   # Counter 데모
│   └── _app.tsx                      # 앱 초기화
│
├── bridge/                           # React ↔ FreeLang 바인딩
│   ├── freelang-state.js            # 상태 관리 (240줄)
│   ├── hooks.js                     # React Hooks (300줄)
│   └── context.js                   # Context API (250줄)
│
├── backend/                          # HTTP 서버 + DB
│   ├── api.js                       # HTTP 서버 (200줄)
│   ├── db.js                        # JSON DB (280줄)
│   ├── handlers.js                  # 핸들러 (250줄)
│   ├── server.js                    # 진입점 (100줄)
│   └── test.js                      # 통합 테스트 (350줄)
│
└── docs/                             # 문서
    ├── BRIDGE_GUIDE.md
    ├── BACKEND_API.md
    └── FREELANG_ARCHITECTURE.md      # 이 파일
```

---

## 🔗 FreeLang과 JavaScript 통합

### 방법 1: 직접 통합 (현재)
```javascript
// backend/api.js
const FreeLangAPI = require('./freelang-bindings');

// FreeLang 함수를 JavaScript에서 호출
const result = FreeLangAPI.incrementCounter(5);
// → Returns: ApiResponse<Counter>
```

### 방법 2: 컴파일 통합 (향후)
```bash
# FreeLang을 JavaScript로 컴파일
freelang compile freelang/backend/api.free -o backend/api-compiled.js

# 또는 네이티브 바이너리로 컴파일
freelang compile freelang/backend/api.free -o backend/api.so
```

### 방법 3: 인터프리터 실행 (향후)
```bash
# FreeLang 인터프리터로 직접 실행
freelang run freelang/backend/api.free --port 3001
```

---

## ✨ 핵심 특징

### 1. **타입 안전성**
```freelang
// FreeLang은 컴파일 타임에 타입 체크
func incrementCounter(amount: number) -> Counter {
  // amount가 number가 아니면 컴파일 에러
  // return 값이 Counter가 아니면 컴파일 에러
}
```

### 2. **단일 소스의 진실**
```freelang
// 프론트/백엔드가 동일한 타입과 로직 사용
type Todo = record {
  id: number
  text: string
  done: boolean
  priority: Priority
}

// 양쪽에서 같은 구조 사용
```

### 3. **시간 여행 디버깅**
```freelang
// FreeLang: 모든 상태 변경 자동 기록
func saveSnapshot() -> number { }
func undo() -> boolean { }
func redo() -> boolean { }

// React: 개발도구에서 시간 여행 가능
```

### 4. **제로 의존성**
```javascript
// backend/api.js
const http = require('http');  // Node.js 기본 모듈만 사용
// npm 패키지 없음!
```

---

## 📊 라인 수 현황

| 계층 | 파일 | 언어 | 줄 수 | 역할 |
|------|------|------|------|------|
| **Types** | freelang/shared/types.free | FreeLang | 200 | 타입 정의 |
| **Frontend Logic** | freelang/frontend/state.free | FreeLang | 450 | 상태/액션 |
| **Backend Logic** | freelang/backend/api.free | FreeLang | 550 | API/라우팅 |
| **Bridge** | bridge/freelang-state.js | JavaScript | 240 | 상태 관리 |
| **React Hooks** | bridge/hooks.js | TypeScript | 300 | Hook 바인딩 |
| **Context** | bridge/context.js | TypeScript | 250 | Context API |
| **UI** | src/pages/*.tsx | TypeScript | 1,900 | React 컴포넌트 |
| **HTTP Server** | backend/api.js | JavaScript | 200 | 요청 처리 |
| **Database** | backend/db.js | JavaScript | 280 | 영속성 |
| **Tests** | backend/test.js | JavaScript | 350 | 통합 테스트 |
| **Total** | | | **4,720** | |

---

## 🚀 실행 방법

### 1. 프론트엔드 + 백엔드 함께 실행
```bash
# 터미널 1: React 개발 서버
npm run dev

# 터미널 2: FreeLang 백엔드 API
node backend/server.js

# 브라우저: http://localhost:3000
```

### 2. API 테스트
```bash
# 테스트 실행
node backend/test.js

# 수동 테스트
curl -X POST http://localhost:3001/api/counter/increment \
  -H "Content-Type: application/json" \
  -d '{"amount": 5}'
```

---

## 🎓 학습 경로

### 초보자
1. React 페이지 읽기 (index.tsx, blog.tsx)
2. TypeScript 훅 보기 (bridge/hooks.js)
3. HTTP 요청 흐름 이해

### 중급
1. FreeLang 타입 이해 (freelang/shared/types.free)
2. 상태 관리 로직 분석 (freelang/frontend/state.free)
3. API 라우팅 학습 (freelang/backend/api.free)

### 고급
1. 전체 데이터 흐름 추적
2. 성능 최적화 (메모리, 캐싱)
3. 테스트 커버리지 개선

---

## 🔮 향후 계획

### Phase 4: 컴파일러 통합
- FreeLang → JavaScript 자동 컴파일
- 타입 체킹 강화
- 성능 최적화

### Phase 5: 데이터베이스 지원
- PostgreSQL 연동
- ORM 자동 생성
- 마이그레이션 도구

### Phase 6: 배포 자동화
- Docker 컨테이너화
- CI/CD 파이프라인
- 프로덕션 배포 가이드

---

## 📚 참고 자료

- [FreeLang 문법 가이드](../freelang/)
- [REST API 문서](./BACKEND_API.md)
- [React Bridge 가이드](./BRIDGE_GUIDE.md)
- [타입 정의 참조](../freelang/shared/types.free)

---

**상태**: ✅ Phase 3 완료 - 프론트/백엔드 모두 FreeLang으로 설계
**다음**: Phase 4 - 프로토타입 구현
**예상 완료**: 2026-03-15
