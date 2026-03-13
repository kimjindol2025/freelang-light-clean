# 🚀 FreeLang Light Phase 5 계획서

**목표**: 고급 기능 + 에코시스템 확장
**버전**: v1.1.0
**예상 작업량**: 1,500줄+, 20+ 테스트
**완료 기한**: 2026-03-13

---

## 📋 Phase 5 마일스톤

### 5.1 Vue/React 호환성 (400줄)
프로젝트를 Vue.js 및 React 생태계와 호환되도록 확장

#### 5.1.1 Vue Component Adapter
```js
// freelang-light → Vue 변환
const button = new VueComponentAdapter(buttonComponent);

// Vue 사용
<Button label="Click me" @click="handler" />
```

**구현**:
- VueComponentAdapter 클래스 (200줄)
  - props → Vue props 변환
  - markup → Vue template 변환
  - event handlers 처리
  - slot 지원
- Vue 런타임 패치 (100줄)
- 테스트: 8개

**파일**: `src/vue-adapter.js`, `test-vue-adapter.js`

#### 5.1.2 React Component Adapter
```js
// FreeLang → React 변환
export const ButtonComponent = toReactComponent(buttonComponent);

// React 사용
<ButtonComponent label="Click" onClick={handler} />
```

**구현**:
- ReactComponentAdapter 클래스 (200줄)
  - JSX 생성
  - props → React props 매핑
  - hooks 통합 (useState, useEffect)
  - event handler 바인딩
- React 런타임 (100줄)
- 테스트: 8개

**파일**: `src/react-adapter.js`, `test-react-adapter.js`

---

### 5.2 Tailwind CSS 통합 (350줄)
Tailwind CSS 유틸리티 클래스와 FreeLang 스타일 시스템 통합

#### 5.2.1 Tailwind 클래스 변환
```free
component Button {
  props {
    size: string = "md"
  }

  style {
    @tailwind base;
    @tailwind components;
    @tailwind utilities;

    .btn-sm { @apply px-2 py-1 text-sm; }
    .btn-md { @apply px-4 py-2 text-base; }
    .btn-lg { @apply px-6 py-3 text-lg; }
  }
}
```

**구현**:
- TailwindCompiler 클래스 (200줄)
  - @apply 지시문 처리
  - Tailwind config 로드
  - 클래스 최적화
  - PurgeCSS 통합
- Style Combiner (150줄)
  - FreeLang 스타일 + Tailwind 병합
  - 우선순위 관리
  - 중복 제거
- 테스트: 6개

**파일**: `src/tailwind-compiler.js`, `test-tailwind.js`

---

### 5.3 TypeScript 지원 (400줄)
완전한 TypeScript 타입 정의 및 타입 체크 통합

#### 5.3.1 TypeScript 정의 파일 생성
```ts
// Button.free → Button.d.ts
export interface ButtonProps {
  label: string;
  type?: 'primary' | 'secondary';
  onClick?: (event: MouseEvent) => void;
}

export declare const Button: React.FC<ButtonProps>;
```

**구현**:
- TypeScriptGenerator 클래스 (250줄)
  - Props → TypeScript interface 생성
  - Type definitions 작성
  - JSDoc 주석 추가
  - 호환성 검증
- Type Validator (150줄)
  - 런타임 타입 체크
  - Props 검증
  - 에러 메시지 개선
- 테스트: 8개

**파일**: `src/typescript-generator.js`, `test-typescript.js`

