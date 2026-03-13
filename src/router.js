/**
 * Router (라우팅 시스템)
 * FreeLang Light SPA 라우팅
 *
 * 기능:
 * - 동적 라우트 정의 및 매칭
 * - 매개변수 추출
 * - 히스토리 관리
 * - 라우트 가드
 * - 리다이렉트
 * - Lazy Loading
 */

class Router {
  constructor(routes = [], options = {}) {
    this.routes = routes;
    this.currentRoute = null;
    this.history = [];
    this.listeners = new Set();
    this.guards = new Map();
    this.middleware = [];
    this.notFoundHandler = options.notFoundHandler || null;
    this.errorHandler = options.errorHandler || null;
    this.baseUrl = options.baseUrl || '/';
    this.mode = options.mode || 'hash'; // 'hash' or 'history'
    this.scrollBehavior = options.scrollBehavior || null;
    this.lazyLoadCache = new Map();

    // 초기 라우트 로드
    this._initializeRouting();
  }

  /**
   * 라우팅 초기화
   * @private
   */
  _initializeRouting() {
    // 초기 URL 파싱
    const path = this._getCurrentPath();
    this.navigate(path);

    // 히스토리 변경 감지
    if (this.mode === 'hash') {
      window.addEventListener('hashchange', () => {
        const path = this._getCurrentPath();
        this.navigate(path);
      });
    } else {
      window.addEventListener('popstate', () => {
        const path = this._getCurrentPath();
        this.navigate(path);
      });
    }
  }

  /**
   * 현재 경로 가져오기
   * @private
   * @returns {string} 현재 경로
   */
  _getCurrentPath() {
    if (this.mode === 'hash') {
      return window.location.hash.slice(1) || '/';
    } else {
      return window.location.pathname;
    }
  }

  /**
   * 라우트 등록
   * @param {string} path - 라우트 경로 (예: "/user/:id")
   * @param {Object} component - 컴포넌트
   * @param {Object} meta - 메타 정보
   */
  registerRoute(path, component, meta = {}) {
    this.routes.push({
      path,
      component,
      meta,
      regex: this._pathToRegex(path),
      params: this._extractParamNames(path),
    });
  }

