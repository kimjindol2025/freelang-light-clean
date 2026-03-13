/**
 * REST API Server - FreeLang Backend
 * Node.js http 모듈만 사용 (0 의존성)
 *
 * Features:
 * - JSON 요청/응답
 * - 라우팅 (GET, POST, PUT, DELETE, PATCH)
 * - 에러 처리 & 상태 코드
 * - CORS 지원
 * - 요청 로깅
 */

const http = require('http');
const url = require('url');
const querystring = require('querystring');

/**
 * API 서버 클래스
 */
class APIServer {
  constructor(port = 3001) {
    this.port = port;
    this.routes = new Map();
    this.middlewares = [];
    this.errorHandlers = [];
    this.server = null;
  }

  /**
   * 라우트 등록
   * register('GET', '/api/counter', handler)
   */
  register(method, path, handler) {
    const key = `${method} ${path}`;
    this.routes.set(key, handler);
  }

  /**
   * 편의 메서드
   */
  get(path, handler) {
    this.register('GET', path, handler);
  }

  post(path, handler) {
    this.register('POST', path, handler);
  }

  put(path, handler) {
    this.register('PUT', path, handler);
  }

  patch(path, handler) {
    this.register('PATCH', path, handler);
  }

  delete(path, handler) {
    this.register('DELETE', path, handler);
  }

  /**
   * 미들웨어 등록
   */
  use(middleware) {
    this.middlewares.push(middleware);
  }

  /**
   * 에러 핸들러 등록
   */
  onError(handler) {
    this.errorHandlers.push(handler);
  }

  /**
   * 경로 매칭 (동적 세그먼트 지원)
   * /api/todos/:id → /api/todos/123
   */
  matchRoute(method, pathname) {
    // 정확한 매칭 먼저 시도
    const exactKey = `${method} ${pathname}`;
    if (this.routes.has(exactKey)) {
      return { handler: this.routes.get(exactKey), params: {} };
    }

    // 동적 세그먼트 매칭
    for (const [key, handler] of this.routes) {
      const [keyMethod, keyPath] = key.split(' ');
      if (keyMethod !== method) continue;

      const patternSegments = keyPath.split('/');
      const pathSegments = pathname.split('/');

      if (patternSegments.length !== pathSegments.length) continue;

      const params = {};
      let matches = true;

      for (let i = 0; i < patternSegments.length; i++) {
        const pattern = patternSegments[i];
        const segment = pathSegments[i];

        if (pattern.startsWith(':')) {
          // 동적 파라미터
          params[pattern.slice(1)] = segment;
        } else if (pattern !== segment) {
          // 정적 세그먼트가 맞지 않음
          matches = false;
          break;
        }
      }

      if (matches) {
        return { handler, params };
      }
    }

    return null;
  }

