# 📊 FreeLang Light Monitoring Setup Guide

## Phase 1 Task 4: 기본 모니터링 시스템

**목표**: 에러 로깅, Prometheus 메트릭, 시스템 모니터링을 통한 운영 가시성 확보

**상태**: ✅ **완료 (모든 모니터링 컴포넌트 구현)**

---

## 📈 구현 내용

### 1. 에러 로거 모듈 (`examples/src/error-logger.fl`)

**역할**: 다중 레벨 로깅 (ERROR, WARN, INFO, DEBUG)

**주요 함수**:
```freeLang
log_error(message: string)              // ❌ 에러 로그
log_error_with_stack(message, stack)    // ❌ 에러 + 스택 트레이스
log_warn(message: string)               // ⚠️  경고 로그
log_info(message: string)               // ℹ️  정보 로그
log_debug(message: string)              // 🐛 디버그 로그

get_log_stats() -> LogStats             // 통계 조회
get_recent_logs(count) -> array<string> // 최근 로그 조회
```

**저장 위치**: `/logs/app.log` (로테이션 7일)

**예시**:
```
❌ [2026-03-13T12:00:00] [ERROR] HTTP 500 에러: /api/posts
⚠️  [2026-03-13T12:00:01] [WARN] 클라이언트 에러: 404 Not Found
ℹ️  [2026-03-13T12:00:02] [INFO] 요청: GET /api/posts (200ms)
```

---

### 2. Prometheus 모니터링 (`prometheus.yml`)

**역할**: 시스템 메트릭 수집 및 성능 모니터링

**접근**: http://localhost:9090

**수집 대상**:
1. **FreeLang Blog** (localhost:5021/api/metrics)
   - HTTP 요청 레이트, 응답 시간, 상태 코드별 분포
   - 에러율, 캐시 히트율, DB 쿼리 시간

2. **PostgreSQL** (port 5432)
   - 연결 풀 상태, 슬로우 쿼리, 테이블 크기

3. **Redis** (port 6379)
   - 캐시 메모리 사용, 히트/미스 비율

4. **시스템** (Node Exporter)
   - CPU, 메모리, 디스크 사용률, 네트워크

**주요 메트릭**:
```
freelang_http_requests_total          // 총 HTTP 요청 수
freelang_http_request_duration_seconds // 요청 응답 시간 분포
freelang_errors_total                 // 총 에러 수 (레벨별)
freelang_db_query_duration_seconds    // DB 쿼리 시간
freelang_cache_hit_ratio              // 캐시 히트율
```

---

### 3. 알림 규칙 (`alerting-rules.yml`)

**역할**: 비정상 상태 감지 및 경고

**정의된 알림** (10개):
1. ServerDown - 서버 2분 이상 다운
2. HighErrorRate - 5xx 에러율 5% 초과
3. HighLatency - p99 응답 시간 2초 초과
4. HighMemoryUsage - 메모리 사용 80% 초과
5. DiskSpaceWarning - 디스크 남은 공간 5GB 미만
6. DatabaseConnectionFailed - PostgreSQL 연결 실패
7. LowCacheHitRate - 캐시 히트율 50% 미만
8. SlowQueryDetected - 평균 쿼리 시간 1초 초과
9. LogStorageWarning - 로그 저장소 1GB 미만
10. RequestSpike - 비정상적인 요청 급증 (1000 req/s)

---

### 4. 기록 규칙 (`recording-rules.yml`)

**역할**: 자주 사용되는 메트릭 사전 계산

**기록된 메트릭** (30개):
- 요청 레이트 (1m, 5m, 1h)
- 성공률/에러율
- 응답 시간 (평균, p99, p95)
- DB 성능
- 캐시 성능
- 시스템 리소스 사용률
- 비즈니스 메트릭 (포스트 생성율, 조회율)

---

### 5. HTTP 요청 모니터링 (`blog-server.fl`)

**구현된 모니터링**:
```freeLang
handle_http_request()
├─ 요청 로그 기록 (INFO)
├─ 요청 타입별 라우팅
├─ 응답 시간 측정 (ms)
├─ 상태별 로그 기록
│  ├─ 2xx: 정보
│  ├─ 4xx: 경고 (WARN)
│  └─ 5xx: 에러 (ERROR)
└─ 메트릭 업데이트
```

