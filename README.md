<div align="center">

# ✨ FreeLang Light

**웹 프론트엔드 개발을 위한 통합 언어**

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-Stable-brightgreen.svg)
![Tests](https://img.shields.io/badge/tests-22%2F22%20%E2%9C%85-green.svg)
![Node](https://img.shields.io/badge/Node.js-18+-339933.svg)
![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

**한 파일에서 로직 + 스타일 + 마크업을 정의하고, 자동으로 HTML·CSS·JS 생성** 🚀

[설치](#-설치) • [빠른 시작](#-빠른-시작) • [문서](#-문서) • [기여](#-기여) • [라이선스](#-라이선스)

</div>

---

## 📋 목차

- [개요](#-개요)
- [핵심 기능](#-핵심-기능)
- [설치](#-설치)
- [빠른 시작](#-빠른-시작)
- [사용 예제](#-사용-예제)
- [API 문서](#-api-문서)
- [아키텍처](#-아키텍처)
- [개발 로드맵](#-개발-로드맵)
- [기여](#-기여)
- [라이선스](#-라이선스)

---

## 🎯 개요

**FreeLang Light**는 단순함과 강력함을 동시에 추구하는 웹 프론트엔드 언어입니다.

```
컴포넌트.free (단일 파일)
    ↓ 컴파일
HTML + CSS + JavaScript
```

**핵심 특징**:
- ✅ **단일 파일 개발** - 로직, 스타일, 마크업을 한 곳에서 관리
- ✅ **자동 컴파일** - CSS, JS, HTML 자동 생성
- ✅ **검색 기능** - 컴포넌트·함수·Props 빠르게 검색
- ✅ **REST API** - 서버 기능 제공 (포트 4002)
- ✅ **CLI 도구** - 명령줄에서 모든 기능 사용
- ✅ **0 의존성** - Node.js만으로 실행

---

## 🚀 핵심 기능

### Phase 1 ✅ - 기본 컴파일러
- Tokenizer & Parser (FreeLang 언어 스펙 v1.0)
- 언어 정의 및 BNF 문법
- 예제 컴포넌트 (Button, Card)

### Phase 2 ✅ - 인덱싱 & 검색
- 자동 인덱싱 (Props, Functions, Styles)
- 검색 API 서버 (포트 4002)
- 3단어 패턴 검색 (KPM 호환)

### Phase 3 ✅ - 고급 기능
- 조건부 렌더링 (if/else)
- 반복 렌더링 (for loop)
- Props 기본값 처리

### Phase 4 ✅ - 번들러
- CSS/JS/HTML 병합
- 코드 최소화 (Minification)
- 소스맵 생성

---

## 📦 설치

### npm으로 설치

```bash
npm install freelang-light
```

### 로컬에서 빌드

```bash
git clone https://github.com/kimjindol2025/freelang-light.git
cd freelang-light
npm install
npm run build
```

---

## ⚡ 빠른 시작

### 1️⃣ 기본 컴포넌트 작성

`button.free` 파일을 만드세요:

```free
component Button {
  props {
    label: string = "Click me",
    type: string = "primary"
  }

  style {
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      background: #007bff;
      color: white;
    }
    .btn.secondary {
      background: #6c757d;
    }
  }

  markup {
    <button class="btn btn-{type}">
      {label}
    </button>
  }
}
```

### 2️⃣ 컴파일

```bash
npx freelang compile button.free
```

**생성되는 파일**:
- `button.html` - 마크업 템플릿
- `button.css` - 스타일시트
- `button.js` - 컴포넌트 로직

### 3️⃣ HTML에서 사용

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="button.css">
</head>
<body>
  <div id="app"></div>
  <script src="button.js"></script>
</body>
</html>
```

---

## 💡 사용 예제

### 예제 1: Card 컴포넌트 (조건부 렌더링)

```free
component Card {
  props {
    title: string,
    content: string,
    showFooter: bool = true
  }

  style {
    .card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .card-title {
      font-weight: bold;
      font-size: 18px;
      margin-bottom: 10px;
    }
    .card-footer {
      border-top: 1px solid #eee;
      margin-top: 15px;
      padding-top: 15px;
      text-align: right;
    }
  }

  markup {
    <div class="card">
      <div class="card-title">{title}</div>
      <div class="card-content">{content}</div>

      if showFooter {
        <div class="card-footer">
          <button>Learn More</button>
        </div>
      }
    </div>
  }
}
```

### 예제 2: List 컴포넌트 (반복 렌더링)

```free
component List {
  props {
    items: array<object> = [],
    keyField: string = "id"
  }

  style {
    .list-item {
      padding: 12px;
      border-bottom: 1px solid #f0f0f0;
      transition: background 0.2s;
    }
    .list-item:hover {
      background: #f5f5f5;
    }
  }

  markup {
    <div class="list">
      for item in items {
        <div class="list-item" key={item[keyField]}>
          {str(item)}
        </div>
      }
    </div>
  }
}
```

---

## 📚 API 문서

### CLI 명령어

```bash
# 컴파일
npx freelang compile <file>

# 검색
npx freelang search <query>

# 인덱싱
npx freelang index <directory>

# 개발 서버 시작 (포트 4002)
npx freelang serve

# 컴포넌트 목록 조회
npx freelang list

# 통계 출력
npx freelang stats
```

### REST API 엔드포인트

```
GET  /api/search?q=<query>              # 검색
GET  /api/search-three-words?q=<words>  # 3단어 패턴 검색
GET  /api/component/<name>              # 컴포넌트 상세 조회
GET  /api/components                    # 모든 컴포넌트 목록
```

### 검색 예제

```bash
# 함수로 검색
curl http://localhost:4002/api/search?q=renderList

# Props로 검색
curl http://localhost:4002/api/search?q=label

# 결과
{
  "results": [
    {
      "type": "function",
      "name": "renderList",
      "component": "List",
      "file": "examples/list.free",
      "line": 12,
      "rank": 95
    }
  ]
}
```

---

## 🏗️ 아키텍처

### 컴파일 파이프라인

```
component.free
    │
    ▼
┌──────────────────┐
│ Tokenizer        │  어휘 분석
└────────┬─────────┘
         │
    ▼
┌──────────────────┐
│ Parser           │  구문 분석 → AST
└────────┬─────────┘
         │
    ▼
┌──────────────────┐
│ Validator        │  Props/Style/Markup 검증
└────────┬─────────┘
         │
    ▼
┌──────────────────────────────────┐
│ Code Generators                  │
├──────────────┬──────────┬────────┤
│ CSS Compiler │ JS Gen   │ HTML   │
└──────┬───────┴───┬──────┴───┬────┘
       │           │         │
       ▼           ▼         ▼
   *.css       *.js      *.html
```

### 디렉토리 구조

```
freelang-light/
├── src/
│   ├── parser.js              (600줄)  파서 + 토크나이저
│   ├── expression-evaluator.js (300줄) 표현식 평가
│   ├── markup-processor.js     (250줄) if/for 렌더링
│   ├── indexer.js             (400줄) 자동 인덱싱
│   ├── search-api.js          (300줄) REST API 서버
│   ├── bundler.js             (400줄) CSS/JS/HTML 번들링
│   ├── cli.js                 (500줄) CLI 도구
│   ├── css-compiler.js        (100줄) 스타일 컴파일러
│   ├── js-compiler.js         (100줄) JS 생성기
│   ├── html-generator.js      (100줄) HTML 생성기
│   └── test-*.js              (600줄) 테스트 슈트
│
├── examples/
│   ├── button.free            기본 버튼 컴포넌트
│   ├── card.free              카드 컴포넌트
│   └── list.free              리스트 컴포넌트
│
├── docs/
│   ├── SPEC.md                언어 스펙
│   ├── API_REFERENCE.md       API 문서
│   └── DEPLOYMENT.md          배포 가이드
│
└── README.md                  이 파일
```

---

## 📊 언어 스펙

### Component 블록

```free
component ComponentName {
  props { ... }
  style { ... }
  markup { ... }
}
```

### Props 정의

```free
props {
  title: string,              // 필수
  count: number = 0,          // 기본값 있음
  items: array = [],          // 배열
  active: bool = false        // 불린
}
```

### Style 블록

```free
style {
  .classname {
    property: value;
  }

  .classname:hover {
    property: value;
  }
}
```

### Markup 블록

```free
markup {
  // 기본 HTML
  <div>{title}</div>

  // Props 바인딩
  <span>{content}</span>

  // 조건부 렌더링
  if condition {
    <p>show this</p>
  }

  // 반복
  for item in items {
    <li>{item}</li>
  }
}
```

---

## 🧪 테스트 현황

```bash
# 전체 테스트 실행
npm test

# 특정 테스트만 실행
npm test -- --grep "Parser"

# 커버리지 보고서
npm run test:coverage
```

### 테스트 결과

| 카테고리 | 개수 | 상태 |
|---------|------|------|
| Unit Tests | 10 | ✅ PASS |
| Integration Tests | 8 | ✅ PASS |
| E2E Tests | 4 | ✅ PASS |
| **총합** | **22** | **✅ 100%** |

---

## 🚢 배포

### 개발 환경

```bash
npm install
npm run dev          # 개발 서버 시작
npm run build        # 빌드
```

### 프로덕션 배포

```bash
# 번들 생성
npm run bundle

# 배포
npm run deploy
```

### Docker 배포

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build
EXPOSE 4002
CMD ["npm", "start"]
```

```bash
docker build -t freelang-light .
docker run -p 4002:4002 freelang-light
```

---

## 📈 개발 로드맵

### Phase 5 (계획)
- [ ] Vue/React 호환성
- [ ] Tailwind CSS 통합
- [ ] TypeScript 지원

### Phase 6 (계획)
- [ ] 상태 관리 (State)
- [ ] 라우팅 (Routing)
- [ ] 폼 검증

---

## 💬 커뮤니티

- 📧 Email: support@freelang.io
- 🐦 Twitter: [@freelang_io](https://twitter.com/freelang_io)
- 💬 Discussions: [GitHub Discussions](https://github.com/kimjindol2025/freelang-light/discussions)

---

## 🤝 기여

FreeLang Light 프로젝트에 기여하고 싶으신가요?

### 기여 방법

1. **Fork** 저장소
   ```bash
   git clone https://github.com/YOUR-USERNAME/freelang-light.git
   cd freelang-light
   ```

2. **Feature 브랜치** 만들기
   ```bash
   git checkout -b feature/your-feature
   ```

3. **커밋** 및 **푸시**
   ```bash
   git commit -m "✨ Add: your feature"
   git push origin feature/your-feature
   ```

4. **Pull Request** 생성
   - 명확한 설명 작성
   - 테스트 코드 포함
   - 문서 업데이트

### 개발자 가이드

- [CONTRIBUTING.md](./CONTRIBUTING.md) - 기여 규칙
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) - 행동 수칙
- [DEV_SETUP.md](./docs/DEV_SETUP.md) - 개발 환경 설정

---

## 📝 라이선스

이 프로젝트는 **MIT License** 하에 배포됩니다.

```
MIT License © 2026 FreeLang Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

자세한 내용은 [LICENSE](./LICENSE) 파일을 참고하세요.

---

## 👥 저자 및 기여자

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/kimjindol2025">
        <img src="https://avatars.githubusercontent.com/u/..." alt="Kim Jindol" width="60px;" /><br />
        <b>Kim Jindol</b><br />
        🎨 Creator & Lead Developer
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/contributors">
        <img src="https://avatars.githubusercontent.com/u/..." alt="Contributors" width="60px;" /><br />
        <b>Contributors</b><br />
        🙌 Open Source Community
      </a>
    </td>
  </tr>
</table>

---

## 📞 연락처 및 지원

- 🐛 **버그 리포트**: [Issues](https://github.com/kimjindol2025/freelang-light/issues)
- 💡 **기능 제안**: [Discussions](https://github.com/kimjindol2025/freelang-light/discussions)
- 📚 **문서**: [Wiki](https://github.com/kimjindol2025/freelang-light/wiki)
- 🌐 **웹사이트**: [freelang.io](https://freelang.io)

---

<div align="center">

**⭐ 이 프로젝트가 도움이 되었다면 별(Star)을 눌러주세요!**

Made with ❤️ by the FreeLang Team

</div>