#### 5.3.2 TypeScript 컴파일 옵션
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "declaration": true,
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true
  }
}
```

---

### 5.4 고급 기능 (350줄)
기존 기능 확장 및 새로운 기능 추가

#### 5.4.1 GlobalState (상태 관리)
```free
component Counter {
  globalState {
    count: number = 0
  }

  style {
    .counter { font-size: 24px; }
  }

  markup {
    <div class="counter">
      <p>{globalState.count}</p>
      <button onclick="increment()">+1</button>
    </div>
  }
}
```

**구현**:
- GlobalStateManager 클래스 (150줄)
  - 상태 초기화 및 관리
  - 리액티브 업데이트
  - 구독 시스템 (listeners)
  - 영속성 (localStorage)
- Store 패턴 (100줄)
- 테스트: 6개

#### 5.4.2 라우팅 (Router)
```free
router {
  routes {
    "/" -> Home,
    "/about" -> About,
    "/blog/:id" -> BlogPost
  }
}
```

**구현**:
- Router 클래스 (150줄)
  - 라우트 정의 및 매칭
  - 매개변수 추출 (dynamic routes)
  - 히스토리 관리
  - 리다이렉트
- Navigation 헬퍼 (50줄)
- 테스트: 5개

---

### 5.5 CLI 확장 (150줄)
새로운 CLI 명령어 추가

#### 새 명령어:
```bash
# TypeScript 생성
freelang typedefs <file> --output types/

# Tailwind 빌드
freelang build:tailwind --config tailwind.config.js

# 어댑터 생성
freelang generate:vue <component.free>
freelang generate:react <component.free>

# 성능 분석
freelang analyze <directory>
```

---

## 🧪 테스트 계획

| 카테고리 | 개수 | 예상 라인 |
|---------|------|---------|
| Vue Adapter | 8 | 300줄 |
| React Adapter | 8 | 300줄 |
| Tailwind | 6 | 200줄 |
| TypeScript | 8 | 250줄 |
| GlobalState | 6 | 200줄 |
| Router | 5 | 200줄 |
| Integration | 5 | 150줄 |
| **합계** | **46** | **1,600줄** |

---

## 📅 구현 순서

```
Day 1: 5.1 Vue Adapter + React Adapter
       ├─ VueComponentAdapter (200줄 + 8 tests)
       └─ ReactComponentAdapter (200줄 + 8 tests)

Day 2: 5.2 Tailwind CSS + 5.3 TypeScript (초반)
       ├─ TailwindCompiler (200줄 + 6 tests)
       └─ TypeScriptGenerator (250줄 + 4 tests)

Day 3: 5.3 TypeScript 완성 + 5.4 GlobalState
       ├─ Type Validator (150줄 + 4 tests)
       └─ GlobalStateManager (150줄 + 6 tests)

Day 4: 5.4 Router + 5.5 CLI + 통합 테스트
       ├─ Router (150줄 + 5 tests)
       ├─ CLI 확장 (150줄)
       └─ 통합 테스트 (5개)
```

---

## ✅ 완료 기준

- [ ] 46개 테스트 모두 통과 (100%)
- [ ] 코드 커버리지 > 80%
- [ ] 문서 완성 (README, API_REFERENCE, 튜토리얼)
- [ ] 예제 컴포넌트 3개 추가 (Vue, React, Tailwind)
- [ ] GOGS에 커밋 및 태그 (v1.1.0)

---

## 📦 배포 계획

### npm 패키지
```bash
npm publish freelang-light@1.1.0
```

**의존성 추가 검토**:
- Vue 3 (선택사항, peerDependency)
- React 18+ (선택사항, peerDependency)
- Tailwind CSS 3+ (선택사항, peerDependency)
- TypeScript (dev 의존성)

---

## 💡 주요 학습 목표

1. **프레임워크 호환성**: Vue/React의 렌더링 메커니즘 이해
2. **CSS 최적화**: Tailwind와 커스텀 CSS 병합
3. **타입 시스템**: TypeScript 타입 정의 자동 생성
4. **상태 관리**: 리액티브 상태 시스템 설계
5. **라우팅**: SPA 라우터 구현

---

**📍 Start**: 2026-03-13 09:00 UTC+9
**📍 Target Completion**: 2026-03-13 23:00 UTC+9
**📍 Repository**: https://gogs.dclub.kr/kim/freelang-light.git

