#!/bin/bash

# ============================================
# FreeLang Light 자동 설정 스크립트
# ============================================
# 사용법: bash setup.sh

set -e  # 오류 발생 시 종료

echo "🚀 FreeLang Light 초기 설정 시작..."

# ============================================
# 1. 필수 디렉토리 생성
# ============================================
echo "📁 디렉토리 생성 중..."

mkdir -p logs
mkdir -p data/uploads
mkdir -p data/backups
mkdir -p data/cache
mkdir -p config/ssl
mkdir -p scripts/hooks

# ============================================
# 2. 권한 설정
# ============================================
echo "🔐 권한 설정 중..."

chmod 755 scripts/*.sh
chmod 755 setup.sh
chmod 700 config/ssl          # SSL 인증서는 접근 제한
chmod 700 data/backups        # 백업 데이터는 접근 제한
chmod 755 logs

# ============================================
# 3. 환경 변수 파일 확인
# ============================================
echo "⚙️  환경 변수 설정 확인 중..."

if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    echo "⚠️  .env 파일이 없습니다. .env.example을 복사합니다..."
    cp .env.example .env
    echo "📝 .env 파일을 수정해주세요:"
    echo "   vi .env"
  else
    echo "❌ .env.example 파일을 찾을 수 없습니다."
    exit 1
  fi
else
  echo "✅ .env 파일 발견"
fi

# ============================================
# 4. Node.js 의존성 설치
# ============================================
echo "📦 Node.js 의존성 설치 중..."

if command -v npm &> /dev/null; then
  npm install
  echo "✅ npm 의존성 설치 완료"
else
  echo "❌ npm을 찾을 수 없습니다. Node.js를 설치하세요."
  exit 1
fi

# ============================================
# 5. 데이터베이스 초기화 (선택)
# ============================================
echo ""
echo "🗄️  데이터베이스 초기화 (선택사항)"
read -p "데이터베이스를 초기화하시겠습니까? (y/n): " db_init

if [ "$db_init" = "y" ]; then
  echo "🔄 데이터베이스 초기화 중..."

  # Docker로 PostgreSQL 실행 중인지 확인
  if docker ps | grep -q "postgres"; then
    docker exec -i freelang-postgres psql -U freelang_user -d freelang_light < config/schema.sql
    echo "✅ 데이터베이스 초기화 완료"
  else
    echo "⚠️  PostgreSQL 컨테이너를 찾을 수 없습니다."
    echo "   docker-compose up -d 를 먼저 실행하세요."
  fi
fi

# ============================================
# 6. SSL 인증서 생성 (개발 전용)
# ============================================
echo ""
echo "🔒 SSL 인증서 생성 (개발 전용)"
read -p "자체 서명 SSL 인증서를 생성하시겠습니까? (y/n): " ssl_gen

if [ "$ssl_gen" = "y" ]; then
  if command -v openssl &> /dev/null; then
    echo "🔑 SSL 인증서 생성 중..."
    openssl req -x509 -newkey rsa:4096 -keyout config/ssl/key.pem -out config/ssl/cert.pem -days 365 -nodes -subj "/CN=localhost"
    chmod 600 config/ssl/key.pem
    chmod 644 config/ssl/cert.pem
    echo "✅ SSL 인증서 생성 완료"
  else
    echo "❌ openssl을 찾을 수 없습니다."
  fi
fi

# ============================================
# 7. Git Hooks 설정
# ============================================
echo ""
echo "🪝 Git Hooks 설정 중..."

if [ -d .git ]; then
  # Pre-commit hook
  cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
echo "🔍 Pre-commit 검사 중..."
npm run lint
npm run test
EOF
  chmod +x .git/hooks/pre-commit
  echo "✅ Git Hooks 설정 완료"
fi

# ============================================
# 8. Docker 설정 확인
# ============================================
echo ""
echo "🐳 Docker 설정 확인 중..."

if command -v docker-compose &> /dev/null || command -v docker &> /dev/null; then
  echo "✅ Docker 설치됨"
  echo ""
  echo "📌 다음 명령어로 서비스를 시작하세요:"
  echo "   docker-compose up -d"
else
  echo "⚠️  Docker를 찾을 수 없습니다."
  echo "   https://docs.docker.com/get-docker/ 에서 설치하세요."
fi

# ============================================
# 9. 최종 확인
# ============================================
echo ""
echo "✅ 초기 설정 완료!"
echo ""
echo "📋 다음 단계:"
echo "  1. .env 파일 수정: vi .env"
echo "  2. Docker 서비스 시작: docker-compose up -d"
echo "  3. 헬스 체크: curl http://localhost:4002/health"
echo "  4. 개발 서버 시작: npm run dev"
echo ""
echo "📚 더 자세한 정보:"
echo "  - 문서: cat docs/README.md"
echo "  - API: cat docs/API_REFERENCE.md"
echo "  - 배포: cat docs/DEPLOYMENT.md"
