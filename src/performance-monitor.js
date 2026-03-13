/**
 * Performance Monitor (성능 모니터링)
 * 성능 측정 및 최적화 도구
 *
 * 기능:
 * - 렌더링 시간 측정
 * - 메모리 사용량 추적
 * - 상태 업데이트 추적
 * - 병목 지점 감지
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.marks = new Map();
    this.measures = new Map();
    this.samples = [];
    this.maxSamples = 1000;
  }

  /**
   * 성능 마크 시작
   */
  mark(name) {
    this.marks.set(name, Date.now());
  }

  /**
   * 성능 마크 측정
   */
  measure(name, startMark, endMark = null) {
    const startTime = this.marks.get(startMark);
    const endTime = endMark ? this.marks.get(endMark) : Date.now();

    if (startTime === undefined) {
      console.warn(`Mark "${startMark}" not found`);
      return null;
    }

    const duration = endTime - startTime;

    if (!this.measures.has(name)) {
      this.measures.set(name, []);
    }

    this.measures.get(name).push(duration);

    // 샘플 저장
    this.samples.push({
      name,
      duration,
      timestamp: Date.now(),
    });

    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }

    return duration;
  }

  /**
   * 메모리 사용량 (Node.js)
   */
  getMemoryUsage() {
    if (typeof process === 'undefined') return null;

    const usage = process.memoryUsage();
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
      rss: Math.round(usage.rss / 1024 / 1024),
    };
  }

  /**
   * 상태 업데이트 시간 추적
   */
  trackStateUpdate(component, duration) {
    const key = `state-${component}`;

    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        count: 0,
        totalTime: 0,
        maxTime: 0,
        minTime: Infinity,
      });
    }

    const metric = this.metrics.get(key);
    metric.count++;
    metric.totalTime += duration;
    metric.maxTime = Math.max(metric.maxTime, duration);
    metric.minTime = Math.min(metric.minTime, duration);
  }

  /**
   * 평균 성능 계산
   */
  getAverageTime(name) {
    const measures = this.measures.get(name);
    if (!measures || measures.length === 0) return 0;

    const sum = measures.reduce((a, b) => a + b, 0);
    return sum / measures.length;
  }

  /**
   * 최대 성능 (병목)
   */
  getMaxTime(name) {
    const measures = this.measures.get(name);
    if (!measures || measures.length === 0) return 0;
    return Math.max(...measures);
  }

  /**
   * 최소 성능
   */
  getMinTime(name) {
    const measures = this.measures.get(name);
    if (!measures || measures.length === 0) return 0;
    return Math.min(...measures);
  }

  /**
   * 병목 지점 감지
   */
  detectBottlenecks(threshold = 100) {
    const bottlenecks = [];

    for (const [name, measures] of this.measures.entries()) {
      const avgTime = this.getAverageTime(name);
      if (avgTime > threshold) {
        bottlenecks.push({
          name,
          averageTime: avgTime,
          maxTime: this.getMaxTime(name),
          count: measures.length,
        });
      }
    }

    return bottlenecks.sort((a, b) => b.averageTime - a.averageTime);
  }

  /**
   * 최적화 제안
   */
  getOptimizationSuggestions() {
    const suggestions = [];
    const bottlenecks = this.detectBottlenecks();

    for (const bottleneck of bottlenecks) {
      if (bottleneck.averageTime > 500) {
        suggestions.push({
          priority: 'critical',
          metric: bottleneck.name,
          suggestion: 'Consider lazy loading or code splitting',
          currentTime: bottleneck.averageTime,
        });
      } else if (bottleneck.averageTime > 200) {
        suggestions.push({
          priority: 'high',
          metric: bottleneck.name,
          suggestion: 'Optimize component rendering',
          currentTime: bottleneck.averageTime,
        });
      } else {
        suggestions.push({
          priority: 'medium',
          metric: bottleneck.name,
          suggestion: 'Monitor for regression',
          currentTime: bottleneck.averageTime,
        });
      }
    }

    return suggestions;
  }

  /**
   * 통계
   */
  getStats() {
    const memory = this.getMemoryUsage();

    return {
      measuredMetrics: this.measures.size,
      totalSamples: this.samples.length,
      memory,
      bottlenecks: this.detectBottlenecks().length,
      suggestions: this.getOptimizationSuggestions().length,
    };
  }

  /**
   * 리셋
   */
  reset() {
    this.metrics.clear();
    this.marks.clear();
    this.measures.clear();
    this.samples = [];
  }
}

/**
 * Profiler - 컴포넌트별 성능 분석
 */
class Profiler {
  constructor() {
    this.componentMetrics = new Map();
    this.renderTimes = [];
  }

  /**
   * 컴포넌트 렌더링 시간 기록
   */
  recordComponentRender(componentName, duration) {
    if (!this.componentMetrics.has(componentName)) {
      this.componentMetrics.set(componentName, {
        renders: [],
        totalTime: 0,
        averageTime: 0,
      });
    }

    const metric = this.componentMetrics.get(componentName);
    metric.renders.push(duration);
    metric.totalTime += duration;
    metric.averageTime = metric.totalTime / metric.renders.length;

    this.renderTimes.push({
      component: componentName,
      duration,
      timestamp: Date.now(),
    });
  }

  /**
   * 느린 컴포넌트 감지
   */
  getSlowComponents(threshold = 50) {
    const slow = [];

    for (const [name, metric] of this.componentMetrics.entries()) {
      if (metric.averageTime > threshold) {
        slow.push({
          name,
          averageTime: metric.averageTime,
          renderCount: metric.renders.length,
        });
      }
    }

    return slow.sort((a, b) => b.averageTime - a.averageTime);
  }

  /**
   * 컴포넌트 성능 리포트
   */
  getReport() {
    const slowComponents = this.getSlowComponents();

    return {
      totalComponents: this.componentMetrics.size,
      slowComponents,
      totalRenders: this.renderTimes.length,
      recommendations: slowComponents.map((comp) => ({
        component: comp.name,
        recommendation: 'Consider memoization or optimization',
        currentTime: comp.averageTime,
      })),
    };
  }
}

module.exports = PerformanceMonitor;
module.exports.Profiler = Profiler;
