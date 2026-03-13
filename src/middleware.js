/**
 * Middleware 시스템
 * 라우팅 요청/응답 처리 미들웨어
 *
 * 기능:
 * - Middleware Pipeline (순차 실행)
 * - 조건부 실행
 * - 에러 처리
 * - Built-in Middleware (auth, logging, analytics)
 */

/**
 * Middleware 파이프라인
 */
class MiddlewarePipeline {
  constructor() {
    this.middlewares = [];
    this.errorHandlers = [];
  }

  /**
   * 미들웨어 추가
   * @param {Function} handler - 미들웨어 핸들러
   * @param {Object} options - 옵션 (조건 등)
   */
  use(handler, options = {}) {
    this.middlewares.push({
      handler,
      condition: options.condition || null,
      name: options.name || 'unnamed',
      priority: options.priority || 0,
    });

    // 우선도순 정렬
    this.middlewares.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 에러 핸들러 등록
   */
  onError(handler) {
    this.errorHandlers.push(handler);
  }

  /**
   * 미들웨어 파이프라인 실행
   * @param {Object} context - 실행 컨텍스트
   * @returns {Promise<boolean>} 계속 진행 여부
   */
  async execute(context) {
    for (const middleware of this.middlewares) {
      // 조건 확인
      if (middleware.condition && !middleware.condition(context)) {
        continue;
      }

      try {
        const result = await middleware.handler(context);

        // false 반환 시 중단
        if (result === false) {
          return false;
        }
      } catch (error) {
        // 에러 처리
        for (const errorHandler of this.errorHandlers) {
          errorHandler(error, middleware.name, context);
        }
        return false;
      }
    }

    return true;
  }

  /**
   * 미들웨어 개수
   */
  count() {
    return this.middlewares.length;
  }

  /**
   * 모든 미들웨어 초기화
   */
  clear() {
    this.middlewares = [];
    this.errorHandlers = [];
  }

  /**
   * 미들웨어 목록
   */
  list() {
    return this.middlewares.map((mw) => ({
      name: mw.name,
      priority: mw.priority,
      hasCondition: mw.condition !== null,
    }));
  }
}

/**
 * Built-in 미들웨어들
 */
class BuiltInMiddlewares {
  /**
   * 인증 미들웨어
   */
  static authMiddleware(options = {}) {
    const { isAuthenticated = () => false, redirectPath = '/login' } = options;

    return async (context) => {
      if (context.route && context.route.meta && context.route.meta.requiresAuth) {
        if (!isAuthenticated()) {
          console.warn(`🔒 Auth required for ${context.route.path}, redirecting to ${redirectPath}`);
          if (context.navigate) {
            await context.navigate(redirectPath);
          }
          return false;
        }
      }
      return true;
    };
  }

  /**
   * 로깅 미들웨어
   */
  static loggingMiddleware(options = {}) {
    const { verbose = false, onLog = console.log } = options;

    return async (context) => {
      const timestamp = new Date().toISOString();
      const path = context.route?.path || 'unknown';
      const method = context.method || 'NAVIGATE';

      if (verbose) {
        onLog(`[${timestamp}] ${method} ${path}`);
        if (context.route?.meta) {
          onLog(`  Meta:`, context.route.meta);
        }
      } else {
        onLog(`[${timestamp}] → ${path}`);
      }

      return true;
    };
  }

  /**
   * 분석 미들웨어
   */
  static analyticsMiddleware(options = {}) {
    const { trackPageView = () => {}, trackEvent = () => {} } = options;

    return async (context) => {
      const path = context.route?.path || '/';
      const title = context.route?.meta?.title || path;

      trackPageView({
        path,
        title,
        timestamp: Date.now(),
        referrer: context.referrer,
      });

      // 특수 이벤트 추적
      if (context.route?.meta?.trackEvent) {
        trackEvent({
          name: context.route.meta.trackEvent,
          path,
          data: context.route.meta.eventData,
        });
      }

      return true;
    };
  }

  /**
   * 성능 모니터링 미들웨어
   */
  static performanceMiddleware(options = {}) {
    const { onSlow = console.warn, threshold = 100 } = options;

    return async (context) => {
      const startTime = Date.now();
      const path = context.route?.path || '/';

      // 비동기 작업 시간 측정을 위해 다음 마이크로태스크에서 확인
      Promise.resolve().then(() => {
        const duration = Date.now() - startTime;
        if (duration > threshold) {
          onSlow(`⚠️ Slow route: ${path} (${duration}ms)`);
        }
      });

      return true;
    };
  }

  /**
   * 리다이렉트 미들웨어
   */
  static redirectMiddleware(redirectMap = {}) {
    return async (context) => {
      const path = context.route?.path;

      if (path && redirectMap[path]) {
        console.log(`↪️ Redirecting ${path} → ${redirectMap[path]}`);
        if (context.navigate) {
          await context.navigate(redirectMap[path], { replace: true });
        }
        return false;
      }

      return true;
    };
  }

  /**
   * 캐시 제어 미들웨어
   */
  static cacheMiddleware(options = {}) {
    const { cacheKey = null } = options;

    return async (context) => {
      const key = cacheKey || context.route?.path;

      if (context.route?.meta?.noCache) {
        context.headers = { ...context.headers, 'Cache-Control': 'no-cache' };
      } else {
        context.headers = { ...context.headers, 'Cache-Control': 'max-age=3600' };
      }

      return true;
    };
  }
}

module.exports = MiddlewarePipeline;
module.exports.BuiltInMiddlewares = BuiltInMiddlewares;
