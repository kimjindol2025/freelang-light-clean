/**
 * Global State Manager
 * FreeLang 애플리케이션 전역 상태 관리
 *
 * 기능:
 * - 중앙 상태 저장소
 * - 리액티브 업데이트
 * - 구독 시스템
 * - 영속성 (localStorage)
 * - Computed Properties
 * - Watchers
 */

class GlobalStateManager {
  constructor(initialState = {}, options = {}) {
    this.state = initialState;
    this.listeners = new Set();
    this.computedProperties = new Map();
    this.watchers = new Map();
    this.persistKey = options.persistKey || 'global-state';
    this.shouldPersist = options.persist !== false;
    this.history = [];
    this.historyIndex = -1;
    this.maxHistory = options.maxHistory || 50;
    this.actions = new Map();

    // 초기 상태 로드
    if (this.shouldPersist) {
      this.loadFromStorage();
    }

    // 초기 상태를 히스토리에 추가
    this._addToHistory('init');
  }

  /**
   * 상태 구독
   * @param {Function} listener - 상태 변경 시 호출될 콜백
   * @returns {Function} 구독 해제 함수
   */
  subscribe(listener) {
    this.listeners.add(listener);

    // 구독 해제 함수 반환
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 모든 리스너에게 상태 변경 알림
   * @private
   */
  _notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        console.error('Listener error:', error);
      }
    });

    // Watchers 실행
    this._executeWatchers();
  }

  /**
   * 상태 업데이트
   * @param {Object} updates - 업데이트할 상태 객체
   * @param {string} actionName - 액션 이름 (히스토리 추적용)
   */
  setState(updates, actionName = 'setState') {
    // 히스토리에 추가
    this._addToHistory(actionName);

    // 상태 업데이트
    this.state = {
      ...this.state,
      ...updates,
    };

    // 리스너 알림
    this._notifyListeners();

    // 영속성 저장
    if (this.shouldPersist) {
      this.saveToStorage();
    }
  }

  /**
   * 상태 가져오기
   * @param {string} path - 경로 (예: "user.name")
   * @returns {*} 상태 값
   */
  getState(path) {
    if (!path) return this.state;

    const keys = path.split('.');
    let value = this.state;

    for (const key of keys) {
      if (value && typeof value === 'object') {
        value = value[key];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * 깊은 상태 업데이트
   * @param {string} path - 경로 (예: "user.name")
   * @param {*} value - 새로운 값
   */
  setDeep(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = this.state;

    // 경로 따라 내려가기
    for (const key of keys) {
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }

    // 값 설정
    current[lastKey] = value;

    // 리스너 알림
    this._notifyListeners();

    if (this.shouldPersist) {
      this.saveToStorage();
    }
  }

  /**
   * Computed Property 정의
   * @param {string} name - 컴퓨티드 프로퍼티 이름
   * @param {Function} getter - getter 함수
   */
  defineComputed(name, getter) {
    this.computedProperties.set(name, getter);
  }

  /**
   * Computed Property 값 가져오기
   * @param {string} name - 컴퓨티드 프로퍼티 이름
   * @returns {*} 계산된 값
   */
  getComputed(name) {
    const getter = this.computedProperties.get(name);
    if (!getter) {
      console.warn(`Computed property "${name}" not found`);
      return undefined;
    }
    return getter(this.state);
  }

  /**
   * Watcher 정의
   * @param {string} path - 감시할 경로
   * @param {Function} callback - 변경 시 호출할 콜백
   */
  watch(path, callback) {
    if (!this.watchers.has(path)) {
      this.watchers.set(path, new Set());
    }
    this.watchers.get(path).add(callback);
  }

  /**
   * Watcher 실행
   * @private
   */
  _executeWatchers() {
    for (const [path, callbacks] of this.watchers.entries()) {
      const currentValue = this.getState(path);
      const previousValue = this._getPreviousValue(path);

      if (currentValue !== previousValue) {
        callbacks.forEach(callback => {
          try {
            callback(currentValue, previousValue);
          } catch (error) {
            console.error(`Watcher error for "${path}":`, error);
          }
        });
      }
    }
  }

  /**
   * 이전 값 가져오기
   * @private
   */
  _getPreviousValue(path) {
    if (this.historyIndex > 0) {
      const previousState = this.history[this.historyIndex - 1];
      return this.getStateFromSnapshot(previousState, path);
    }
    return undefined;
  }

  /**
   * 스냅샷에서 상태 가져오기
   * @private
   */
  getStateFromSnapshot(snapshot, path) {
    const keys = path.split('.');
    let value = snapshot;

    for (const key of keys) {
      if (value && typeof value === 'object') {
        value = value[key];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * 액션 정의
   * @param {string} name - 액션 이름
   * @param {Function} handler - 액션 처리 함수
   */
  defineAction(name, handler) {
    this.actions.set(name, handler);
  }

  /**
   * 액션 실행
   * @param {string} name - 액션 이름
   * @param {*} payload - 액션 페이로드
   */
  dispatch(name, payload) {
    const action = this.actions.get(name);
    if (!action) {
      console.warn(`Action "${name}" not found`);
      return;
    }

    const context = {
      state: this.state,
      setState: this.setState.bind(this),
      getState: this.getState.bind(this),
      getComputed: this.getComputed.bind(this),
      dispatch: this.dispatch.bind(this),
    };

    try {
      action(context, payload);
    } catch (error) {
      console.error(`Action "${name}" error:`, error);
    }
  }

  /**
   * 히스토리에 추가
   * @private
   */
  _addToHistory(actionName) {
    // undo 후 새로운 상태 변경 시 미래 히스토리 제거
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    // 현재 상태의 스냅샷 추가
    this.history.push({
      ...this.state,
      __actionName: actionName,
      __timestamp: Date.now(),
    });

    // 히스토리 인덱스 증가
    this.historyIndex++;

    // 최대 히스토리 크기 확인
    if (this.history.length > this.maxHistory) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  /**
   * 실행 취소
   */
  undo() {
    if (this.historyIndex > 1) {
      this.historyIndex--;
      const previousState = this.history[this.historyIndex];
      const { __actionName, __timestamp, ...stateData } = previousState;
      this.state = stateData;
      this._notifyListeners();
      if (this.shouldPersist) {
        this.saveToStorage();
      }
    }
  }

  /**
   * 다시 실행
   */
  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const nextState = this.history[this.historyIndex];
      const { __actionName, __timestamp, ...stateData } = nextState;
      this.state = stateData;
      this._notifyListeners();
      if (this.shouldPersist) {
        this.saveToStorage();
      }
    }
  }

  /**
   * 상태 리셋
   * @param {Object} newState - 새로운 초기 상태
   */
  reset(newState = {}) {
    this.state = newState;
    this.history = [];
    this.historyIndex = -1;
    this._addToHistory('reset');
    this._notifyListeners();
    if (this.shouldPersist) {
      this.saveToStorage();
    }
  }

  /**
   * localStorage에 저장
   */
  saveToStorage() {
    try {
      const stateData = JSON.stringify(this.state);
      localStorage.setItem(this.persistKey, stateData);
    } catch (error) {
      console.error('Failed to save state to storage:', error);
    }
  }

  /**
   * localStorage에서 로드
   */
  loadFromStorage() {
    try {
      const stateData = localStorage.getItem(this.persistKey);
      if (stateData) {
        this.state = JSON.parse(stateData);
      }
    } catch (error) {
      console.error('Failed to load state from storage:', error);
    }
  }

  /**
   * 상태 동결 (불변성)
   */
  freezeState() {
    return Object.freeze(JSON.parse(JSON.stringify(this.state)));
  }

  /**
   * 상태 검증
   * @param {Object} schema - 스키마 객체
   * @returns {Object} 검증 결과
   */
  validate(schema) {
    const errors = [];

    for (const [key, rule] of Object.entries(schema)) {
      const value = this.state[key];

      // 타입 검사
      if (rule.type && typeof value !== rule.type) {
        errors.push(`"${key}" should be ${rule.type}, got ${typeof value}`);
      }

      // 필수 검사
      if (rule.required && value === undefined) {
        errors.push(`"${key}" is required`);
      }

      // 커스텀 검증
      if (rule.validate && !rule.validate(value)) {
        errors.push(`"${key}" validation failed`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 상태 복사
   */
  clone() {
    return new GlobalStateManager(JSON.parse(JSON.stringify(this.state)), {
      persist: this.shouldPersist,
      persistKey: this.persistKey,
    });
  }

  /**
   * 통계 정보
   */
  getStats() {
    return {
      stateSize: Object.keys(this.state).length,
      listenerCount: this.listeners.size,
      computedCount: this.computedProperties.size,
      watcherCount: this.watchers.size,
      actionCount: this.actions.size,
      historyLength: this.history.length,
      currentHistoryIndex: this.historyIndex,
      isPersisted: this.shouldPersist,
    };
  }

  /**
   * 상태 변경 로그 활성화
   */
  enableLogging() {
    this.subscribe(newState => {
      console.log('[GlobalState]', newState);
    });
  }

  /**
   * 상태 변경 로그 비활성화
   */
  disableLogging() {
    // 로그 리스너 제거
  }
}

module.exports = GlobalStateManager;
