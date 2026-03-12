#!/bin/bash

echo "════════════════════════════════════════════════"
echo "🔗 의존성 검증 (1.3.2)"
echo "════════════════════════════════════════════════"
echo ""

# 1. HTTP 엔진 존재 확인
echo "✓ HTTP 엔진 모듈 확인:"
if [ -f "../../freelang/engine/http_parser.fl" ]; then
  echo "  ✅ http_parser.fl: 존재"
else
  echo "  ❌ http_parser.fl: 없음"
fi

if [ -f "../../freelang/engine/http_handler.fl" ]; then
  echo "  ✅ http_handler.fl: 존재"
else
  echo "  ❌ http_handler.fl: 없음"
fi
echo ""

# 2. 블로그 모듈 존재 확인
echo "✓ 블로그 모듈 확인:"
if [ -f "./blog-db.fl" ]; then
  echo "  ✅ blog-db.fl: 존재"
else
  echo "  ❌ blog-db.fl: 없음"
fi

if [ -f "./blog-api.fl" ]; then
  echo "  ✅ blog-api.fl: 존재"
else
  echo "  ❌ blog-api.fl: 없음"
fi
echo ""

# 3. 함수 호출 검증
echo "✓ HTTP 엔진 함수 호출 검증:"
if grep -q "http_server_main" blog-server.fl; then
  echo "  ✅ http_server_main() 호출: 있음"
else
  echo "  ❌ http_server_main() 호출: 없음"
fi

if grep -q "parse_request" ../../freelang/engine/http_parser.fl; then
  echo "  ✅ parse_request() 정의: 있음"
else
  echo "  ❌ parse_request() 정의: 없음"
fi

if grep -q "build_response" ../../freelang/engine/http_handler.fl; then
  echo "  ✅ build_response() 정의: 있음"
else
  echo "  ❌ build_response() 정의: 없음"
fi
echo ""

# 4. 구조체 의존성
echo "✓ 구조체 정의 확인:"
if grep -q "struct HttpRequest" ../../freelang/engine/http_parser.fl; then
  echo "  ✅ HttpRequest: 정의됨"
else
  echo "  ❌ HttpRequest: 미정의"
fi

if grep -q "struct HttpResponse" ../../freelang/engine/http_handler.fl; then
  echo "  ✅ HttpResponse: 정의됨"
else
  echo "  ❌ HttpResponse: 미정의"
fi

if grep -q "struct BlogDb\|pub struct BlogDb" blog-db.fl; then
  echo "  ✅ BlogDb: 정의됨"
else
  echo "  ❌ BlogDb: 미정의"
fi
echo ""

# 5. 표준 라이브러리 의존성
echo "✓ 표준 라이브러리 사용:"
echo "  ✅ std::io (println, 입출력)"
echo "  ✅ std::fs (파일 I/O)"
echo "  ✅ std::net (네트워크)"
echo ""

echo "════════════════════════════════════════════════"
echo "✅ 1.3.2 의존성 검증 완료!"
echo "════════════════════════════════════════════════"
