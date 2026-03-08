# @freelang/parser

FreeLang 파서 - 구문 분석기 및 AST 생성기

## 설치

```bash
npm install @freelang/parser
```

## 사용법

```javascript
const { Parser } = require('@freelang/parser');

const parser = new Parser();
const ast = parser.parse(sourceCode);
console.log(ast);
```

## 특징

- 원패스 파싱 (One-pass parsing)
- 부분 파싱 지원 (Partial parsing)
- 오류 복구 (Error recovery)
- 상세한 위치 정보 (Position info)

## AST 구조

```javascript
{
  type: 'Program',
  body: [
    {
      type: 'FunctionDeclaration',
      name: 'hello',
      params: [],
      body: { ... }
    }
  ]
}
```

자세한 정보: https://github.com/freelang-io/freelang-compiler
