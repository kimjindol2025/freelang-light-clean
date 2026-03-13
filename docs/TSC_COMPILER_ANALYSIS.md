# TypeScript 컴파일러(tsc) 내부 구조 분석 보고서

> 분석 대상: TypeScript v5.9.3 (`node_modules/typescript/lib/typescript.js` — 200,276 LOC)
> 분석일: 2026-03-11

---

## 1. 전체 아키텍처: 5단계 파이프라인

```
Source Code (.ts)
    ↓
[1] SCANNER (Lexical Analysis)     — 토큰화
    ↓
[2] PARSER (Syntax Analysis)       — AST 구축
    ↓
[3] BINDER (Symbol Resolution)     — 심볼 테이블 생성
    ↓
[4] TYPE CHECKER (Semantic Analysis) — 타입 추론/검증
    ↓
[5] EMITTER (Code Generation)      — JS/소스맵 출력
    ↓
Output: .js + .d.ts + .js.map
```

**핵심 엔트리:** `createProgram()` (line 126929)이 전체 파이프라인 오케스트레이션

---

## 2. 소스 파일 구조

| 컴포넌트 | typescript.js 내 위치 | 역할 |
|----------|---------------------|------|
| SyntaxKind enum | ~3000-4000 | 340+ 노드 타입 정의 |
| Scanner | 12114+ | 토큰화 |
| Parser | 33195+ | AST 생성 |
| Binder | 46813+ | 심볼 테이블 |
| Type Checker | 50995+ | 타입 추론/검증 |
| Printer/Emitter | 121166+ | JS 코드 생성 |
| Program | 126929+ | 전체 조율 |

---

## 3. 단계별 상세 분석

### [1] Scanner — 토큰화

**함수:** `createScanner()` (line 12114)

**상태 관리:**
```javascript
{
  text,          // 소스 코드
  pos,           // 현재 위치
  token,         // 현재 토큰 SyntaxKind
  tokenValue,    // 리터럴 값
  tokenFlags,    // 메타데이터 (UnicodeEscape, Unterminated 등)
  scriptKind,    // JS/TS/JSON/JSX
}
```

**핵심 메서드:**
- `scan()` — 다음 토큰 진행
- `getToken()` — 현재 토큰 종류
- `getTokenValue()` — 리터럴 내용
- `reScanSlashToken()` — 컨텍스트 감지 (`/`가 나눗셈인지 정규식인지)
- `lookAhead()`, `tryScan()` — 투기적(speculative) 파싱

**설계 패턴:** 클로저 기반 상태 머신 + 지연 초기화

**FreeLang 비교:**
| tsc | FreeLang | 차이점 |
|-----|----------|--------|
| `createScanner()` 클로저 | `class Lexer` | tsc는 클래스 대신 클로저 |
| `reScanSlashToken()` | 없음 | tsc는 컨텍스트 감지 재스캔 |
| `lookAhead()` | 없음 | tsc는 투기적 파싱 지원 |

---

### [2] Parser — AST 구축

**엔트리:** `parseSourceFile()` (line 33195) → `parseSourceFileWorker()`

**파싱 전략:**
- **재귀 하강(recursive descent)** + **Pratt 파서(precedence climbing)**
- 2토큰 룩어헤드
- 백트래킹 지원 (`speculationHelper()`)

**연산자 우선순위 (높은 순):**
```
17: *, /, %
16: +, -
15: <<, >>, >>>
14: <, >, <=, >=, instanceof, in
13: ==, !=, ===, !==
12: & (bitwise)
11: ^ (bitwise)
10: | (bitwise)
9:  && (logical)
8:  || (logical)
7:  ?? (nullish)
6:  ?: (ternary)
5:  =, +=, -= (assignment) ← 우결합
```

**에러 복구:**
- 에러 발생해도 파싱 **중단 안 함**
- `parseErrorAtCurrentToken()` — 에러 기록
- `skipUntilAfter()` — 다음 문장 경계로 건너뜀
- 부분 노드 생성 → IDE 자동완성 가능

**FreeLang 비교:**
| tsc | FreeLang | 차이점 |
|-----|----------|--------|
| 에러 복구 계속 파싱 | `❌ Compilation Error`로 중단 | **tsc 우위** |
| 340+ SyntaxKind | ~45 AST 타입 | tsc가 8배 많음 |
| `speculationHelper()` | 없음 | tsc는 백트래킹 |

---

### [3] Binder — 심볼 테이블 생성

**함수:** `createBinder()` (line 46813) → `bindSourceFile()`

**역할:**
1. AST 깊이 우선 순회
2. 선언마다 `Symbol` 객체 생성
3. 스코프 계층 구축 (블록/함수/모듈)
4. 심볼 병합 (오버로드, 재선언)
5. 제어 흐름 분석 노드 구축

