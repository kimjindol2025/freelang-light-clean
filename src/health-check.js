/**
 * Health Check 모듈
 * 각 컴포넌트의 상태를 점검하고 Grafana 알람으로 연결
 */

const http = require('http');

class HealthCheck {
  constructor(config = {}) {
    this.config = {
      port: config.port || 4003,
      checkInterval: config.checkInterval || 30000, // 30초
      timeout: config.timeout || 5000,
      ...config
    };

    this.services = new Map();
    this.alerts = [];
  }

  /**
   * 서비스 등록
   */
  registerService(name, checkFn) {
    this.services.set(name, {
      name,
      checkFn,
      status: 'UNKNOWN',
      lastCheck: null,
      isHealthy: false,
      errorMessage: null,
      alertSent: false
    });
  }

  /**
   * 단일 서비스 상태 점검
   */
  async checkService(name) {
    const service = this.services.get(name);
    if (!service) return null;

    try {
      const startTime = Date.now();
      await Promise.race([
        service.checkFn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), this.config.timeout)
        )
      ]);

      const responseTime = Date.now() - startTime;

      service.status = 'UP';
      service.isHealthy = true;
      service.errorMessage = null;
      service.lastCheck = new Date();
      service.responseTime = responseTime;
      service.alertSent = false;

      return {
        name,
        status: 'UP',
        responseTime,
        timestamp: new Date()
      };
    } catch (error) {
      service.status = 'DOWN';
      service.isHealthy = false;
      service.errorMessage = error.message;
      service.lastCheck = new Date();

      // 알람 발송 (첫 실패시에만)
      if (!service.alertSent) {
        this.sendAlert({
          service: name,
          severity: 'CRITICAL',
          message: `Service ${name} is DOWN: ${error.message}`,
          timestamp: new Date()
        });
        service.alertSent = true;
      }

      return {
        name,
        status: 'DOWN',
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * 모든 서비스 상태 점검
   */
  async checkAll() {
    const results = [];

    for (const [name] of this.services) {
      const result = await this.checkService(name);
      if (result) results.push(result);
    }

    return results;
  }

  /**
   * 건강도 점수 계산 (0-100)
   */
  getHealthScore() {
    if (this.services.size === 0) return 100;

    const healthyCount = Array.from(this.services.values())
      .filter(s => s.isHealthy).length;

    return Math.round((healthyCount / this.services.size) * 100);
  }

  /**
   * Grafana 알람 발송
   */
  sendAlert(alert) {
    this.alerts.push({
      ...alert,
      id: Math.random().toString(36).substr(2, 9),
      acknowledged: false
    });

    // Grafana Webhook URL로 POST (설정 필요)
    if (process.env.GRAFANA_WEBHOOK_URL) {
      this.sendToGrafana(alert);
    }

    // 콘솔 로그
    console.error(`[ALERT] ${alert.severity}: ${alert.message}`);
  }

  /**
   * Grafana로 알람 전송
   */
  async sendToGrafana(alert) {
    try {
      const payload = {
        title: `FreeLang: ${alert.service}`,
        description: alert.message,
        severity: alert.severity,
        timestamp: alert.timestamp,
        dashboardURL: `${process.env.GRAFANA_HOST}:${process.env.GRAFANA_PORT}`
      };

      const postData = JSON.stringify(payload);

      const options = {
        hostname: new URL(process.env.GRAFANA_WEBHOOK_URL).hostname,
        path: new URL(process.env.GRAFANA_WEBHOOK_URL).pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = http.request(options, (res) => {
        if (res.statusCode !== 200) {
          console.warn(`Grafana webhook returned ${res.statusCode}`);
        }
      });

      req.on('error', (error) => {
        console.error('Failed to send alert to Grafana:', error.message);
      });

      req.write(postData);
      req.end();
    } catch (error) {
      console.error('Error sending alert to Grafana:', error);
    }
  }

  /**
   * Health Check HTTP 서버 시작
   */
  startServer() {
    const server = http.createServer(async (req, res) => {
      // CORS 헤더
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');

      if (req.url === '/health') {
        // 간단한 헬스 체크 (빠름)
        const healthScore = this.getHealthScore();
        const status = healthScore >= 50 ? 'UP' : 'DEGRADED';

        res.writeHead(status === 'UP' ? 200 : 503);
        res.end(JSON.stringify({
          status,
          healthScore,
          timestamp: new Date()
        }));

      } else if (req.url === '/health/detailed') {
        // 상세 헬스 체크
        const results = await this.checkAll();
        const healthScore = this.getHealthScore();

        res.writeHead(200);
        res.end(JSON.stringify({
          healthScore,
          services: results,
          upCount: results.filter(r => r.status === 'UP').length,
          downCount: results.filter(r => r.status === 'DOWN').length,
          timestamp: new Date()
        }, null, 2));

      } else if (req.url === '/health/metrics') {
        // Prometheus 메트릭 형식
        const metrics = this.getPrometheusMetrics();
        res.writeHead(200);
        res.end(metrics);

      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    });

    server.listen(this.config.port, () => {
      console.log(`✅ Health Check 서버 시작: http://localhost:${this.config.port}/health`);
    });

    return server;
  }

  /**
   * 정기적인 헬스 체크 실행
   */
  startPeriodicCheck() {
    setInterval(async () => {
      const results = await this.checkAll();
      const downServices = results.filter(r => r.status === 'DOWN');

      if (downServices.length > 0) {
        console.warn(`⚠️  ${downServices.length}개 서비스가 DOWN 상태입니다`);
      }
    }, this.config.checkInterval);

    console.log(`✅ 정기 헬스 체크 시작 (${this.config.checkInterval}ms 간격)`);
  }

  /**
   * Prometheus 메트릭 포맷 생성
   */
  getPrometheusMetrics() {
    let metrics = '# HELP freelang_health_score 시스템 전체 건강도 점수 (0-100)\n';
    metrics += '# TYPE freelang_health_score gauge\n';
    metrics += `freelang_health_score ${this.getHealthScore()}\n\n`;

    metrics += '# HELP freelang_service_status 각 서비스의 상태 (1=UP, 0=DOWN)\n';
    metrics += '# TYPE freelang_service_status gauge\n';

    for (const [name, service] of this.services) {
      const status = service.isHealthy ? 1 : 0;
      metrics += `freelang_service_status{service="${name}"} ${status}\n`;
    }

    metrics += '\n# HELP freelang_service_response_time 서비스 응답 시간 (ms)\n';
    metrics += '# TYPE freelang_service_response_time gauge\n';

    for (const [name, service] of this.services) {
      if (service.responseTime) {
        metrics += `freelang_service_response_time{service="${name}"} ${service.responseTime}\n`;
      }
    }

    return metrics;
  }

  /**
   * 알람 조회
   */
  getAlerts(acknowledged = false) {
    if (acknowledged) {
      return this.alerts.filter(a => a.acknowledged);
    }
    return this.alerts.filter(a => !a.acknowledged);
  }

  /**
   * 알람 승인
   */
  acknowledgeAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }
}

module.exports = HealthCheck;
