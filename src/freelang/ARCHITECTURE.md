# 🚀 FreeLang HTTP Engine Architecture

## 프로젝트 구조

```
freelang/
├── main.free              # 진입점 (HTTP 서버 시작)
├── ARCHITECTURE.md        # 이 파일
│
├── core/
│   ├── types.free         # 타입 정의 (Counter, Blog, Todo, Event)
│   └── state.free         # 상태 관리 (CRUD 함수)
│
├── db/
│   └── storage.free       # 데이터베이스 관리 (JSON 파일 I/O)
│
├── server/
│   └── http-engine.free   # HTTP 요청 핸들러 (REST API 라우팅)
│
└── engine/                # HTTP 서버 엔진 (저수준 구현)
    ├── tcp_socket.fl      # TCP 소켓 관리 (socket, bind, listen, accept)
    ├── http_parser.fl     # HTTP/1.1 파싱 (Request → struct)
    ├── http_handler.fl    # HTTP 응답 생성 (Response → bytes)
    ├── server.fl          # 메인 서버 루프 (Keep-Alive, 멀티 요청)
    └── mod.fl             # 공개 API (export)
```

## 데이터 흐름

```
클라이언트 요청 (TCP)
        ↓
tcp_socket.accept()
        ↓
http_parser.parse_request(raw_bytes)
        ↓
HttpRequest { method, path, headers, body }
        ↓
http-engine.handleEngineRequest()
        ↓
state.free 비즈니스 로직
        ↓
JSON 응답
        ↓
http_handler.build_response()
        ↓
tcp_socket.write(bytes)
        ↓
클라이언트 응답 (TCP)
```

## 타입 정의

### Counter
```
record Counter {
  id: string
  count: number
  name: string
  createdAt: string
  updatedAt: string
}
```

### Blog
```
record Blog {
  id: number
  title: string
  slug: string
  content: string
  summary: string
  status: BlogStatus (DRAFT, PUBLISHED, ARCHIVED)
  author: string
  category: string
  tags: array<string>
  viewCount: number
  likeCount: number
  createdAt: string
  updatedAt: string
  publishedAt: string?
}
```

### Todo
```
record Todo {
  id: number
  text: string
  done: bool
  priority: Priority (LOW, MEDIUM, HIGH)
  tags: array<string>
  createdAt: string
  updatedAt: string
}
```

## REST API 엔드포인트

### Counter API
- `GET /api/counter` → 현재 카운트 조회
- `POST /api/counter/increment` → 1 증가
- `POST /api/counter/decrement` → 1 감소
- `POST /api/counter/reset` → 0으로 리셋

### Blog API
- `GET /api/blogs` → 발행된 블로그만 (PUBLISHED)
- `GET /api/blogs/all` → 모든 블로그
- `POST /api/blogs` → 새 블로그 생성 (DRAFT)
- `PUT /api/blogs/:id` → 블로그 수정
- `DELETE /api/blogs/:id` → 블로그 삭제
- `POST /api/blogs/:id/publish` → 발행 (DRAFT → PUBLISHED)

### 기타
- `GET /api/health` → 시스템 상태 확인
- `GET /` → 카운터 데모 HTML
- `GET /blog.html` → 블로그 목록 HTML

## HTTP 엔진 특징

✅ TCP 기반 HTTP/1.1 서버
✅ Keep-Alive 지원 (최대 100 요청/연결)
✅ CORS 헤더 지원
✅ JSON 요청/응답
✅ 상태 코드 (200, 201, 204, 404)
✅ URL 경로 파싱 (/api/blogs/:id)

## 의존성

❌ Node.js
❌ TypeScript
❌ npm 패키지
✅ FreeLang 표준 라이브러리만 사용

## 빌드 & 실행

```bash
# 컴파일
freelang compile freelang/main.free -o bin/freelang-server

# 실행
./bin/freelang-server

# 또는 직접 실행
freelang run freelang/main.free
```

## 포트

- **5020**: HTTP 서버 기본 포트
- 바인드 주소: `0.0.0.0` (모든 인터페이스)

## 테스트

```bash
# Counter 테스트
curl http://localhost:5020/api/counter
curl -X POST http://localhost:5020/api/counter/increment

# Blog 테스트
curl http://localhost:5020/api/blogs
curl -X POST http://localhost:5020/api/blogs \
  -H "Content-Type: application/json" \
  -d '{"title":"My Blog","slug":"my-blog",...}'

# Health Check
curl http://localhost:5020/api/health

# 웹 UI
open http://localhost:5020
open http://localhost:5020/blog.html
```

---

**100% FreeLang 독립 실행형 HTTP 서버**