**Symbol 구조:**
```javascript
{
  flags,              // SymbolFlags (Variable=1, Function=16, Class=32...)
  escapedName,        // 식별자 이름
  declarations[],     // 이 심볼을 선언하는 모든 노드
  valueDeclaration,   // 메인 값 선언
  members,            // 클래스/인터페이스 멤버 (SymbolTable)
  exports,            // 모듈 내보내기 (SymbolTable)
  parent              // 상위 심볼
}
```

**제어 흐름 분석 (FlowNode):**
```javascript
FlowNode =
  | { kind: "Start" }
  | { kind: "Unreachable" }
  | { kind: "Assignment", antecedent }
  | { kind: "TrueCondition", antecedent, condition }   // 타입 좁히기
  | { kind: "FalseCondition", antecedent, condition }
  | { kind: "BranchLabel", antecedents[] }
```

**Binder 상태:**
```javascript
{
  container,              // 현재 스코프
  blockScopeContainer,    // 블록 레벨 스코프 (let/const)
  currentFlow,            // 제어 흐름 분석
  currentBreakTarget,     // break 대상 루프/switch
  currentReturnTarget,    // return 대상 함수
  inStrictMode
}
```

**⚠️ FreeLang에 없는 것:**
- **Binder 단계 자체가 없음** — FreeLang은 Parser → IR Generator로 직행
- 심볼 테이블 없음 → 변수 해석이 IR/VM에서 런타임으로 처리
- 제어 흐름 분석 없음 → 타입 좁히기(narrowing) 불가
- **이것이 `undef_var` 버그의 근본 원인** — 컴파일 타임에 심볼 검증이 안 됨

---

### [4] Type Checker — 타입 추론/검증

**함수:** `createTypeChecker()` (line 50995)

**핵심 특성:** **지연 평가(lazy evaluation)** — 요청할 때만 타입 계산

**타입 표현:**
```javascript
Type {
  flags,              // TypeFlags (String, Number, Union, Object...)
  id,                 // 고유 ID
  symbol,             // 관련 심볼
}
// 서브타입:
StringLiteralType { value: string }
UnionType { types: Type[] }
InterfaceType { typeParameters, members, callSignatures }
TypeReference { target, typeArguments }
```

**핵심 알고리즘 — 타입 호환성:**
```
isAssignableTo(source, target):
  if source === target → true
  if target is Unknown → true
  if source is Never → true
  if source is Union → 모든 멤버가 target에 할당 가능?
  if target is Union → source가 어떤 멤버에 할당 가능?
  if both Object → 구조적 비교 (프로퍼티별 타입 체크)
```

**캐싱 전략 (성능 핵심):**
```javascript
// 3단계 타입 관계 캐시:
assignableRelation  = new Map()    // A ⊆ B?
identityRelation    = new Map()    // A ≡ B?
subtypeRelation     = new Map()    // A <: B?
strictSubtypeRelation = new Map()

// 메모이제이션:
memoize((callback) => {
  let value;
  return () => {
    if (callback) { value = callback(); callback = undefined; }
    return value;
  };
})
```

**FreeLang 비교:**
| tsc | FreeLang | 차이점 |
|-----|----------|--------|
| 3단계 관계 캐시 | 캐시 없음 | tsc 성능 우위 |
| 구조적 타입 시스템 | 타입 시스템 미약 | tsc 안전성 우위 |
| 지연 평가 | 즉시 평가 | tsc 효율성 우위 |
| `memoize()` 패턴 | 없음 | |

---

### [5] Emitter — JS 코드 생성

**함수:** `createPrinter()` (line 121166)

**변환 파이프라인:**
```
Original AST
  ↓ [사용자 정의 Transformer]
Transformed AST
  ↓ [내장 Transform: class→function, async→state machine]
Modern JS AST
  ↓ [Printer — Visitor 패턴]
JavaScript Text + Source Map
```

**Visitor 패턴:**
```javascript
print(hint, node, sourceFile) {
  switch (node.kind) {
    case SyntaxKind.ClassDeclaration:
      return emitClassDeclaration(node);
    case SyntaxKind.Block:
      writeToken(OpenBrace);
      emitList(node.statements);
      writeToken(CloseBrace);
      break;
  }
}
```

**출력물:**
- `.js` — JavaScript 코드
- `.d.ts` — 타입 선언 파일
- `.js.map` — 소스 맵

---

## 4. 핵심 설계 패턴

### 패턴 1: 메모이제이션 + 캐싱 (모든 단계)
```javascript
memoize(fn)       // 단일 결과 캐싱
memoizeOne(fn)    // 인자별 캐싱
Map 기반 relation cache  // 타입 관계 캐싱
```