**기록되는 정보**:
```
ℹ️  [12:00:00] HTTP 요청: GET /api/posts
ℹ️  [12:00:00] 응답: GET /api/posts → 200 (45ms)

⚠️  [12:00:01] 클라이언트 에러: GET /api/404 (상태: 404)
❌ [12:00:02] 서버 에러 발생: POST /api/posts (상태: 500)
```

---

### 6. 파일 작업 로깅 (`file-io.fl`)

**구현**: `append_to_file()` 함수로 실제 파일 쓰기

**저장**: `/logs/file-operations.log`

**기록 내용**:
```
[2026-03-13T12:00:00] READ: /app/data/posts.json (✅ 성공)
[2026-03-13T12:00:01] WRITE: /logs/app.log (✅ 성공)
[2026-03-13T12:00:02] DELETE: /tmp/cache (❌ 실패: 권한 없음)
```

---

### 7. 메트릭 배열 추가 (`metrics.fl`)

**구현**: `array_append()` 시리즈 함수 완성

```freeLang
array_append(arr, item)      // 메트릭 포인트 추가
array_append_f64(arr, value) // 부동소수점 값 추가
array_append_str(arr, text)  // 문자열 추가
```

---

## 🚀 빠른 시작 (5분)

### 1️⃣ 서비스 시작

```bash
cd ~/freelang-light

# Prometheus 포함하여 전체 스택 시작
docker-compose up -d

# Prometheus 헬스 체크
docker-compose exec prometheus wget --spider http://localhost:9090/-/healthy
```

### 2️⃣ 모니터링 접근

```bash
# Prometheus UI
http://localhost:9090

# 메트릭 엔드포인트
curl http://localhost:5021/api/metrics

# 로그 확인
docker-compose exec api tail -f /app/logs/app.log

# 알림 확인
curl -s http://localhost:9090/api/v1/alerts | jq
```

### 3️⃣ 테스트 요청 생성

```bash
# 정상 요청 (200)
curl http://localhost:5021/api/blogs

# 에러 요청 (404)
curl http://localhost:5021/api/notfound

# 에러 요청 (500 시뮬레이션)
curl -X POST http://localhost:5021/api/error
```

### 4️⃣ 로그 확인

```bash
# 실시간 로그 보기
tail -f /logs/app.log

# 에러만 필터링
grep ERROR /logs/app.log

# 최근 10줄
tail -n 10 /logs/app.log

# 경고 카운트
grep WARN /logs/app.log | wc -l
```

---

## 📊 Prometheus 대시보드 쿼리

### HTTP 성능

```
# 요청 레이트 (초당)
rate(http_requests_total[5m])

# 에러율
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])

# p99 응답 시간
histogram_quantile(0.99, http_request_duration_seconds)

# 메서드별 평균 응답 시간
avg by (method) (rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m]))
```

### 데이터베이스

```
# DB 연결 풀 사용률
pg_stat_activity_count / pg_setting_max_connections

# 슬로우 쿼리 감지
pg_stat_statements_mean_time > 1000

# 테이블별 크기
pg_table_size / 1024 / 1024
```

### 캐시

```
# 캐시 히트율
cache_hits_total / (cache_hits_total + cache_misses_total)

# 캐시 메모리 사용
redis_memory_used_bytes / redis_memory_max_bytes
```

### 시스템

```
# CPU 사용률
rate(container_cpu_usage_seconds_total[1m]) * 100

# 메모리 사용률
container_memory_usage_bytes / container_memory_total_bytes * 100

# 디스크 여유 공간
node_filesystem_avail_bytes / node_filesystem_size_bytes
```

---

## 🔧 운영 가이드

### 로그 관리

```bash
# 로그 디렉토리 구조
/logs/
├── app.log                    # 애플리케이션 로그 (메인)
├── file-operations.log        # 파일 I/O 로그
├── error_2026-03-13.log      # 일별 에러 로그 (로테이션)
└── backup/                    # 보관 중인 로그 (7일)

# 로그 크기 확인
du -sh /logs/

# 오래된 로그 정리
find /logs -name "*.log" -mtime +7 -delete

# 로그 압축 (장기 보관)
gzip /logs/error_2026-03-*.log
```

