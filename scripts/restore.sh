#!/bin/bash
# ============================================================================
# FreeLang Light - PostgreSQL 복구 스크립트
# ============================================================================
# 사용법: ./scripts/restore.sh <backup_file.sql.gz>
# 예: ./scripts/restore.sh backups/freelang-backup-20260314_120000.sql.gz

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 설정
DB_NAME="freelang"
DB_USER="freelang"
DB_HOST="postgres"
DB_PORT="5432"
LOG_FILE="/var/log/freelang-restore.log"

# 로깅 함수
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a ${LOG_FILE}
}

# 파라미터 확인
if [ $# -eq 0 ]; then
    echo "❌ 사용법: $0 <backup_file.sql.gz>"
    echo ""
    echo "예시:"
    echo "  $0 backups/freelang-backup-20260314_120000.sql.gz"
    echo "  $0 /backups/freelang-backup-latest.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

log "========== PostgreSQL 복구 시작 =========="

# 1. 백업 파일 확인
if [ ! -f "${BACKUP_FILE}" ]; then
    log "❌ 백업 파일을 찾을 수 없음: ${BACKUP_FILE}"
    exit 1
fi

log "📦 백업 파일: ${BACKUP_FILE}"
log "   크기: $(du -h ${BACKUP_FILE} | cut -f1)"

# 2. 백업 파일 무결성 검사
log "🔍 백업 파일 무결성 검사..."
if ! gunzip -t ${BACKUP_FILE} 2>/dev/null; then
    log "❌ 백업 파일 손상됨"
    exit 1
fi
log "✅ 백업 파일 검증 성공"

# 3. PostgreSQL 연결성 확인
log "🔍 PostgreSQL 연결 확인..."
if ! PGPASSWORD="${DB_USER}" pg_isready -h ${DB_HOST} -U ${DB_USER} -d ${DB_NAME} -p ${DB_PORT}; then
    log "❌ PostgreSQL 연결 실패"
    exit 1
fi
log "✅ PostgreSQL 연결 성공"

# 4. 기존 데이터 백업 (안전장치)
log "💾 기존 데이터 백업 (안전장치)..."
SAFETY_BACKUP="/backups/freelang-pre-restore-$(date +%Y%m%d_%H%M%S).sql.gz"
if PGPASSWORD="${DB_USER}" pg_dump \
    -h ${DB_HOST} \
    -U ${DB_USER} \
    -d ${DB_NAME} \
    -p ${DB_PORT} \
    | gzip > ${SAFETY_BACKUP}; then
    log "✅ 안전 백업 저장: $(basename ${SAFETY_BACKUP})"
else
    log "⚠️  안전 백업 실패 (계속 진행)"
fi

# 5. 확인 메시지
echo ""
echo "⚠️  주의: 기존 데이터가 복구 백업의 데이터로 덮어씌워집니다!"
echo "   백업 파일: ${BACKUP_FILE}"
echo "   데이터베이스: ${DB_NAME}"
echo "   안전 백업: ${SAFETY_BACKUP}"
echo ""
read -p "정말 복구하시겠습니까? (yes/no): " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
    log "❌ 복구 취소됨"
    exit 1
fi

# 6. 데이터 복구
log "📥 데이터 복구 중..."
RESTORE_START=$(date +%s)

if gunzip -c ${BACKUP_FILE} | PGPASSWORD="${DB_USER}" psql \
    -h ${DB_HOST} \
    -U ${DB_USER} \
    -d ${DB_NAME} \
    -p ${DB_PORT} \
    -v ON_ERROR_STOP=1 \
    > /tmp/restore.log 2>&1; then

    RESTORE_END=$(date +%s)
    RESTORE_TIME=$((RESTORE_END - RESTORE_START))

    log "✅ 복구 완료"
    log "   시간: ${RESTORE_TIME}초"

    # 7. 복구된 데이터 검증
    log "🔍 복구된 데이터 검증..."
    POST_COUNT=$(PGPASSWORD="${DB_USER}" psql -h ${DB_HOST} -U ${DB_USER} -d ${DB_NAME} -p ${DB_PORT} -t -c "SELECT COUNT(*) FROM posts;")
    COMMENT_COUNT=$(PGPASSWORD="${DB_USER}" psql -h ${DB_HOST} -U ${DB_USER} -d ${DB_NAME} -p ${DB_PORT} -t -c "SELECT COUNT(*) FROM comments;")
    USER_COUNT=$(PGPASSWORD="${DB_USER}" psql -h ${DB_HOST} -U ${DB_USER} -d ${DB_NAME} -p ${DB_PORT} -t -c "SELECT COUNT(*) FROM users;")

    log "✅ 데이터 검증 완료:"
    log "   포스트: ${POST_COUNT}개"
    log "   댓글: ${COMMENT_COUNT}개"
    log "   사용자: ${USER_COUNT}개"

    log ""
    log "========== PostgreSQL 복구 종료 =========="
    log "✅ 복구 성공!"

else
    log "❌ 복구 실패"
    log "   에러 로그: /tmp/restore.log"
    cat /tmp/restore.log | tail -20
    exit 1
fi
