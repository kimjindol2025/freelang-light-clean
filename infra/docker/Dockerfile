# FreeLang Hybrid - Docker Multi-stage Build
# ============================================
# 이 Dockerfile은 프로덕션 환경용 최적화된 이미지를 생성합니다.
#
# 사용법:
#   docker build -t freelang-hybrid:latest .
#   docker run -p 3000:3000 -p 3001:3001 freelang-hybrid:latest
#
# 다중 스테이지 빌드:
# 1. builder: FreeLang 컴파일러 + 소스 컴파일
# 2. runtime: 최종 실행 환경 (작은 이미지)

# ================== Stage 1: Builder ==================
FROM node:25-slim AS builder

LABEL maintainer="FreeLang Team <dev@freelang.io>"
LABEL description="FreeLang Hybrid Application Builder"

# 빌드 인자
ARG FREELANG_VERSION=2.8.0
ARG NODEJS_VERSION=25
ARG BUILD_DATE
ARG VCS_REF

# 메타데이터
LABEL org.opencontainers.image.created=$BUILD_DATE
LABEL org.opencontainers.image.version=$FREELANG_VERSION
LABEL org.opencontainers.image.revision=$VCS_REF
LABEL org.opencontainers.image.title="FreeLang Hybrid"
LABEL org.opencontainers.image.description="Self-hosting FreeLang web application"

# 작업 디렉토리
WORKDIR /build

# 시스템 의존성 설치
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    wget \
    build-essential \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# FreeLang 컴파일러 설치
# 참고: 실제 배포시 릴리스 바이너리에서 다운로드
ENV PATH="/usr/local/freelang/bin:${PATH}"

RUN echo "Installing FreeLang v${FREELANG_VERSION}..." && \
    mkdir -p /usr/local/freelang && \
    # 실제 릴리스에서는 아래 URL 사용:
    # curl -L https://releases.freelang.io/freelang-${FREELANG_VERSION}-linux-x64.tar.gz | \
    # tar -xz -C /usr/local/freelang
    echo "Note: FreeLang compiler would be installed here"

# 소스 코드 복사
COPY . .

# 프로덕션 의존성 설치 (npm)
RUN npm install --production --no-optional \
    && npm cache clean --force \
    && echo "✅ npm 의존성 설치 완료"

# 빌드 스크립트 실행
RUN echo "Building FreeLang backend..." && \
    # 실제 빌드:
    # make compile
    # 또는 직접 컴파일:
    # freelang compile freelang/backend/api.free --target javascript -o build/api-compiled.js
    mkdir -p build && \
    cp -r static build/ && \
    cp backend/*.js build/ && \
    echo "✅ 빌드 완료" && \
    ls -lh build/

# ================== Stage 2: Runtime ==================
FROM node:25-slim

# 메타데이터
LABEL maintainer="FreeLang Team"
LABEL version="1.0"
LABEL description="FreeLang Hybrid Runtime"

# 환경 변수
ENV NODE_ENV=production \
    PORT=3001 \
    WEB_PORT=3000 \
    LANG=C.UTF-8 \
    HOSTNAME=0.0.0.0

# 작업 디렉토리
WORKDIR /app

# 비root 사용자 생성 (보안)
RUN groupadd -r freelang && useradd -r -g freelang freelang

# builder 스테이지에서 빌드 결과 복사
COPY --from=builder --chown=freelang:freelang /build/build ./build
COPY --from=builder --chown=freelang:freelang /build/static ./static
COPY --from=builder --chown=freelang:freelang /build/backend ./backend
COPY --from=builder --chown=freelang:freelang /build/data ./data
COPY --from=builder --chown=freelang:freelang /build/package*.json ./

# 필수 시스템 라이브러리만 설치
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# npm 프로덕션 의존성만 설치
RUN npm install --production --no-optional --no-save \
    && npm cache clean --force

# 권한 설정
RUN chown -R freelang:freelang /app && \
    chmod -R u+rw /app

# 사용자 전환
USER freelang

# 헬스 체크
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/api/health || exit 1

# 포트 노출
EXPOSE ${PORT} ${WEB_PORT}

# 진입점 스크립트
COPY --chown=freelang:freelang docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

# 실행
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "backend/server.js"]

# 추가 정보 출력
RUN echo "🐳 FreeLang Hybrid Docker Image Ready" && \
    echo "   Node: $(node --version)" && \
    echo "   npm: $(npm --version)" && \
    echo "   User: $(whoami)" && \
    echo "   Port: ${PORT} (API), ${WEB_PORT} (Web)"