  /**
   * 요청 본문 파싱
   */
  parseBody(req) {
    return new Promise((resolve) => {
      let body = '';

      req.on('data', (chunk) => {
        body += chunk.toString();
      });

      req.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve(parsed);
        } catch {
          resolve({});
        }
      });
    });
  }

  /**
   * 응답 전송
   */
  sendResponse(res, statusCode, data) {
    res.writeHead(statusCode, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });

    res.end(JSON.stringify({
      status: statusCode >= 400 ? 'error' : 'success',
      statusCode,
      data,
      timestamp: new Date().toISOString(),
    }));
  }

  /**
   * 에러 응답
   */
  sendError(res, statusCode, message, details = null) {
    res.writeHead(statusCode, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });

    res.end(JSON.stringify({
      status: 'error',
      statusCode,
      error: message,
      details,
      timestamp: new Date().toISOString(),
    }));
  }

  /**
   * 요청 로깅
   */
  logRequest(method, pathname, statusCode, duration) {
    const timestamp = new Date().toISOString();
    const durationMs = `${duration.toFixed(2)}ms`;
    const color = statusCode >= 400 ? '❌' : statusCode >= 300 ? '⚠️' : '✅';

    console.log(
      `${color} [${timestamp}] ${method} ${pathname} - ${statusCode} (${durationMs})`
    );
  }

  /**
   * 서버 시작
   */
  start() {
    this.server = http.createServer(async (req, res) => {
      const startTime = Date.now();
      const parsedUrl = url.parse(req.url, true);
      const pathname = parsedUrl.pathname;
      const query = parsedUrl.query;

      // OPTIONS 요청 처리 (CORS preflight)
      if (req.method === 'OPTIONS') {
        res.writeHead(200, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        });
        res.end();
        return;
      }

      try {
        // 요청 컨텍스트 생성
        const context = {
          method: req.method,
          pathname,
          query,
          headers: req.headers,
          url: req.url,
          body: null,
        };

        // 본문 파싱 (POST, PUT, PATCH)
        if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
          context.body = await this.parseBody(req);
        }

        // 미들웨어 실행
        for (const middleware of this.middlewares) {
          const result = await middleware(context, req, res);
          if (result === false) {
            // 미들웨어가 응답을 직접 처리함
            const duration = Date.now() - startTime;
            this.logRequest(req.method, pathname, res.statusCode, duration);
            return;
          }
        }

        // 라우트 매칭
        const matched = this.matchRoute(req.method, pathname);

        if (!matched) {
          // 라우트 없음
          this.sendError(res, 404, 'Not Found', {
            method: req.method,
            pathname,
            availableRoutes: Array.from(this.routes.keys()),
          });
        } else {
          // 핸들러 실행
          const { handler, params } = matched;
          const result = await handler(context, params);

          if (result && typeof result === 'object') {
            const statusCode = result.statusCode || 200;
            this.sendResponse(res, statusCode, result.data || result);
          } else {
            this.sendResponse(res, 200, result);
          }
        }
      } catch (error) {
        // 에러 처리
        let statusCode = 500;
        let message = error.message;
        let details = null;

        // 커스텀 에러 핸들러 실행
        for (const handler of this.errorHandlers) {
          const result = handler(error);
          if (result) {
            statusCode = result.statusCode || 500;
            message = result.message || message;
            details = result.details || null;
            break;
          }
        }

        console.error('❌ API Error:', error);
        this.sendError(res, statusCode, message, details);
      } finally {
        // 요청 로깅
        const duration = Date.now() - startTime;
        this.logRequest(req.method, pathname, res.statusCode, duration);
      }
    });

    this.server.listen(this.port, () => {
      console.log(`\n🚀 API Server running on http://localhost:${this.port}`);
      console.log(`📚 Documentation: http://localhost:${this.port}/api/docs\n`);
    });

    return this.server;
  }

  /**
   * 서버 중지
   */
  stop() {
    if (this.server) {
      this.server.close();
      console.log('🛑 API Server stopped');
    }
  }
}

/**
 * 요청 검증 미들웨어
 */
function validateContentType(context) {
  if (['POST', 'PUT', 'PATCH'].includes(context.method)) {
    const contentType = context.headers['content-type'];
    if (contentType && !contentType.includes('application/json')) {
      throw new Error('Content-Type must be application/json');
    }
  }
  return true;
}

/**
 * 요청 로깅 미들웨어
 */
function logMiddleware(context) {
  console.log(`📥 ${context.method} ${context.pathname}`, context.body || '');
  return true;
}

/**
 * 인증 미들웨어 (선택적)
 */
function authMiddleware(context) {
  const authHeader = context.headers.authorization;

  if (!authHeader) {
    context.user = { id: 'anonymous', role: 'guest' };
    return true;
  }

  // Bearer token 파싱
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer') {
    throw new Error('Invalid authorization scheme');
  }

  // 간단한 토큰 검증 (실제로는 JWT 검증)
  context.user = {
    id: token || 'anonymous',
    role: 'user',
  };

  return true;
}

module.exports = {
  APIServer,
  validateContentType,
  logMiddleware,
  authMiddleware,
};