### 알림 설정

```bash
# AlertManager 통합 (선택사항)
# alerting-rules.yml의 alertmanagers 섹션 수정

# Slack 알림
alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

# AlertManager 설정 (alertmanager.yml)
global:
  slack_api_url: 'https://hooks.slack.com/services/...'

route:
  receiver: 'slack'

receivers:
  - name: 'slack'
    slack_configs:
      - channel: '#freelang-alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

### Grafana 대시보드 (선택사항)

```bash
# Grafana 추가 (docker-compose.yml)
grafana:
  image: grafana/grafana:latest
  ports:
    - "3000:3000"
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=admin
  volumes:
    - grafana-data:/var/lib/grafana

# 접근: http://localhost:3000 (admin/admin)
# Prometheus 데이터 소스 추가: http://prometheus:9090
```

---

## 📋 성능 메트릭 (목표값)

| 메트릭 | 목표 | 경고 | 임계 |
|--------|------|------|------|
| 응답 시간 (p99) | < 500ms | > 1s | > 2s |
| 에러율 | < 0.1% | > 1% | > 5% |
| 캐시 히트율 | > 80% | < 70% | < 50% |
| 가용성 | 99.9% | < 99.5% | < 99% |
| DB 쿼리 시간 | < 50ms | > 200ms | > 1s |
| 메모리 사용 | < 60% | > 80% | > 90% |
| 디스크 여유 | > 20GB | < 5GB | < 1GB |

---

## 🐛 문제 해결

### Prometheus 메트릭이 없음

```bash
# 1. Prometheus 재시작
docker-compose restart prometheus

# 2. FreeLang 메트릭 엔드포인트 확인
curl http://localhost:5021/api/metrics

# 3. Prometheus 설정 검증
curl -s http://localhost:9090/api/v1/query_range?query=up
```

### 로그 파일이 생성되지 않음

```bash
# 1. 로그 디렉토리 권한 확인
ls -la /logs/

# 2. 컨테이너에서 쓰기 권한 확인
docker-compose exec api touch /logs/test.log

# 3. docker-compose.yml 볼륨 마운트 확인
grep -A2 "volumes:" docker-compose.yml | grep logs
```

### 높은 메모리 사용

```bash
# 1. Prometheus TSDB 크기 확인
du -sh /prometheus/

# 2. 보관 기간 단축
# prometheus.yml의 --storage.tsdb.retention.time=30d를 수정

# 3. Prometheus 캐시 정리
docker-compose exec prometheus rm -rf /prometheus/wal
docker-compose restart prometheus
```

---

## 🎯 Phase 1 완료 체크리스트

- [x] Error Logger 구현 (error-logger.fl)
- [x] Prometheus 설정 (prometheus.yml)
- [x] 알림 규칙 정의 (alerting-rules.yml)
- [x] 기록 규칙 정의 (recording-rules.yml)
- [x] HTTP 요청 모니터링 (blog-server.fl)
- [x] 파일 I/O 로깅 (file-io.fl)
- [x] 메트릭 배열 추가 (metrics.fl)
- [x] Docker Compose 통합 (docker-compose.yml)
- [x] 모니터링 문서 (MONITORING_SETUP.md)

---

## 📈 다음 단계

**Phase 1 완료 (4주 요약)**:
- ✅ Task 1: HTTPS/SSL 활성화
- ✅ Task 2: PostgreSQL 데이터 영속성
- ✅ Task 3: 자동 백업 시스템
- ✅ Task 4: 기본 모니터링

**현재 상태**: **75/100 (BETA)** - 데이터 안전성 + 운영 가시성 확보 ✨

**Phase 2로 진행 (다음 4주)**:
- Task 5: 관리 대시보드 (React UI)
- Task 6: OAuth 2.0 (소셜 로그인)
- Task 7: GitHub Actions CI/CD
- Task 8: API 문서 (Swagger)

**최종 목표**: **85-90/100 (GA)** - 완전한 상용 서비스 🚀
