# 🚨 셀프호스팅 차단 요소 (Stage 1: Bootstrap 검증)

**날짜**: 2026-03-09  
**현황**: 69% 통과 (42/61 파일)  
**필수 완료**: 61/61 파일 모두 통과

---

## 📊 요약

| 차단 요소 | 영향 파일 | 복잡도 | 필요시간 | 상태 |
|----------|---------|--------|--------|------|
| **Struct Constructor** | 8개 | 중간 | 2-3h | 🔴 BLOCKED |
| **For Loop Edge Cases** | 3개 | 낮음 | 1h | 🔴 BLOCKED |
| **Other Syntax Issues** | 8개 | 높음 | TBD | 🟡 PARTIAL |

**필수 해결**: Struct Constructor (8) + For Loop (3) = **11개 파일 즉시 해결 가능**

---

## 🔴 Priority 1: Struct Constructor Syntax (8 파일)

### 문제
```freeLang
// ❌ 현재 에러
var token: Token = Token { type: "STRING", lexeme: lexeme, line: line }
// Error: expected ':' after field name (got EQ)
```

파서가 `Token { type: "STRING" }` 를 struct literal `{ type: "STRING" }`로 해석하려다 실패

### 원인
- `Type { field: value }` = 생성자 호출 (파싱 안됨)
- `{ field: value }` = 리터럴 (파싱됨)
- 파서의 구분 로직 미흡

### 영향 파일
```
1. lexer.fl          - Struct Token 생성 (L108)
2. emitter.fl        - AST 노드 생성
3. simple-tokenizer.fl - Token 객체 생성
4. parser-json.fl    - JSON 파싱
5. parser-stateless.fl - 구문 분석
6. test_struct_field_access.fl - 필드 접근
+ 2개 파일
```

### 해결 방법
parser.ts L465-517의 struct literal 파싱 로직 개선:
1. `Type { ... }` 패턴 감지 (식별자 + LBRACE)
2. 콜론 시작 확인: `:` = literal, `=` = constructor call
3. 생성자 호출로 컴파일

```typescript
// 현재 (line 508-509)
const name = this.expectIdent("field name");
this.expect(TokenType.COLON, "expected ':' after field name");

// 수정 필요
if (this.check(TokenType.EQ)) {
  // This is a constructor call, not a literal
  // Parse field = value instead of field: value
}
```

---

## 🟡 Priority 2: For Loop Edge Cases (3 파일)

### 영향 파일
```
1. test_for_break.fl
2. test_simple_for.fl
3. test_for_break_only.fl
```

### 문제
For loop 문법 처리 불완전 (break/continue 조합)

---

## 🟠 Priority 3: Other Syntax (8 파일)

### 영향 파일
```
1. test_all.fl
2. test_self_hosting.fl
3. test_server.fl
4-8. 기타 파일
```

---

## 📋 실행 계획

### Phase A: Struct Constructor 지원 (2-3시간)
**목표**: 42 → 50+ 파일 통과

```bash
1. parser.ts L465-520 수정
   - Constructor syntax 감지 로직 추가
   - EQ vs COLON 구분 처리
   
2. AST 타입 (ast.ts) 확인
   - struct_lit 타입이 이미 정의되어 있음
   - 필요시 constructor_call 타입 추가

3. Compiler.ts 확인
   - struct_lit 컴파일 로직
   - 생성자 호출 컴파일 추가
```

### Phase B: For Loop 수정 (1시간)
**목표**: 50+ → 53+ 파일 통과

```bash
1. parser.ts에서 for 문 파싱 로직 확인
2. break/continue 상태 관리 개선
3. 테스트 재실행
```

### Phase C: 기타 문법 분석 (TBD)
**목표**: 53+ → 61 파일 통과

---

## 🎯 즉시 실행 가능한 항목

### ✅ Struct Constructor 구현
```typescript
// parser.ts L508-512 수정 예시

if (!this.check(TokenType.RBRACE)) {
  do {
    const name = this.expectIdent("field name");
    let value: Expr;
    
    if (this.match(TokenType.COLON)) {
      // Struct literal: field: value
      value = this.parseExpr(0);
    } else if (this.match(TokenType.EQ)) {
      // Constructor call: field = value
      value = this.parseExpr(0);
    } else {
      this.error("expected ':' or '=' after field name");
      return left;
    }
    
    fields.push({ name, value });
  } while (this.match(TokenType.COMMA));
}
```

---

## 📊 기대 효과

| 단계 | 현황 | 해결 후 |
|------|------|--------|
| **Priority 1** | 42/61 (69%) | 50/61 (82%) |
| **Priority 2** | 50/61 (82%) | 53/61 (87%) |
| **Priority 3** | 53/61 (87%) | 61/61 (100%) |

**Stage 1 완성 시**: Stage 2 (자체 컴파일) 진행 가능

---

## 📌 다음 단계

1. ✅ Struct Constructor 구현 (지금 바로)
2. ✅ 검증 재실행 (validate-bootstrap-files.js)
3. ✅ For Loop 수정
4. ✅ 기타 문법 분석
5. ✅ GOGS 커밋