  /**
   * 경로를 정규식으로 변환
   * @private
   * @param {string} path - 경로
   * @returns {RegExp} 정규식
   */
  _pathToRegex(path) {
    const pattern = path
      .replace(/\//g, '\\/')
      .replace(/:(\w+)/g, '([^\\/]+)');
    return new RegExp(`^${pattern}$`);
  }

  /**
   * 경로에서 매개변수 이름 추출
   * @private
   * @param {string} path - 경로
   * @returns {string[]} 매개변수 이름 배열
   */
  _extractParamNames(path) {
    const matches = path.match(/:(\w+)/g) || [];
    return matches.map(m => m.slice(1));
  }

  /**
   * 라우트 매칭
   * @param {string} path - 경로
   * @returns {Object|null} 매칭된 라우트 정보
   */
  matchRoute(path) {
    for (const route of this.routes) {
      const match = route.regex.exec(path);
      if (match) {
        const params = {};
        route.params.forEach((param, index) => {
          params[param] = match[index + 1];
        });

        return {
          ...route,
          params,
          query: this._parseQuery(),
        };
      }
    }
    return null;
  }

  /**
   * 쿼리 문자열 파싱
   * @private
   * @returns {Object} 쿼리 객체
   */
  _parseQuery() {
    const query = {};
    const params = new URLSearchParams(window.location.search);
    params.forEach((value, key) => {
      query[key] = value;
    });
    return query;
  }

  /**
   * 네비게이션
   * @param {string} path - 네비게이션할 경로
   * @param {Object} options - 옵션
   * @returns {Promise<boolean>} 성공 여부
   */
  async navigate(path, options = {}) {
    const route = this.matchRoute(path);

    if (!route && !this.notFoundHandler) {
      console.warn(`Route not found: ${path}`);
      return false;
    }

    // beforeEnter 가드 실행
    if (route && route.meta.beforeEnter) {
      try {
        const result = await route.meta.beforeEnter(route);
        if (result === false) {
          return false;
        }
      } catch (error) {
        if (this.errorHandler) {
          this.errorHandler(error);
        }
        return false;
      }
    }

    // 미들웨어 실행
    for (const mw of this.middleware) {
      try {
        const result = await mw(route);
        if (result === false) {
          return false;
        }
      } catch (error) {
        if (this.errorHandler) {
          this.errorHandler(error);
        }
        return false;
      }
    }

    // 라우트 변경
    const previousRoute = this.currentRoute;
    this.currentRoute = route || { path, notFound: true };

    // 히스토리 업데이트
    this.history.push({ path, timestamp: Date.now() });

    // URL 업데이트
    if (options.replace) {
      window.history.replaceState(null, '', this._formatUrl(path));
    } else {
      window.history.pushState(null, '', this._formatUrl(path));
    }

    // 스크롤 동작
    if (this.scrollBehavior && !options.noScroll) {
      this.scrollBehavior(this.currentRoute, previousRoute);
    }

    // 리스너 알림
    this._notifyListeners();

    return true;
  }

  /**
   * URL 형식화
   * @private
   * @param {string} path - 경로
   * @returns {string} 형식화된 URL
   */
  _formatUrl(path) {
    if (this.mode === 'hash') {
      return `#${path}`;
    } else {
      return this.baseUrl + path;
    }
  }

  /**
   * 라우트 가드 등록
   * @param {string} name - 가드 이름
   * @param {Function} handler - 가드 처리 함수
   */
  registerGuard(name, handler) {
    this.guards.set(name, handler);
  }

  /**
   * 미들웨어 등록
   * @param {Function} middleware - 미들웨어 함수
   */
  use(middleware) {
    this.middleware.push(middleware);
  }

  /**
   * 리다이렉트
   * @param {string} from - 원본 경로
   * @param {string} to - 대상 경로
   */
  redirect(from, to) {
    const route = this.matchRoute(from);
    if (route) {
      this.navigate(to, { replace: true });
    }
  }

  /**
   * 구독
   * @param {Function} listener - 리스너 함수
   * @returns {Function} 구독 해제 함수
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 리스너 알림
   * @private
   */
  _notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentRoute);
      } catch (error) {
        console.error('Router listener error:', error);
      }
    });
  }

  /**
   * 뒤로 가기
   */
  back() {
    window.history.back();
  }

  /**
   * 앞으로 가기
   */
  forward() {
    window.history.forward();
  }

  /**
   * N번 이동
   * @param {number} n - 이동할 스텝 수 (음수는 뒤로)
   */
  go(n) {
    window.history.go(n);
  }

  /**
   * 현재 라우트 정보
   * @returns {Object} 현재 라우트
   */
  getCurrentRoute() {
    return this.currentRoute;
  }

  /**
   * 라우트 히스토리
   * @returns {Array} 라우트 히스토리
   */
  getHistory() {
    return this.history;
  }

  /**
   * 라우트 생성 (경로 포맷팅)
   * @param {string} name - 라우트 이름 또는 경로
   * @param {Object} params - 매개변수
   * @returns {string} 생성된 경로
   */
  createPath(name, params = {}) {
    let path = name;

    // 매개변수 치환
    for (const [key, value] of Object.entries(params)) {
      path = path.replace(`:${key}`, value);
    }

    return path;
  }

  /**
   * Lazy Loading 컴포넌트
   * @param {Function} loader - 컴포넌트 로더 함수
   * @returns {Function} 래퍼 함수
   */
  lazyLoad(loader) {
    return async () => {
      if (!this.lazyLoadCache.has(loader)) {
        const component = await loader();
        this.lazyLoadCache.set(loader, component);
      }
      return this.lazyLoadCache.get(loader);
    };
  }

  /**
   * 활성 라우트 확인
   * @param {string} path - 확인할 경로
   * @returns {boolean} 활성 여부
   */
  isActive(path) {
    if (!this.currentRoute) return false;
    return this.currentRoute.path === path;
  }

  /**
   * 통계 정보
   */
  getStats() {
    return {
      routeCount: this.routes.length,
      historyLength: this.history.length,
      middlewareCount: this.middleware.length,
      guardCount: this.guards.size,
      currentPath: this.currentRoute?.path || 'none',
    };
  }
}

module.exports = Router;
