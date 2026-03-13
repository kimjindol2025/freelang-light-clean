# 🚀 FreeLang HTTP Server

**100% FreeLang으로 구현된 독립 실행형 HTTP 서버**

- ❌ Node.js 불필요
- ❌ TypeScript 불필요  
- ❌ npm 패키지 불필요
- ✅ FreeLang 표준 라이브러리만 사용

## 빠른 시작

### 빌드
```bash
freelang compile freelang/main.free -o bin/freelang-server
```

### 실행
```bash
./bin/freelang-server
```

또는 직접 실행:
```bash
freelang run freelang/main.free
```

서버가 포트 **5020**에서 시작됩니다.

## API 테스트

### Counter (카운터)
```bash
# 현재 값 조회
curl http://localhost:5020/api/counter

# 1 증가
curl -X POST http://localhost:5020/api/counter/increment

# 1 감소
curl -X POST http://localhost:5020/api/counter/decrement

# 0으로 리셋
curl -X POST http://localhost:5020/api/counter/reset
```

### Blog (블로그)
```bash
# 발행된 블로그 조회
curl http://localhost:5020/api/blogs

# 모든 블로그 조회 (초안 포함)
curl http://localhost:5020/api/blogs/all

# 새 블로그 생성
curl -X POST http://localhost:5020/api/blogs \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Blog",
    "slug": "my-first-blog",
    "content": "Blog content here",
    "summary": "Brief summary",
    "author": "John Doe",
    "category": "Technology",
    "tags": ["freelang", "http"]
  }'

# 블로그 수정
curl -X PUT http://localhost:5020/api/blogs/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Blog",
    "content": "Updated content"
  }'

# 블로그 발행
curl -X POST http://localhost:5020/api/blogs/1/publish

# 블로그 삭제
curl -X DELETE http://localhost:5020/api/blogs/1
```

### Health Check (상태 확인)
```bash
curl http://localhost:5020/api/health
```

## 웹 UI

- **홈페이지**: http://localhost:5020
  - 카운터 데모 (증가, 감소, 리셋)

- **블로그 페이지**: http://localhost:5020/blog.html
  - 발행된 블로그 목록 조회

## 아키텍처

자세한 설명은 [ARCHITECTURE.md](ARCHITECTURE.md)를 참조하세요.

```
HTTP 요청
    ↓
TCP Socket (engine/tcp_socket.fl)
    ↓
HTTP Parser (engine/http_parser.fl)
    ↓
Request Handler (server/http-engine.free)
    ↓
Business Logic (core/state.free)
    ↓
Database (db/storage.free)
    ↓
HTTP Response
    ↓
TCP Socket
```

## 파일 구조

```
freelang/
├── main.free              # 진입점
├── ARCHITECTURE.md        # 아키텍처 설명서
├── README.md             # 이 파일
│
├── core/
│   ├── types.free         # 데이터 타입 정의
│   └── state.free         # 비즈니스 로직 (CRUD)
│
├── db/
│   └── storage.free       # 데이터베이스 관리
│
├── server/
│   └── http-engine.free   # HTTP 라우팅
│
└── engine/                # HTTP 서버 엔진
    ├── tcp_socket.fl      # TCP 소켓
    ├── http_parser.fl     # HTTP 파싱
    ├── http_handler.fl    # HTTP 응답
    ├── server.fl          # 메인 루프
    └── mod.fl             # 공개 API
```

## 주요 기능

### ✅ HTTP/1.1 지원
- GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH
- Keep-Alive (최대 100 요청/연결)
- 청크 전송 인코딩
- Content-Length 자동 계산

### ✅ CORS 지원
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

### ✅ JSON API
- 요청 본문 JSON 파싱
- 응답을 자동 JSON 직렬화
- 에러 응답 표준화

### ✅ URL 라우팅
- 정확한 경로 매칭 (`/api/counter`)
- 와일드카드 매칭 (`/api/blogs/:id`)
- 쿼리스트링 지원

### ✅ 데이터 영속성
- JSON 파일 저장소 (`data/db.json`)
- 자동 백업 (`data/db.backup.json`)
- 트랜잭션 안정성

## 성능

- **지연시간**: <5ms (로컬)
- **처리량**: ~1000 req/s (간단한 요청)
- **메모리 사용량**: ~10MB
- **바이너리 크기**: ~2MB

## 라이센스

MIT License

## 기여

버그 리포트와 기여는 환영합니다!

---

**Made with ❤️ in FreeLang**
