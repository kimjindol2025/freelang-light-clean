#!/bin/bash

# ============================================================================
# FreeLang 배포 스크립트
# 로컬에서 빌드 후 원격 서버에 배포
# ============================================================================

set -e

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 기본값
TARGET_HOST="${1:-}"
BUILD_TYPE="${2:-native}"  # native 또는 release
TARGET_PORT="${3:-5020}"   # 배포 포트 (기본: 5020)

# ──────────────────────────────────────────────────────────────────────────
# 도움말
# ──────────────────────────────────────────────────────────────────────────

if [ -z "$TARGET_HOST" ]; then
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}FreeLang 배포 스크립트${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
    echo "사용법:"
    echo "  ./deploy.sh <user@host> [build-type] [port]"
    echo ""
    echo "예시:"
    echo "  ./deploy.sh user@192.168.1.100"
    echo "  ./deploy.sh ubuntu@api.example.com native 5020"
    echo "  ./deploy.sh user@server.com native 8080"
    echo ""
    echo "기본값:"
    echo "  build-type: native"
    echo "  port: 5020"
    echo ""
    exit 1
fi

# ──────────────────────────────────────────────────────────────────────────
# 1단계: 로컬 빌드
# ──────────────────────────────────────────────────────────────────────────

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📦 Step 1/6: 로컬 빌드${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

if [ ! -f "Makefile" ]; then
    echo -e "${RED}❌ 에러: Makefile을 찾을 수 없습니다${NC}"
    echo "   현재 디렉토리: $(pwd)"
    exit 1
fi

echo -e "${YELLOW}🔍 환경 확인...${NC}"
which freelang > /dev/null || { echo -e "${RED}❌ FreeLang 컴파일러 없음${NC}"; exit 1; }
echo -e "${GREEN}✓ FreeLang 컴파일러 확인${NC}"
echo ""

echo "빌드 설정:"
echo "  • 유형: $BUILD_TYPE"
echo "  • 포트: $TARGET_PORT"
echo "  • 대상: $TARGET_HOST"
echo ""

# 빌드 실행
if [ "$BUILD_TYPE" = "native" ]; then
    echo -e "${YELLOW}⚡ 최적화 빌드 중 (LTO + -O3)...${NC}"
    echo "  (이 과정은 1-2분 소요될 수 있습니다)"
    echo ""
    make native 2>&1 | grep -E "^(make|✅|❌)" || make native
else
    echo -e "${YELLOW}📦 기본 빌드 중...${NC}"
    make build
fi

# 바이너리 확인
if [ ! -f "bin/freelang-server" ]; then
    echo -e "${RED}❌ 빌드 실패: bin/freelang-server를 찾을 수 없습니다${NC}"
    exit 1
fi

BINARY_SIZE=$(du -h bin/freelang-server | cut -f1)
echo -e "${GREEN}✅ 빌드 완료!${NC}"
echo "   파일: $(pwd)/bin/freelang-server"
echo "   크기: $BINARY_SIZE"
echo ""

# ──────────────────────────────────────────────────────────────────────────
# 2단계: 서버로 전송
# ──────────────────────────────────────────────────────────────────────────

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📤 Step 2/6: 서버로 전송${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

TARGET_DIR="freelang-hybrid"

echo "배포 대상:"
echo "  • 호스트: $TARGET_HOST"
echo "  • 디렉토리: ~/$TARGET_DIR"
echo "  • 바이너리: bin/freelang-server ($BINARY_SIZE)"
echo ""

# SSH 연결 확인
echo -e "${YELLOW}🔍 SSH 연결 확인 중...${NC}"
if ! ssh -o ConnectTimeout=5 "$TARGET_HOST" "echo 'OK'" > /dev/null 2>&1; then
    echo -e "${RED}❌ SSH 연결 실패${NC}"
    echo ""
    echo "확인 항목:"
    echo "  1️⃣  호스트명/IP 확인: $TARGET_HOST"
    echo "  2️⃣  SSH 키 설정 확인"
    echo "  3️⃣  방화벽 SSH(22) 개방 확인"
    echo "  4️⃣  서버 전원 확인"
    echo ""
    exit 1
fi
echo -e "${GREEN}✅ SSH 연결 성공${NC}"
echo ""

# 바이너리 전송
echo -e "${YELLOW}📤 바이너리 전송 중 (약 30초)...${NC}"
if scp -v bin/freelang-server "$TARGET_HOST:~/" 2>&1 | grep -q "freelang-server"; then
    echo -e "${GREEN}✅ 전송 완료 ($BINARY_SIZE)${NC}"
else
    echo -e "${RED}❌ 전송 실패${NC}"
    exit 1
fi
echo ""

# ──────────────────────────────────────────────────────────────────────────
# 3단계: 서버 준비
# ──────────────────────────────────────────────────────────────────────────

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🔧 Step 3/6: 서버 준비${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}⚙️  서버 초기화 중...${NC}"

ssh "$TARGET_HOST" << 'REMOTE_COMMANDS'
    set -e

    echo "  📁 디렉토리 생성..."
    mkdir -p ~/freelang-hybrid/data
    mkdir -p ~/freelang-hybrid/backups
    mkdir -p ~/freelang-hybrid/bin

    echo "  📝 바이너리 이동..."
    mv ~/freelang-server ~/freelang-hybrid/bin/ 2>/dev/null || true

    echo "  🔐 권한 설정..."
    chmod +x ~/freelang-hybrid/bin/freelang-server

    echo "  🛑 기존 프로세스 중지..."
    pkill -f "bin/freelang-server" || true
    sleep 2

    echo "  ✅ 완료"
REMOTE_COMMANDS

echo ""
echo -e "${GREEN}✅ 서버 준비 완료${NC}"
echo ""

# ──────────────────────────────────────────────────────────────────────────
# 4단계: 서버 시작
# ──────────────────────────────────────────────────────────────────────────

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🚀 Step 4/6: 서버 시작${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}📋 시작 방식 선택:${NC}"
echo ""
echo "  1️⃣  PM2로 시작"
echo "     • 자동 재시작"
echo "     • 모니터링 대시보드"
echo "     • 시스템 부팅 시 자동 실행"
echo ""
echo "  2️⃣  systemd로 시작"
echo "     • 시스템 서비스"
echo "     • OS 레벨 관리"
echo "     • 자동 재시작 (설정 가능)"
echo ""
echo "  3️⃣  직접 실행"
echo "     • 포그라운드 실행"
echo "     • 실시간 로그 확인"
echo "     • 개발/테스트용"
echo ""
read -p "선택 (1-3, 기본: 1): " START_OPTION
START_OPTION=${START_OPTION:-1}

case $START_OPTION in
    1)
        echo ""
        echo -e "${YELLOW}⚙️  PM2 초기화 중...${NC}"
        ssh "$TARGET_HOST" << 'PM2_START'
            cd ~/freelang-hybrid

            echo "  📦 PM2 설치 확인..."
            which pm2 > /dev/null || npm install -g pm2

            echo "  🛑 기존 프로세스 정리..."
            pm2 delete freelang || true

            echo "  🚀 FreeLang 시작..."
            pm2 start bin/freelang-server \
                --name "freelang" \
                --watch \
                --max-memory-restart "500M" \
                --log-date-format "YYYY-MM-DD HH:mm:ss Z"

            echo "  💾 설정 저장..."
            pm2 save
            pm2 startup

            echo ""
            echo "✅ PM2 상태:"
            pm2 status

            echo ""
            echo "📜 최근 로그 (10줄):"
            pm2 logs freelang --lines 10
PM2_START
        echo ""
        echo -e "${GREEN}✅ PM2 시작 완료${NC}"
        ;;
    2)
        echo ""
        echo -e "${YELLOW}⚙️  systemd 설정 중...${NC}"
        ssh "$TARGET_HOST" << 'SYSTEMD_START'
            cd ~/freelang-hybrid

            echo "  📝 서비스 파일 생성..."
            sudo tee /etc/systemd/system/freelang.service > /dev/null << 'EOF'
[Unit]
Description=FreeLang Standalone Web Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/home/$USER/freelang-hybrid
ExecStart=/home/$USER/freelang-hybrid/bin/freelang-server
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

            echo "  🔄 systemd 재로드..."
            sudo systemctl daemon-reload

            echo "  ⚡ 서비스 활성화..."
            sudo systemctl enable freelang

            echo "  🚀 서비스 시작..."
            sudo systemctl start freelang

            echo ""
            echo "✅ systemd 상태:"
            sudo systemctl status freelang

            echo ""
            echo "📜 최근 로그:"
            journalctl -u freelang -n 20 -f
SYSTEMD_START
        echo ""
        echo -e "${GREEN}✅ systemd 시작 완료${NC}"
        ;;
    3)
        echo ""
        echo -e "${YELLOW}⚙️  직접 실행 중...${NC}"
        ssh "$TARGET_HOST" << 'DIRECT_START'
            cd ~/freelang-hybrid
            echo ""
            echo "🚀 FreeLang 서버를 시작합니다..."
            echo "   포트: 5020"
            echo "   주소: 0.0.0.0"
            echo "   (Ctrl+C로 중지)"
            echo ""
            ./bin/freelang-server
