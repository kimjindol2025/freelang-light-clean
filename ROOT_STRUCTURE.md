# 📁 FreeLang Light - 프로젝트 구조

## 루트 파일 (최소화)

```
freelang-light/
├── README.md              ← 프로젝트 소개 (프론트엔드 중심)
├── LICENSE                ← MIT 라이선스
├── package.json           ← npm 패키지 설정
├── tsconfig.json          ← TypeScript 설정
├── jest.config.ts         ← Jest 테스트 설정
├── Dockerfile             ← 컨테이너 설정
├── Makefile               ← 빌드 자동화
├── _config.yml            ← Jekyll 설정 (GitHub Pages)
└── .gitignore             ← Git 제외 규칙
```

**원칙**: 루트는 **프로젝트 설정만** 유지

---

## 주요 디렉토리

### 📄 docs/ - 모든 문서
```
docs/
├── README.md              (420개 이상의 마크다운 파일)
├── ARCHITECTURE.md
├── API_REFERENCE.md
├── DEPLOYMENT.md
└── ... (완전한 문서화)
```

### 💻 src/ - 소스 코드
```
src/
├── parser.js              (파서)
├── indexer.js             (인덱싱 엔진)
├── search-api.js          (REST API)
├── bundler.js             (번들러)
├── cli.js                 (CLI 도구)
├── css-compiler.js        (CSS 컴파일러)
├── js-compiler.js         (JS 생성기)
└── html-generator.js      (HTML 생성기)
```

### 📦 examples/ - 사용 예제
```
examples/
├── button.free            (기본 버튼)
├── card.free              (카드 컴포넌트)
└── list.free              (리스트 컴포넌트)
```

### 🧪 tests/ - 테스트 파일
```
tests/
├── test-phase1.js
├── test-parser.js
├── test-bundler.js
└── ... (모든 테스트)
```

### ⚙️ config/ - 설정 파일
```
config/
├── nginx.conf
├── docker-compose.yml
├── prometheus.yml
├── postgres-init.sql
└── schema.sql
```

### 🔧 scripts/ - 빌드/배포 스크립트
```
scripts/
├── build-freelang.sh
├── deploy-freelang.sh
├── setup-freelang.sh
└── ... (모든 스크립트)
```

### backend/, frontend/, stdlib/ - 프로젝트 모듈
```
backend/
├── api.js
├── db.js
├── handlers.js
└── server.js

frontend/
├── components/
├── pages/
└── styles/

stdlib/
├── core/
├── ffi/
└── modules/
```

---

## 🎯 정리 규칙

| 파일 타입 | 위치 | 규칙 |
|---------|------|------|
| **README, 문서** | `docs/` | `.md` 확장자 모두 |
| **소스 코드** | `src/`, 프로젝트 폴더 | `.js`, `.ts`, `.free` |
| **테스트** | `tests/` | `test-*.js`, `test-*.ts` |
| **설정** | `config/` | `.yml`, `.sql`, `.conf` |
| **스크립트** | `scripts/` | `.sh` 파일 |
| **예제** | `examples/` | `.free`, `.fl` |
| **DB 파일** | `.gitignore` | `*.db` 제외 |
| **로그** | `.gitignore` | `*.log`, `*.txt` 제외 |

---

## 📊 정리 전후 비교

| 항목 | 정리 전 | 정리 후 | 개선율 |
|------|--------|--------|--------|
| 루트 파일 | 260+ | ~15 | 94% ↓ |
| MD 파일 | 루트 분산 | docs/ 통합 | 100% |
| 저장소 크기 | 43MB | ~5MB | 88% ↓ |
| 구조 명확성 | 낮음 | 높음 | ✅ |

---

## 🚀 개발 워크플로우

```bash
# 개발
npm install
npm run build
npm test

# 배포
bash scripts/deploy-freelang.sh

# 문서 확인
cat docs/README.md
```

---

**마지막 업데이트**: 2026-03-13

---

## ✅ 최종 확인 (2026-03-13)

GitHub 캐시 새로고침 테스트 커밋
