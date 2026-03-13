#!/bin/bash
# GOGS → GitHub 자동 동기화 스크립트

REPO_DIR="/data/data/com.termux/files/home/v2-freelang-ai"
LOG_FILE="$REPO_DIR/sync.log"

cd "$REPO_DIR" || exit 1

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 동기화 시작..." >> "$LOG_FILE"

# GOGS에서 최신 상태 가져오기
git fetch origin master >> "$LOG_FILE" 2>&1

# GitHub에 푸시 (Personal Access Token 사용)
# 환경변수: GITHUB_TOKEN이 필요합니다
if [ -n "$GITHUB_TOKEN" ]; then
  git push https://$GITHUB_TOKEN@github.com/kimjindol2025/v2-freelang-ai.git master >> "$LOG_FILE" 2>&1
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] 동기화 완료 ✅" >> "$LOG_FILE"
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️ GITHUB_TOKEN 환경변수 필요" >> "$LOG_FILE"
fi
