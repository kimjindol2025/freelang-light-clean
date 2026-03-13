#!/bin/bash
# ============================================================================
# FreeLang Light - PostgreSQL 자동 백업 스크립트
# ============================================================================
# 용도: Docker 환경에서 PostgreSQL 데이터베이스 정기 백업
# 주기: cron으로 매시간 실행 권장
# 보관: 7일 자동 삭제

set -e

# 설정
BACKUP_DIR="/backups"
DB_NAME="freelang"
DB_USER="freelang"
DB_HOST="postgres"  # Docker internal DNS
DB_PORT="5432"
RETENTION_DAYS=7
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/freelang-backup-${TIMESTAMP}.sql.gz"
LOG_FILE="/var/log/freelang-backup.log"

# 로깅 함수
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a ${LOG_FILE}
}

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log "========== PostgreSQL 백업 시작 =========="

# 1. 백업 디렉토리 확인/생성
if [ ! -d "${BACKUP_DIR}" ]; then
    log "📁 백업 디렉토리 생성: ${BACKUP_DIR}"
    mkdir -p ${BACKUP_DIR}
    chmod 700 ${BACKUP_DIR}
fi

# 2. PostgreSQL 연결성 확인
log "🔍 PostgreSQL 연결 확인..."
if ! PGPASSWORD="${DB_USER}" pg_isready -h ${DB_HOST} -U ${DB_USER} -d ${DB_NAME} -p ${DB_PORT}; then
    log "❌ PostgreSQL 연결 실패"
    log "    호스트: ${DB_HOST}"
    log "    포트: ${DB_PORT}"
    log "    사용자: ${DB_USER}"
    exit 1
fi
log "✅ PostgreSQL 연결 성공"

# 3. 데이터베이스 덤프
log "💾 데이터베이스 덤프 중 (${DB_NAME})..."
DUMP_START=$(date +%s)

if PGPASSWORD="${DB_USER}" pg_dump \
    -h ${DB_HOST} \
    -U ${DB_USER} \
    -d ${DB_NAME} \
    -p ${DB_PORT} \
    --format=plain \
    --verbose \
    --no-privileges \
    --no-owner \
    | gzip > ${BACKUP_FILE}; then

    DUMP_END=$(date +%s)
    DUMP_TIME=$((DUMP_END - DUMP_START))
    BACKUP_SIZE=$(du -h ${BACKUP_FILE} | cut -f1)

    log "✅ 백업 완료"
    log "   파일: ${BACKUP_FILE}"
    log "   크기: ${BACKUP_SIZE}"
    log "   시간: ${DUMP_TIME}초"
else
    log "❌ 백업 실패"
    exit 1
fi

# 4. 오래된 백업 삭제
log "🗑️  오래된 백업 삭제 (보관: ${RETENTION_DAYS}일)"
DELETED_COUNT=0

find ${BACKUP_DIR} -name "freelang-backup-*.sql.gz" -type f -mtime +${RETENTION_DAYS} | while read file; do
    log "   삭제: $(basename $file)"
    rm -f "$file"
    ((DELETED_COUNT++))
done

log "✅ 정리 완료"

# 5. 백업 무결성 검사
log "🔍 백업 무결성 검사..."
if gunzip -t ${BACKUP_FILE} 2>/dev/null; then
    log "✅ 백업 파일 검증 성공"
else
    log "❌ 백업 파일 손상됨"
    rm -f ${BACKUP_FILE}
    exit 1
fi

# 6. 통계 출력
log ""
log "📊 백업 통계:"
log "   전체 백업 파일:"
ls -lh ${BACKUP_DIR}/freelang-backup-*.sql.gz 2>/dev/null | wc -l | xargs echo "   개수:"
du -sh ${BACKUP_DIR} | awk '{print "   합계: " $1}'

# 7. S3 업로드 (선택사항)
if command -v aws &> /dev/null && [ ! -z "${AWS_S3_BUCKET}" ]; then
    log ""
    log "☁️  S3 업로드 중..."
    if aws s3 cp ${BACKUP_FILE} s3://${AWS_S3_BUCKET}/freelang-backups/; then
        log "✅ S3 업로드 완료"
    else
        log "⚠️  S3 업로드 실패 (로컬 백업은 성공)"
    fi
fi

log ""
log "========== PostgreSQL 백업 종료 =========="
log "✅ 백업 완료: $(basename ${BACKUP_FILE})"
