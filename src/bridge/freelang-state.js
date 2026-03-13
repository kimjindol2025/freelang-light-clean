/**
 * FreeLang State Manager
 * Redux/Vuex를 대체하는 FreeLang 기반 상태 관리
 */

class FreeLangStateManager {
  constructor() {
    this.state = {};
    this.listeners = new Set();
    this.actions = new Map();
    this.history = [];
    this.devtools = null;

    this._setupDevtools();
  }

  /**
   * 상태 정의
   * defineState({ counter: { count: 0 }, todo: { items: [] } })
   */
  defineState(stateDefinition) {
    this.state = this._deepCopy(stateDefinition);
    this._notifyListeners();
  }

  /**
   * 액션 정의
   * defineAction('increment', (state, payload) => { state.count += payload })
   */
  defineAction(name, handler) {
    this.actions.set(name, handler);
  }

  /**
   * 액션 실행
   * dispatch('increment', 5)
   */
  dispatch(actionName, payload) {
    const handler = this.actions.get(actionName);

    if (!handler) {
      console.warn(`⚠️  Action not found: ${actionName}`);
      return false;
    }

    try {
      const prevState = this._deepCopy(this.state);

      // 액션 실행
      handler(this.state, payload);

      // 히스토리 기록
      this.history.push({
        action: actionName,
        payload,
        prevState,
        nextState: this._deepCopy(this.state),
        timestamp: Date.now()
      });

      // 리스너에 알림
      this._notifyListeners();

      // DevTools에 알림
      if (this.devtools) {
        this.devtools.logAction(actionName, payload);
      }

      return true;
    } catch (error) {
      console.error(`❌ Action failed: ${actionName}`, error);
      return false;
    }
  }

  /**
   * 상태 조회
   * getState() 또는 getState('counter.count')
   */
  getState(path) {
    if (!path) {
      return this._deepCopy(this.state);
    }

    const keys = path.split('.');
    let value = this.state;

    for (const key of keys) {
      value = value[key];
      if (value === undefined) return null;
    }

    return this._deepCopy(value);
  }

  /**
   * 상태 변경 감시
   * subscribe(() => console.log('State changed'))
   */
  subscribe(listener) {
    this.listeners.add(listener);

    // 구독 해제 함수 반환
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 특정 경로의 상태 변경 감시
   * watch('counter.count', (newValue, oldValue) => { ... })
   */
  watch(path, callback) {
    let previousValue = this.getState(path);

    const unsubscribe = this.subscribe(() => {
      const newValue = this.getState(path);

      if (JSON.stringify(newValue) !== JSON.stringify(previousValue)) {
        callback(newValue, previousValue);
        previousValue = newValue;
      }
    });

    return unsubscribe;
  }

  /**
   * 커밋 (동기적 상태 변경)
   * commit('counter/increment', 5)
   */
  commit(mutationName, payload) {
    return this.dispatch(mutationName, payload);
  }

  /**
   * 상태 리셋
   */
  reset() {
    this.state = {};
    this.history = [];
    this._notifyListeners();
  }

  /**
   * 히스토리 조회
   */
  getHistory(limit = 10) {
    return this.history.slice(-limit);
  }

  /**
   * 타임 트래블 (특정 시점으로 돌아가기)
   */
  timeTravel(index) {
    if (index < 0 || index >= this.history.length) {
      console.warn(`⚠️  Invalid history index: ${index}`);
      return false;
    }

    const entry = this.history[index];
    this.state = this._deepCopy(entry.nextState);
    this._notifyListeners();
    return true;
  }

  /**
   * 상태 스냅샷 저장
   */
  snapshot() {
    return {
      state: this._deepCopy(this.state),
      timestamp: Date.now()
    };
  }

  /**
   * 스냅샷으로 복원
   */
  restore(snapshot) {
    this.state = this._deepCopy(snapshot.state);
    this._notifyListeners();
  }

  /**
   * 리스너 알림
   */
  _notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this._deepCopy(this.state));
      } catch (error) {
        console.error('Error in listener:', error);
      }
    });
  }

  /**
   * 깊은 복사
   */
  _deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * DevTools 설정 (미니멀)
   */
  _setupDevtools() {
    if (typeof window !== 'undefined' && window.__FREELANG_DEVTOOLS__) {
      this.devtools = window.__FREELANG_DEVTOOLS__;
    }
  }

  /**
   * 상태 로그 (개발용)
   */
  debugLog() {
    console.log('📊 FreeLang State:');
    console.log(this.state);
    console.log('\n📜 History:');
    this.history.forEach((entry, i) => {
      console.log(`  [${i}] ${entry.action}:`, entry.payload);
    });
  }
}

/**
 * 싱글톤 인스턴스
 */
const globalStateManager = new FreeLangStateManager();

module.exports = {
  FreeLangStateManager,
  globalStateManager,
  createStore: (definition) => {
    const store = new FreeLangStateManager();
    store.defineState(definition);
    return store;
  }
};
