# Health Check 설정 가이드

## 개요

FreeLang Light는 각 컨테이너의 상태를 자동으로 점검하고, 문제 발생 시 Grafana 알람으로 통지하는 Health Check 시스템을 제공합니다.

## 1. 기본 사용법

### 1.1 서버에서 Health Check 초기화

```javascript
// src/server.js
const HealthCheck = require('./health-check');

const healthCheck = new HealthCheck({
  port: 4003,              // Health Check 서버 포트
  checkInterval: 30000,    // 30초마다 점검
  timeout: 5000            // 5초 타임아웃
});

// 서비스 등록
healthCheck.registerService('postgres', async () => {
  const result = await pool.query('SELECT 1');
  if (!result.rows) throw new Error('DB 연결 실패');
});

healthCheck.registerService('redis', async () => {
  const pong = await redisClient.ping();
  if (pong !== 'PONG') throw new Error('Redis 연결 실패');
});

healthCheck.registerService('api', async () => {
  const res = await fetch('http://localhost:4002/api/components');
  if (!res.ok) throw new Error('API 응답 실패');
});

// Health Check 서버 시작
healthCheck.startServer();

// 정기적인 점검 시작
healthCheck.startPeriodicCheck();
```

## 2. Health Check 엔드포인트

### 2.1 간단한 헬스 체크 (Kubernetes, Docker Healthcheck용)

```bash
curl http://localhost:4003/health

# 응답 (정상)
{
  "status": "UP",
  "healthScore": 100,
  "timestamp": "2026-03-13T14:30:00Z"
}

# 응답 (문제)
HTTP 503
{
  "status": "DEGRADED",
  "healthScore": 50,
  "timestamp": "2026-03-13T14:30:00Z"
}
```

### 2.2 상세 헬스 체크

```bash
curl http://localhost:4003/health/detailed

# 응답
{
  "healthScore": 100,
  "services": [
    {
      "name": "postgres",
      "status": "UP",
      "responseTime": 45,
      "timestamp": "2026-03-13T14:30:00Z"
    },
    {
      "name": "redis",
      "status": "UP",
      "responseTime": 12,
      "timestamp": "2026-03-13T14:30:00Z"
    }
  ],
  "upCount": 2,
  "downCount": 0,
  "timestamp": "2026-03-13T14:30:00Z"
}
```

### 2.3 Prometheus 메트릭

```bash
curl http://localhost:4003/health/metrics

# 응답
# HELP freelang_health_score 시스템 전체 건강도 점수 (0-100)
# TYPE freelang_health_score gauge
freelang_health_score 100

# HELP freelang_service_status 각 서비스의 상태 (1=UP, 0=DOWN)
# TYPE freelang_service_status gauge
freelang_service_status{service="postgres"} 1
freelang_service_status{service="redis"} 1
freelang_service_status{service="api"} 1

# HELP freelang_service_response_time 서비스 응답 시간 (ms)
# TYPE freelang_service_response_time gauge
freelang_service_response_time{service="postgres"} 45
freelang_service_response_time{service="redis"} 12
freelang_service_response_time{service="api"} 89
```

## 3. Docker Compose 통합

### 3.1 docker-compose.yml 설정

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "4002:4002"
      - "4003:4003"  # Health Check 포트
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4003/health"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 30s
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_USER: freelang_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: freelang_light
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U freelang_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./config/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD:-admin}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./config/grafana/provisioning:/etc/grafana/provisioning
    ports:
      - "3000:3000"
    depends_on:
      - prometheus

volumes:
  prometheus_data:
  grafana_data:
```

## 4. Grafana 알람 설정

### 4.1 Grafana Webhook 설정

1. **Grafana 접속**: http://localhost:3000
2. **Alerting** → **Contact points** 접속
3. **New contact point** 생성:
   - Name: `freelang-webhook`
   - Contact point type: `Webhook`
   - URL: `http://app:4002/webhooks/grafana`

### 4.2 Alert Rule 생성

```javascript
// Grafana Alert Rule (JSON)
{
  "title": "FreeLang Health Score Low",
  "condition": "freelang_health_score < 50",
  "for": "2m",
  "annotations": {
    "summary": "System health is degraded",
    "description": "Health score dropped below 50%"
  }
}
```

## 5. 모니터링 대시보드

### 5.1 Prometheus 쿼리

```promql
# 전체 건강도 점수
freelang_health_score

# 서비스별 상태
freelang_service_status

# 서비스 응답 시간 평균 (1분)
avg(rate(freelang_service_response_time[1m]))
```

### 5.2 Grafana 대시보드 설정

1. **Dashboard** → **Create new dashboard**
2. **Add panel** 추가:
   - Panel title: `System Health`
   - Metric: `freelang_health_score`
   - Visualization: `Gauge`

## 6. 알람 정책

| 건강도 점수 | 상태 | 대응 | 알람 |
|-----------|------|------|------|
| 100 | ✅ UP | 정상 | X |
| 75-99 | ⚠️ DEGRADED | 모니터링 | Email |
| 50-74 | 🔴 CRITICAL | 즉시 대응 | Slack + Email |
| <50 | 🔴 FAILURE | 긴급 대응 | Slack + SMS + Email |

## 7. 트러블슈팅

### 7.1 Health Check 서버 안 올라옴

```bash
# 로그 확인
docker logs freelang-app | grep "Health Check"

# 포트 확인
netstat -an | grep 4003
```

### 7.2 서비스 상태 이상 감지

```bash
# 상세 상태 확인
curl http://localhost:4003/health/detailed | jq '.'

# 특정 서비스만 확인
curl http://localhost:4003/health/detailed | jq '.services[] | select(.name=="postgres")'
```

### 7.3 Grafana 알람 안 가는 경우

1. Webhook URL 확인: `echo $GRAFANA_WEBHOOK_URL`
2. 방화벽 설정 확인: `ping grafana`
3. 로그 확인: `docker logs freelang-app | grep "Grafana"`

## 8. 운영 팁

- 주 1회 헬스 체크 설정 점검
- 월 1회 알람 규칙 검토 및 업데이트
- 응답 시간 기준값을 분기마다 재조정
- 장애 발생 후 사후 분석(Retrospective) 진행

## 참고

- [Prometheus 문서](https://prometheus.io/docs/)
- [Grafana 문서](https://grafana.com/docs/)
- [Docker Healthcheck](https://docs.docker.com/engine/reference/builder/#healthcheck)