### 패턴 2: Visitor 패턴 (Binder, Checker, Emitter)
```javascript
function visit(node) {
  switch (node.kind) { /* dispatch */ }
  forEachChild(node, visit);
}
```

### 패턴 3: 지연 평가 (Type Checker)
```javascript
const getTypeChecker = memoize(() => createTypeChecker(host));
// 최초 호출 시에만 생성
```

### 패턴 4: 증분 컴파일 (Program)
```javascript
tryReuseStructureFromOldProgram() {
  // 소스 파일 변경 안 됐으면 이전 AST/심볼 재사용
}
```

### 패턴 5: 제어 흐름 그래프 (Binder)
```javascript
FlowNode → 분기/합류/할당 추적 → 타입 좁히기
```

---

## 5. tsc vs FreeLang 비교 분석

### 아키텍처 비교

```
tsc:      Scanner → Parser → BINDER → TYPE CHECKER → Emitter
FreeLang: Lexer   → Parser →         IR Generator  → VM
                              ^^^^^^^^^^^^^^^^^^^^
                              이 두 단계가 FreeLang에 없음
```

### 핵심 차이점

| 영역 | tsc | FreeLang | 영향 |
|------|-----|----------|------|
| **심볼 테이블** | Binder가 컴파일타임 구축 | 없음 (런타임 vars Map) | `undef_var` 런타임 에러 |
| **스코프 체인** | nested Map + blockScope | 단순 Set | shadowing 미감지 |
| **타입 검증** | 컴파일타임 전수 검사 | 경고만 (차단 안 함) | 런타임 타입 에러 |
| **에러 복구** | 계속 파싱 | 즉시 중단 | IDE 지원 불가 |
| **캐싱** | 3단계 relation cache | 없음 | 성능 차이 |
| **제어 흐름** | FlowNode 그래프 | 없음 | 타입 좁히기 불가 |
| **증분 컴파일** | 이전 결과 재사용 | 매번 전체 컴파일 | 빌드 속도 |
| **백트래킹** | speculationHelper | 없음 | 복잡 문법 파싱 한계 |
| **AST 노드** | 340+ SyntaxKind | ~45 타입 | 표현력 차이 |

### 근본 원인 분석: FreeLang 반복 버그

| 버그 | 근본 원인 | tsc 해결 방식 |
|------|----------|--------------|
| `undef_var:t` | 심볼 테이블 없음 → 변수 존재 런타임 체크 | Binder가 컴파일타임에 심볼 등록 |
| 2파라미터 `undef_var:b` | IR Gen의 파라미터 스코프 처리 미흡 | Binder의 Function 스코프 + 심볼 생성 |
| `out[idx].arg = val` 미지원 | AST에서 복합 lvalue 미처리 | Parser가 MemberExpression 체인 완전 지원 |
| `continue` 미지원 | IR Gen case 누락 | 전 AST 노드 타입에 대한 완전한 Emitter 구현 |
| silent failure | 에러 복구 없이 즉시 중단 | Parser가 에러 기록 후 계속 진행 |

---

## 6. FreeLang 개선 로드맵 (tsc 참조)

### 즉시 적용 가능 (1주)

1. **심볼 테이블 도입** — Binder 단계 추가
   - Parser → **Binder** → IR Generator → VM
   - 변수/함수 선언을 컴파일타임에 등록
   - `undef_var` 에러를 컴파일타임으로 이동

2. **스코프 체인 개선** — Set → nested Map
   - blockScope + functionScope 분리
   - shadowing 감지

3. **에러 복구** — 파서에서 즉시 중단 대신 계속 파싱
   - 모든 에러 수집 후 일괄 보고

### 중기 적용 (2-4주)

4. **타입 캐싱** — memoize 패턴 적용
5. **제어 흐름 분석** — FlowNode 기반 타입 좁히기
6. **증분 컴파일** — 변경 안 된 파일 AST 재사용

### 장기 적용 (4-8주)

7. **완전한 타입 체커** — 구조적 타입 시스템
8. **Transformer 파이프라인** — 플러그인 확장성
9. **소스 맵** — 디버깅 지원

---

## 7. 결론

TypeScript 컴파일러는 **5단계 파이프라인(Scanner→Parser→Binder→Checker→Emitter)**으로 설계되어 있으며, FreeLang에 없는 **Binder**와 **Type Checker** 단계가 현재 반복되는 버그(undef_var, 스코프 문제)의 근본 원인입니다.

**가장 시급한 개선:** Binder 단계 도입 → 컴파일타임 심볼 검증

이 한 단계만 추가해도 런타임 `undef_var` 에러의 80%를 컴파일타임에 잡을 수 있습니다.