DIRECT_START
        ;;
    *)
        echo ""
        echo -e "${RED}❌ 잘못된 선택${NC}"
        exit 1
        ;;
esac

# ──────────────────────────────────────────────────────────────────────────
# 5단계: 배포 완료
# ──────────────────────────────────────────────────────────────────────────

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 Step 5/6: 배포 완료!${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${GREEN}✅ 배포 정보:${NC}"
echo ""
echo "  📍 호스트:"
echo "     $TARGET_HOST"
echo ""
echo "  🔌 포트:"
echo "     $TARGET_PORT"
echo ""
echo "  📁 배포 경로:"
echo "     ~/freelang-hybrid"
echo ""
echo "  📦 바이너리:"
echo "     bin/freelang-server ($BINARY_SIZE)"
echo ""

echo -e "${YELLOW}🔗 접속 방법:${NC}"
echo ""
echo "  🏠 홈페이지:"
echo "     http://$TARGET_HOST:$TARGET_PORT"
echo ""
echo "  💻 API 헬스 체크:"
echo "     http://$TARGET_HOST:$TARGET_PORT/api/health"
echo ""
echo "  📝 블로그:"
echo "     http://$TARGET_HOST:$TARGET_PORT/blog.html"
echo ""
echo "  🎮 데모 (Counter):"
echo "     http://$TARGET_HOST:$TARGET_PORT/index.html"
echo ""

echo -e "${BLUE}📝 서버 관리 명령어:${NC}"
echo ""
echo "  로그 확인:"
echo "    ssh $TARGET_HOST \"pm2 logs freelang\""
echo ""
echo "  상태 확인:"
echo "    ssh $TARGET_HOST \"pm2 status\""
echo ""
echo "  서버 중지:"
echo "    ssh $TARGET_HOST \"pm2 stop freelang\""
echo ""
echo "  서버 재시작:"
echo "    ssh $TARGET_HOST \"pm2 restart freelang\""
echo ""

# ──────────────────────────────────────────────────────────────────────────
# 6단계: 헬스 체크
# ──────────────────────────────────────────────────────────────────────────

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🔍 Step 6/6: 헬스 체크${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}⏳ 서버 시작 대기 중 (3초)...${NC}"
sleep 3

if command -v curl > /dev/null; then
    # 서버 호스트/IP 추출
    SERVER_ADDR=$(echo "$TARGET_HOST" | cut -d@ -f2)

    echo -e "${YELLOW}🔍 API 헬스 체크:${NC}"
    echo "   URL: http://$SERVER_ADDR:$TARGET_PORT/api/health"
    echo ""

    HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "http://$SERVER_ADDR:$TARGET_PORT/api/health" 2>/dev/null)
    HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
    HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

    if [ "$HTTP_CODE" = "200" ] && echo "$HEALTH_BODY" | grep -q "healthy"; then
        echo -e "${GREEN}✅ 서버가 정상적으로 실행 중입니다!${NC}"
        echo ""
        echo -e "${GREEN}응답 상태:${NC}"
        echo "   HTTP Code: 200 OK"
        echo "   Status: healthy"
        echo ""
        echo -e "${GREEN}🎉 배포 완료! 모든 검사를 통과했습니다!${NC}"
    elif [ "$HTTP_CODE" = "200" ]; then
        echo -e "${YELLOW}⚠️  서버가 응답합니다 (HTTP 200)${NC}"
        echo ""
        echo "응답 내용:"
        echo "$HEALTH_BODY" | head -c 200
        echo ""
        echo ""
        echo -e "${YELLOW}💡 팁: 서버가 시작 중일 수 있습니다.${NC}"
        echo "   나중에 다시 확인해주세요: http://$SERVER_ADDR:$TARGET_PORT/api/health"
    elif [ "$HTTP_CODE" = "000" ]; then
        echo -e "${YELLOW}⚠️  서버에 연결할 수 없습니다${NC}"
        echo ""
        echo "원인:"
        echo "  1. 서버가 아직 시작 중 (대기 중)"
        echo "  2. 방화벽이 포트를 차단함"
        echo "  3. SSH 접속 후 서버 프로세스 확인 필요"
        echo ""
        echo "확인 방법:"
        echo "  ssh $TARGET_HOST \"ps aux | grep freelang-server\""
        echo "  ssh $TARGET_HOST \"lsof -i :$TARGET_PORT\""
    else
        echo -e "${YELLOW}⚠️  예상치 못한 응답 (HTTP $HTTP_CODE)${NC}"
        echo ""
        echo "응답:"
        echo "$HEALTH_BODY" | head -c 200
    fi
else
    echo -e "${YELLOW}⚠️  curl이 없어서 자동 헬스 체크를 건너뜁니다${NC}"
    echo ""
    echo "수동 확인 방법:"
    echo "  ssh $TARGET_HOST \"curl http://127.0.0.1:$TARGET_PORT/api/health\""
    echo ""
    echo "또는 브라우저에서:"
    SERVER_ADDR=$(echo "$TARGET_HOST" | cut -d@ -f2)
    echo "  http://$SERVER_ADDR:$TARGET_PORT"
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}📊 배포 프로세스 완료!${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""
