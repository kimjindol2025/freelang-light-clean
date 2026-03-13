/**
 * State Router (상태와 라우팅 통합)
 * 라우트별 상태 관리 및 동기화
 *
 * 기능:
 * - 라우트별 상태 격리
 * - 상태 동기화
 * - 캐싱
 * - 라우트 전환 시 상태 자동 복원
 */

const GlobalStateManager = require('./global-state-manager');
const Router = require('./router');

/**
 * RouteState - 라우트 정보 저장소
 */
class RouteState {
  constructor(path, state = {}) {
    this.path = path;
    this.state = state;
    this.stateManager = new GlobalStateManager(state, { persist: false });
    this.timestamp = Date.now();
    this.metadata = {};
  }

  /**
   * 상태 업데이트
   */
  setState(updates) {
    this.stateManager.setState(updates);
  }

  /**
   * 상태 가져오기
   */
  getState(path) {
    return this.stateManager.getState(path);
  }

  /**
   * 전체 상태 가져오기
   */
  getAllState() {
    return this.stateManager.getState();
  }

  /**
   * 메타데이터 설정
   */
  setMetadata(key, value) {
    this.metadata[key] = value;
  }

  /**
   * 메타데이터 가져오기
   */
  getMetadata(key) {
    return this.metadata[key];
  }
}

/**
 * StateRouter - 상태와 라우팅 통합 관리
 */
class StateRouter {
  constructor(routes = [], stateTemplate = {}, options = {}) {
    this.router = new Router(routes, options);
    this.stateTemplate = stateTemplate;
    this.routeStates = new Map(); // path -> RouteState
    this.currentRouteState = null;
    this.globalState = new GlobalStateManager(stateTemplate, {
      persist: options.persist !== false,
    });
    this.cache = new Map(); // 캐시 저장소
    this.listeners = new Set();
    this.maxCacheAge = options.maxCacheAge || 3600000; // 1시간

    // 라우터 구독
    this.router.subscribe((route) => {
      this._onRouteChange(route);
    });
  }

  /**
   * 라우트 변경 처리
   * @private
   */
  _onRouteChange(route) {
    if (!route) return;

    const path = route.path || '/';

    // 기존 라우트 상태 캐시
    if (this.currentRouteState) {
      this.cache.set(this.currentRouteState.path, {
        state: this.currentRouteState.getAllState(),
        timestamp: Date.now(),
      });
    }

    // 새로운 라우트 상태 로드 또는 생성
    if (!this.routeStates.has(path)) {
      const cachedState = this.cache.get(path);
      const initialState = cachedState ? cachedState.state : this.stateTemplate;
      this.routeStates.set(path, new RouteState(path, initialState));
    }

    // 현재 라우트 상태 설정
    this.currentRouteState = this.routeStates.get(path);

    // 글로벌 상태 동기화
    this.globalState.setState(this.currentRouteState.getAllState());

    // 리스너 알림
    this._notifyListeners();
  }

  /**
   * 네비게이션
   */
  async navigate(path, options = {}) {
    return this.router.navigate(path, options);
  }

  /**
   * 현재 라우트 상태 가져오기
   */
  getCurrentRouteState() {
    return this.currentRouteState;
  }

  /**
   * 현재 라우트 상태 업데이트
   */
  updateRouteState(updates) {
    if (this.currentRouteState) {
      this.currentRouteState.setState(updates);
      this.globalState.setState(updates);
      this._notifyListeners();
    }
  }

  /**
   * 특정 라우트 상태 가져오기
   */
  getRouteState(path) {
    return this.routeStates.get(path);
  }

  /**
   * 라우트별 상태 설정
   */
  setRouteState(path, state) {
    if (!this.routeStates.has(path)) {
      this.routeStates.set(path, new RouteState(path, state));
    } else {
      this.routeStates.get(path).setState(state);
    }
  }

  /**
   * 글로벌 상태 구독
   */
  subscribeToGlobalState(listener) {
    return this.globalState.subscribe(listener);
  }

  /**
   * 상태 라우터 변경 구독
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 리스너 알림
   * @private
   */
  _notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener({
          routeState: this.currentRouteState?.getAllState(),
          globalState: this.globalState.getState(),
          currentPath: this.currentRouteState?.path,
        });
      } catch (error) {
        console.error('StateRouter listener error:', error);
      }
    });
  }

  /**
   * 캐시 정리
   */
  cleanCache() {
    const now = Date.now();
    for (const [path, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.maxCacheAge) {
        this.cache.delete(path);
      }
    }
  }

  /**
   * 캐시 정보
   */
  getCacheStats() {
    return {
      cachedRoutes: this.cache.size,
      totalRoutes: this.routeStates.size,
      cacheSize: Array.from(this.cache.values()).reduce(
        (sum, item) => sum + JSON.stringify(item).length,
        0
      ),
    };
  }

  /**
   * 상태 리셋
   */
  reset(newStateTemplate = {}) {
    this.stateTemplate = newStateTemplate;
    this.routeStates.clear();
    this.cache.clear();
    this.globalState.reset(newStateTemplate);
  }

  /**
   * 라우터 통계
   */
  getStats() {
    return {
      routerStats: this.router.getStats(),
      globalStateStats: this.globalState.getStats(),
      routeStateCount: this.routeStates.size,
      cacheStats: this.getCacheStats(),
      currentPath: this.currentRouteState?.path,
    };
  }

  /**
   * 라우트 등록
   */
  registerRoute(path, component, meta = {}) {
    this.router.registerRoute(path, component, meta);
  }

  /**
   * 미들웨어 등록
   */
  use(middleware) {
    this.router.use(middleware);
  }

  /**
   * 라우트 가드 등록
   */
  registerGuard(name, handler) {
    this.router.registerGuard(name, handler);
  }
}

module.exports = StateRouter;
module.exports.RouteState = RouteState;
