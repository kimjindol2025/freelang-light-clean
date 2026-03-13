#!/bin/bash
# ==================================================================
# FreeLang Light - Let's Encrypt SSL 인증서 자동 갱신
# ==================================================================
# crontab 설정 (매월 1일 02:00 실행):
# 0 2 1 * * /path/to/freelang-light/scripts/renew-ssl.sh >> /var/log/freelang-ssl-renew.log 2>&1
#
# 또는 매주 월요일 02:00:
# 0 2 * * 1 /path/to/freelang-light/scripts/renew-ssl.sh >> /var/log/freelang-ssl-renew.log 2>&1

set -e

DOMAIN="253.dclub.kr"
CERT_PATH="/etc/letsencrypt/live/${DOMAIN}"
LOG_FILE="/var/log/freelang-ssl-renew.log"
EMAIL="admin@dclub.kr"  # 수정 필요

# 로깅 함수
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a ${LOG_FILE}
}

log "========== SSL 인증서 갱신 시작 =========="

# 1. certbot 설치 확인
if ! command -v certbot &> /dev/null; then
    log "❌ certbot이 설치되지 않았습니다."
    log "설치: sudo apt-get install certbot python3-certbot-nginx"
    exit 1
fi

# 2. 현재 인증서 정보 확인
if [ -f "${CERT_PATH}/fullchain.pem" ]; then
    log "✅ 현재 인증서 위치: ${CERT_PATH}"
    EXPIRY_DATE=$(openssl x509 -enddate -noout -in "${CERT_PATH}/fullchain.pem" | cut -d= -f2)
    log "   만료 날짜: ${EXPIRY_DATE}"
else
    log "⚠️  인증서를 찾을 수 없습니다. 새로 생성합니다."
fi

# 3. certbot 갱신 실행
log "🔄 certbot 갱신 실행..."
sudo certbot renew \
    --agree-tos \
    --email ${EMAIL} \
    --noninteractive \
    --quiet \
    --webroot-path /var/www/certbot \
    --authenticator webroot \
    --installer nginx

RENEW_EXIT_CODE=$?

# 4. 결과 처리
if [ ${RENEW_EXIT_CODE} -eq 0 ]; then
    log "✅ 인증서 갱신 완료"

    # 5. nginx 리로드 (인증서 적용)
    log "🔄 nginx 리로드..."
    sudo nginx -s reload

    # 6. Docker에서 실행 중이면 컨테이너도 리로드
    if command -v docker &> /dev/null; then
        log "🐳 Docker nginx 컨테이너 리로드..."
        docker exec freelang-hybrid-nginx nginx -s reload 2>/dev/null || true
    fi

    log "✅ SSL 갱신 프로세스 완료"
else
    log "❌ certbot 갱신 실패 (코드: ${RENEW_EXIT_CODE})"
    log "⚠️  확인 필요: journalctl -u certbot.timer, certbot logs"
    exit ${RENEW_EXIT_CODE}
fi

log "========== SSL 인증서 갱신 종료 =========="
