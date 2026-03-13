#!/bin/bash

# ============================================================================
# FreeLang 3-서버 실행 스크립트 (정식 모듈)
# 컴파일된 바이너리 또는 FreeLang 런타임으로 실행
# ============================================================================

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVERS_DIR="$ROOT_DIR/freelang/servers"
BUILD_DIR="$ROOT_DIR/.build/servers"

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  🚀 FreeLang 3-서버 실행 (정식 모듈)                    ║"
echo "║     npm 의존성 0 · 순수 FreeLang                        ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# 먼저 빌드 시도
if [ ! -d "$BUILD_DIR" ]; then
    echo "🔨 서버 빌드 중..."
    bash "$ROOT_DIR/build-servers.sh"
fi

echo ""
echo "🎯 서버 시작 중..."
echo ""

# 권한 설정
chmod +x "$BUILD_DIR"/* 2>/dev/null || true

# FreeLang 런타임 확인
if command -v freelang &> /dev/null; then
    RUNTIME="freelang"
elif command -v freec &> /dev/null; then
    RUNTIME="freec"
else
    echo "⚠️  FreeLang 런타임 미설치"
    echo "설치: https://freelang-lang.org"
    echo ""
    echo "또는 Python 기반 대체 서버 실행:"
    echo "  bash $ROOT_DIR/start-all-servers.sh"
    exit 1
fi

echo "✅ FreeLang 런타임 감지됨: $RUNTIME"
echo ""

# 백그라운드에서 3개 서버 시작
echo "📍 포트 가용성 확인..."
for port in 8000 8001 9000; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "❌ 포트 $port 이미 사용 중"
        exit 1
    fi
done
echo "✅ 포트 8000, 8001, 9000 가용"
echo ""

# HTTP 서버 시작
echo "1️⃣  HTTP 서버 시작..."
if [ -f "$BUILD_DIR/http-server" ]; then
    "$BUILD_DIR/http-server" &
    HTTP_PID=$!
else
    # 빌드된 바이너리 없으면 FreeLang 런타임으로 실행
    $RUNTIME "$SERVERS_DIR/http-main.free" &
    HTTP_PID=$!
fi
echo "   ✅ PID: $HTTP_PID"

sleep 1

# API 서버 시작
echo "2️⃣  API 서버 시작..."
if [ -f "$BUILD_DIR/api-server" ]; then
    "$BUILD_DIR/api-server" &
    API_PID=$!
else
    $RUNTIME "$SERVERS_DIR/api-main.free" &
    API_PID=$!
fi
echo "   ✅ PID: $API_PID"

sleep 1

# 프록시 서버 시작
echo "3️⃣  프록시 서버 시작..."
if [ -f "$BUILD_DIR/proxy-server" ]; then
    "$BUILD_DIR/proxy-server" &
    PROXY_PID=$!
else
    $RUNTIME "$SERVERS_DIR/proxy-main.free" &
    PROXY_PID=$!
fi
echo "   ✅ PID: $PROXY_PID"

sleep 2

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║            ✨ 모든 서버 준비 완료!                       ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

echo "🌐 접속 가능한 주소:"
echo "  1️⃣  HTTP:   http://localhost:8000/blog.html"
echo "  2️⃣  API:    http://localhost:8001/api/posts"
echo "  3️⃣  프록시: http://localhost:9000"
echo ""

echo "📊 실행 중인 프로세스:"
echo "  PID $HTTP_PID  - HTTP 서버 (정식 FreeLang 모듈)"
echo "  PID $API_PID   - API 서버 (정식 FreeLang 모듈)"
echo "  PID $PROXY_PID - 프록시 서버 (정식 FreeLang 모듈)"
echo ""

echo "📚 테스트 명령어:"
echo "  curl http://localhost:8000/blog.html"
echo "  curl http://localhost:8001/api/posts"
echo "  curl http://localhost:9000/api/posts"
echo ""

echo "🔧 서버 제어:"
echo "  kill $HTTP_PID  # HTTP 서버 중지"
echo "  kill $API_PID   # API 서버 중지"
echo "  kill $PROXY_PID # 프록시 서버 중지"
echo ""

echo "⌨️  Ctrl+C로 모든 서버 종료"
echo ""

# Ctrl+C 처리
cleanup() {
    echo ""
    echo "🛑 서버 종료 중..."
    kill $HTTP_PID 2>/dev/null || true
    kill $API_PID 2>/dev/null || true
    kill $PROXY_PID 2>/dev/null || true
    sleep 1
    echo "✅ 모든 서버 중지됨"
}

trap cleanup EXIT INT TERM

# 프로세스 대기
wait $HTTP_PID 2>/dev/null || true
