# 🚀 FreeLang Light Phase 6 계획서

**목표**: 상태 관리 + 라우팅 시스템 구현
**버전**: v1.2.0
**예상 작업량**: 1,200줄+, 24+ 테스트
**완료 기한**: 2026-03-14

---

## 📋 Phase 6 마일스톤

### 6.1 GlobalState (상태 관리) (350줄)
완전한 리액티브 상태 관리 시스템 구현

#### 6.1.1 상태 정의 및 관리
```free
component Counter {
  globalState {
    count: number = 0,
    message: string = "Hello"
  }

  markup {
    <div>
      <p>Count: {globalState.count}</p>
      <button onclick="increment()">+1</button>
    </div>
  }
}
```

**구현**:
- GlobalStateManager 클래스 (180줄)
  - 상태 초기화 및 검증
  - 리액티브 업데이트
  - 구독 시스템 (listeners)
  - 상태 변경 감지
- Store 패턴 (120줄)
  - 중앙 상태 저장소
  - 액션 처리
  - 뮤테이션
  - 부작용 (effects)
- Persistence (50줄)
  - localStorage 자동 저장
  - 복원 기능
- 테스트: 10개

**파일**: `src/global-state-manager.js`, `test-global-state.js`

#### 6.1.2 상태 조합 및 파생
```free
component App {
  globalState {
    firstName: string = "John",
    lastName: string = "Doe"
  }

  computed fullName {
    return globalState.firstName + " " + globalState.lastName
  }

  markup {
    <h1>{fullName}</h1>
  }
}
```

**구현**:
- Computed Properties (100줄)
- Watchers (100줄)
- Derived State (50줄)

---

### 6.2 라우팅 (Router) (400줄)
SPA 라우팅 시스템 구현

#### 6.2.1 기본 라우팅
```free
router {
  routes {
    "/" -> Home,
    "/about" -> About,
    "/blog/:id" -> BlogPost,
    "/user/:username" -> UserProfile
  }

  middleware {
    auth -> requireAuth,
    admin -> requireAdmin
  }
}
```

**구현**:
- Router 클래스 (200줄)
  - 라우트 정의 및 매칭
  - 매개변수 추출 (dynamic routes)
  - 히스토리 관리 (history API)
  - 라우트 가드 (guards)
  - 리다이렉트
- Navigation 헬퍼 (100줄)
  - push(path, params)
  - replace(path)
  - go(n), back(), forward()
- Route State (50줄)
  - 현재 라우트 정보
  - 매개변수 접근
  - 쿼리 스트링
- 테스트: 8개

**파일**: `src/router.js`, `test-router.js`

#### 6.2.2 고급 라우팅
```free
component BlogPost {
  route "/blog/:id" {
    beforeEnter: validateBlogId,
    scroll: { top: 0 },
    meta: { requiresAuth: true }
  }

  markup {
    <article>
      <h1>{route.params.id}</h1>
    </article>
  }
}
```

**구현**:
- Route Guards (80줄)
  - beforeEnter
  - beforeExit
  - 비동기 검증
- Meta Fields (50줄)
- Lazy Loading (70줄)
- 테스트: 6개

---

### 6.3 상태와 라우팅 통합 (300줄)
상태와 라우팅의 완벽한 통합

#### 6.3.1 라우트별 상태 관리
```free
component Dashboard {
  route "/dashboard" {
    state: dashboardState
  }

  globalState {
    currentTab: string = "overview"
  }

  markup {
    <div>
      if currentTab == "overview" { ... }
      if currentTab == "analytics" { ... }
    </div>
  }
}
```

**구현**:
- StateRouter 클래스 (150줄)
  - 라우트별 상태 격리
  - 상태 동기화
  - 캐싱
- RouteState (80줄)
  - 라우트 정보 저장소
- 테스트: 6개

**파일**: `src/state-router.js`, `test-state-router.js`

---

### 6.4 미들웨어 시스템 (150줄)
요청/응답 처리 미들웨어

#### 6.4.1 기본 미들웨어
```free
middleware authMiddleware {
  before: (route) => {
    if route.meta.requiresAuth && !isAuthenticated() {
      return redirect("/login")
    }
  }

  after: (route) => {
    logPageView(route.path)
  }
}
```

**구현**:
- Middleware Pipeline (100줄)
  - 순차 실행
  - 조건부 실행
  - 에러 처리
- Built-in Middleware (50줄)
  - 인증 (auth)
  - 로깅 (logging)
  - 분석 (analytics)
- 테스트: 4개

**파일**: `src/middleware.js`, `test-middleware.js`

---

## 🧪 테스트 계획

| 카테고리 | 개수 | 예상 라인 |
|---------|------|---------|
| GlobalState | 10 | 350줄 |
| Router | 8 | 280줄 |
| StateRouter | 6 | 200줄 |
| Middleware | 4 | 150줄 |
| Integration | 6 | 220줄 |
| **합계** | **34** | **1,200줄** |

---

## 📅 구현 순서

```
Day 1: Phase 6.1 GlobalState
       ├─ GlobalStateManager (180줄 + 10 tests)
       └─ Store Pattern (120줄)

Day 2: Phase 6.2 Router (초반)
       ├─ Router 클래스 (200줄 + 8 tests)
       └─ Navigation 헬퍼 (100줄)

Day 3: Phase 6.2 Router (후반) + 6.3
       ├─ Route Guards (80줄 + 6 tests)
       └─ StateRouter (150줄)

Day 4: Phase 6.4 Middleware + 통합 테스트
       ├─ Middleware Pipeline (100줄 + 4 tests)
       ├─ Built-in Middleware (50줄)
       └─ 통합 테스트 (6개)
```

---

## ✅ 완료 기준

- [ ] 34개 테스트 모두 통과 (100%)
- [ ] 코드 커버리지 > 85%
- [ ] 문서 완성 (README, API_REFERENCE, 튜토리얼)
- [ ] 예제 앱 3개 (Counter, Todo, Blog)
- [ ] GOGS에 커밋 및 태그 (v1.2.0)

---

## 📦 배포 계획

### npm 패키지
```bash
npm publish freelang-light@1.2.0
```

**의존성**:
- history (라우팅용)
- immer (상태 관리용)

---

## 💡 기술적 특징

### GlobalState 특징
- ✅ 리액티브 시스템
- ✅ 구독 패턴
- ✅ 영속성 (localStorage)
- ✅ Computed Properties
- ✅ Watchers

### Router 특징
- ✅ 동적 라우트
- ✅ 라우트 가드
- ✅ 히스토리 관리
- ✅ Lazy Loading
- ✅ 메타 필드

### 통합 특징
- ✅ 상태-라우트 동기화
- ✅ 미들웨어 파이프라인
- ✅ 글로벌 에러 처리
- ✅ 성능 최적화

---

**📍 Start**: 2026-03-13 23:50 UTC+9
**📍 Target Completion**: 2026-03-14 23:00 UTC+9
**📍 Repository**: https://gogs.dclub.kr/kim/freelang-light.git
