#!/bin/bash
# FreeLang Hybrid - Docker Entrypoint Script
# ===========================================
# 컨테이너 시작시 초기화 및 헬스 체크를 수행합니다.

set -e

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}═════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  🚀 FreeLang Hybrid Docker Entry Point${NC}"
echo -e "${BLUE}═════════════════════════════════════════════════${NC}"

# 환경 확인
echo ""
echo -e "${YELLOW}📋 환경 설정:${NC}"
echo "  • Node: $(node --version)"
echo "  • npm: $(npm --version)"
echo "  • PORT: ${PORT:-3001}"
echo "  • WEB_PORT: ${WEB_PORT:-3000}"
echo "  • NODE_ENV: ${NODE_ENV:-production}"
echo "  • User: $(whoami)"

# 데이터 디렉토리 확인 및 생성
echo ""
echo -e "${YELLOW}💾 데이터 디렉토리 확인 중...${NC}"
if [ ! -d "/app/data" ]; then
    echo "  • /app/data 디렉토리 생성"
    mkdir -p /app/data
fi

# DB 파일 초기화
if [ ! -f "/app/data/db.json" ]; then
    echo "  • 새 데이터베이스 초기화"
    cat > /app/data/db.json << 'EOF'
{
  "counter": {
    "id": "main",
    "count": 0,
    "name": "Main Counter",
    "createdAt": "2026-03-12T00:00:00Z",
    "updatedAt": "2026-03-12T00:00:00Z"
  },
  "todos": [],
  "metadata": {
    "version": "1.0",
    "created": "2026-03-12T00:00:00Z"
  }
}
EOF
    echo "  • 초기 데이터 생성 완료"
else
    echo "  • 기존 데이터베이스 로드"
fi

# 정적 파일 확인
echo ""
echo -e "${YELLOW}📁 정적 파일 확인 중...${NC}"
if [ ! -d "/app/static" ]; then
    echo -e "  ${RED}✗ 정적 파일 디렉토리 없음${NC}"
    echo "    예상 위치: /app/static"
else
    FILE_COUNT=$(find /app/static -type f | wc -l)
    echo -e "  ${GREEN}✓ 정적 파일 발견: $FILE_COUNT 개${NC}"
fi

# 백엔드 파일 확인
echo ""
echo -e "${YELLOW}🔧 백엔드 파일 확인 중...${NC}"
if [ -f "/app/backend/server.js" ]; then
    echo -e "  ${GREEN}✓ server.js 발견${NC}"
else
    echo -e "  ${RED}✗ server.js 없음${NC}"
    exit 1
fi

# npm 의존성 확인
if [ -d "/app/node_modules" ]; then
    MODULES_COUNT=$(ls -1 /app/node_modules | wc -l)
    echo -e "  ${GREEN}✓ npm 모듈: $MODULES_COUNT 개${NC}"
else
    echo -e "  ${YELLOW}⚠ npm 모듈 설치 필요${NC}"
    echo "  • npm install 실행 중..."
    cd /app
    npm install --production
fi

# 준비 완료
echo ""
echo -e "${GREEN}✅ 준비 완료!${NC}"
echo ""
echo -e "${BLUE}═════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  서비스 시작 중...${NC}"
echo -e "${BLUE}═════════════════════════════════════════════════${NC}"
echo ""
echo "  📍 API Server: http://0.0.0.0:${PORT:-3001}"
echo "  📍 Web Server: http://0.0.0.0:${WEB_PORT:-3000}"
echo ""
echo "  엔드포인트:"
echo "    • 홈: http://localhost:3000"
echo "    • 블로그: http://localhost:3000/blog.html"
echo "    • API Docs: http://localhost:3001/api/docs"
echo ""
echo -e "${BLUE}═════════════════════════════════════════════════${NC}"
echo ""

# 신호 처리
trap 'echo "Shutting down..."; exit 0' SIGINT SIGTERM

# 메인 프로세스 실행
exec "$@"
