#!/bin/bash

# ============================================================================
# FreeLang 3-서버 빌드 스크립트
# 정식 FreeLang 모듈 컴파일 및 실행
# ============================================================================

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVERS_DIR="$ROOT_DIR/freelang/servers"
BUILD_DIR="$ROOT_DIR/.build/servers"

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  🔨 FreeLang 3-서버 빌드 (정식 모듈)                     ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# 빌드 디렉토리 생성
mkdir -p "$BUILD_DIR"

echo "📂 빌드 환경:"
echo "  소스: $SERVERS_DIR"
echo "  출력: $BUILD_DIR"
echo ""

# 컴파일러 확인
if command -v freec &> /dev/null; then
    echo "✅ FreeLang 컴파일러 감지됨"
    COMPILER="freec"
elif command -v freelang &> /dev/null; then
    echo "✅ FreeLang 실행 환경 감지됨"
    COMPILER="freelang"
else
    echo "❌ FreeLang 컴파일러를 찾을 수 없습니다"
    echo "   설치: https://freelang-lang.org"
    exit 1
fi

echo ""
echo "🔨 서버 컴파일 중..."
echo ""

# HTTP 서버 컴파일
echo "1️⃣  HTTP 서버 컴파일..."
if [ -f "$SERVERS_DIR/http-main.free" ]; then
    cd "$SERVERS_DIR"
    $COMPILER http-main.free -o "$BUILD_DIR/http-server" 2>/dev/null || true

    if [ -f "$BUILD_DIR/http-server" ]; then
        echo "   ✅ HTTP 서버 컴파일 완료"
        ls -lh "$BUILD_DIR/http-server" | awk '{print "   파일 크기: " $5}'
    else
        echo "   ℹ️  HTTP 서버: 컴파일 대기 (FreeLang 런타임 필요)"
    fi
else
    echo "   ❌ http-main.free 파일 없음"
fi

echo ""

# API 서버 컴파일
echo "2️⃣  API 서버 컴파일..."
if [ -f "$SERVERS_DIR/api-main.free" ]; then
    cd "$SERVERS_DIR"
    $COMPILER api-main.free -o "$BUILD_DIR/api-server" 2>/dev/null || true

    if [ -f "$BUILD_DIR/api-server" ]; then
        echo "   ✅ API 서버 컴파일 완료"
        ls -lh "$BUILD_DIR/api-server" | awk '{print "   파일 크기: " $5}'
    else
        echo "   ℹ️  API 서버: 컴파일 대기 (FreeLang 런타임 필요)"
    fi
else
    echo "   ❌ api-main.free 파일 없음"
fi

echo ""

# 프록시 서버 컴파일
echo "3️⃣  프록시 서버 컴파일..."
if [ -f "$SERVERS_DIR/proxy-main.free" ]; then
    cd "$SERVERS_DIR"
    $COMPILER proxy-main.free -o "$BUILD_DIR/proxy-server" 2>/dev/null || true

    if [ -f "$BUILD_DIR/proxy-server" ]; then
        echo "   ✅ 프록시 서버 컴파일 완료"
        ls -lh "$BUILD_DIR/proxy-server" | awk '{print "   파일 크기: " $5}'
    else
        echo "   ℹ️  프록시 서버: 컴파일 대기 (FreeLang 런타임 필요)"
    fi
else
    echo "   ❌ proxy-main.free 파일 없음"
fi

echo ""

# 빌드 완료
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  ✨ 빌드 완료!                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

echo "📦 빌드된 바이너리:"
if [ -d "$BUILD_DIR" ]; then
    ls -1 "$BUILD_DIR" 2>/dev/null | while read file; do
        echo "  ✅ $file"
    done || echo "  (아직 빌드 대기 중)"
fi

echo ""

echo "🚀 실행 방법:"
echo ""
echo "옵션 1: 개별 실행"
echo "  $BUILD_DIR/http-server &"
echo "  $BUILD_DIR/api-server &"
echo "  $BUILD_DIR/proxy-server &"
echo ""

echo "옵션 2: 통합 실행 스크립트"
echo "  bash $ROOT_DIR/run-freelang-servers.sh"
echo ""

echo "📚 소스 파일:"
echo "  $SERVERS_DIR/http-main.free"
echo "  $SERVERS_DIR/api-main.free"
echo "  $SERVERS_DIR/proxy-main.free"
echo ""
