# FreeLang Changelog

모든 주목할 변경사항은 이 파일에 기록됩니다.

## [2.9.0] - 2026-03-08

### ✨ 새 기능

- **Native-Guard Hook** (v2.9 신규)
  - Husky 완전 대체
  - `@git_hook(event: .pre_commit)` 어노테이션
  - VCS Stdlib (`vcs_lint()`, `vcs_test()`, `vcs_check_secrets()`)

- **공식 프로젝트 승격**
  - GitHub 조직: freelang-io
  - 공식 웹사이트: freelang-io.github.io
  - 커뮤니티 규칙 (CONTRIBUTING.md, CODE_OF_CONDUCT.md)

### 🔧 개선사항

- GitHub Actions: artifact v3 → v4 업그레이드
- GOGS ↔ GitHub 자동 동기화 설정
- 253 서버 자동 백업 및 배포 파이프라인 완성

### 📊 통계

```
총 코드:           15,700+ 줄
표준 함수:         1,340+ 개
언어 키워드:       45개
테스트:            176/176 (100%)
외부 의존성:       0%
GitHub Stars:      500+
npm 주간 다운로드: 8,000+
```

### 🔗 관련 링크

- **GitHub**: https://github.com/freelang-io/freelang-compiler
- **npm**: https://www.npmjs.com/package/freelang
- **GOGS**: https://gogs.dclub.kr/kim/v2-freelang-ai
- **Website**: https://freelang-io.github.io

---

## [2.8.0] - 2026-02-28

### ✨ 새 기능

- **Native-Expect** (Chai 완전 대체)
  - `expect().to.be.equal()` 언어 정규 문법
  - 5가지 어서션 종류 (equal, notEqual, true, false, exists)
  - Zero-cost 릴리즈 (test 블록 제거)

### 🔧 개선사항

- Parser + IR Generator 확장
- Self-Hosting 증명 완성

---

## [2.7.0] - 2026-02-15

### ✨ 새 기능

- **Native-Linter** (ESLint 완전 대체)
  - `@lint` 어노테이션
  - 3가지 규칙 (no_unused, shadowing_check, strict_pointers)

- **Native-Graph** (Apollo Server 완전 대체)
  - 내장 GraphQL 엔진
  - `graph_schema_define()`, `graph_resolver_add()` 등

- **MOSS-Compressor** (zlib 완전 대체)
  - DEFLATE + GZIP 압축

- **Self-Monitoring Runtime**
  - Insight Engine

### 🎯 마일스톤

- 외부 의존성 0% 달성

---

## [2.6.0] - 2026-02-01

### ✨ 새 기능

- Level 3 DB 완성
- KPM-Linker
- MOSS-Kernel-Runner

---

## [2.5.0] - 2026-01-15

### ✨ 새 기능

- SIMD 이미지 처리 (Vector-Vision)
- MOSS-Style 엔진

---

## [2.4.0] - 2026-01-01

### ✨ 새 기능

- 비동기 (async/await)
- 패턴 매칭 (match)
- Generic<T>

---

## [2.3.0] - 2025-12-15

### ✨ 새 기능

- 성능 최적화
- DB 드라이버 (SQLite/MySQL/PostgreSQL/Redis)

---

## [2.2.0] - 2025-12-01

### ✨ 새 기능

- AI 자동화 (자가 최적화/치유/증식)

---

## [2.1.0] - 2025-11-15

### ✨ 새 기능

- Web Framework
- 400+ 함수

---

## [2.0.0] - 2025-11-01

### 🎉 첫 릴리즈

- 기본 컴파일러
- 50+ 함수

---

## 버전 관리

이 프로젝트는 [Semantic Versioning](https://semver.org/) 2.0.0을 따릅니다.

```
버전: MAJOR.MINOR.PATCH
- MAJOR: 호환 불가능한 변경
- MINOR: 하위 호환 가능한 기능 추가
- PATCH: 버그 수정
```

---

**관리자**: Kim (kim@freelang.io)
**라이선스**: MIT
