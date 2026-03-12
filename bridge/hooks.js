/**
 * React Hooks for FreeLang State Management
 * Redux의 useSelector, useDispatch 같은 기능
 */

import { useState, useEffect, useCallback, useContext } from 'react';
import { globalStateManager } from './freelang-state';

/**
 * useFreeLang: 상태와 액션을 한 번에 가져오기
 *
 * const { count, increment } = useFreeLang('counter')
 */
export function useFreeLang(moduleName) {
  const [state, setState] = useState(() => {
    return globalStateManager.getState(moduleName);
  });

  // 상태 구독
  useEffect(() => {
    const unsubscribe = globalStateManager.watch(moduleName, (newValue) => {
      setState(newValue);
    });

    return unsubscribe;
  }, [moduleName]);

  // 액션을 호출하기 쉬운 형태로 변환
  const actions = useCallback((actionName, payload) => {
    return globalStateManager.dispatch(`${moduleName}/${actionName}`, payload);
  }, [moduleName]);

  return {
    ...state,
    dispatch: actions,
    _raw: state // 원본 상태에 접근 필요시
  };
}

/**
 * useSelector: Redux 패턴 (특정 부분만 구독)
 *
 * const count = useSelector(state => state.counter.count)
 */
export function useSelector(selector) {
  const [selected, setSelected] = useState(() => {
    const state = globalStateManager.getState();
    return selector(state);
  });

  useEffect(() => {
    const unsubscribe = globalStateManager.subscribe((state) => {
      const newSelected = selector(state);
      setSelected(newSelected);
    });

    return unsubscribe;
  }, [selector]);

  return selected;
}

/**
 * useDispatch: Redux 패턴 (액션 디스패치)
 *
 * const dispatch = useDispatch()
 * dispatch('counter/increment', 5)
 */
export function useDispatch() {
  return useCallback((actionName, payload) => {
    return globalStateManager.dispatch(actionName, payload);
  }, []);
}

/**
 * useAction: 액션 핸들러를 쉽게 생성
 *
 * const increment = useAction('counter/increment')
 * increment(5)
 */
export function useAction(actionName) {
  return useCallback((payload) => {
    return globalStateManager.dispatch(actionName, payload);
  }, [actionName]);
}

/**
 * useActions: 여러 액션을 한 번에 바인딩
 *
 * const { increment, decrement } = useActions({
 *   increment: 'counter/increment',
 *   decrement: 'counter/decrement'
 * })
 */
export function useActions(actionMap) {
  const result = {};

  for (const [key, actionName] of Object.entries(actionMap)) {
    result[key] = useCallback((payload) => {
      return globalStateManager.dispatch(actionName, payload);
    }, [actionName]);
  }

  return result;
}

/**
 * useAsyncAction: 비동기 액션 처리
 *
 * const { loading, error, execute } = useAsyncAction(async (payload) => {
 *   return await api.call(payload)
 * })
 */
export function useAsyncAction(asyncHandler) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (payload) => {
    setLoading(true);
    setError(null);

    try {
      const result = await asyncHandler(payload);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.message || 'Unknown error');
      setLoading(false);
      throw err;
    }
  }, [asyncHandler]);

  return { loading, error, execute };
}

/**
 * useWatch: 특정 상태 경로 감시
 *
 * useWatch('counter.count', (newValue, oldValue) => {
 *   console.log(`Changed from ${oldValue} to ${newValue}`)
 * })
 */
export function useWatch(path, callback) {
  useEffect(() => {
    const unsubscribe = globalStateManager.watch(path, callback);
    return unsubscribe;
  }, [path, callback]);
}

/**
 * useHistory: 상태 변경 히스토리
 *
 * const history = useHistory(10)
 */
export function useHistory(limit = 10) {
  const [history, setHistory] = useState(() => {
    return globalStateManager.getHistory(limit);
  });

  useEffect(() => {
    // 히스토리는 액션 실행 후 자동 업데이트
    const unsubscribe = globalStateManager.subscribe(() => {
      setHistory(globalStateManager.getHistory(limit));
    });

    return unsubscribe;
  }, [limit]);

  return history;
}

/**
 * useSnapshot: 현재 상태 스냅샷
 *
 * const snapshot = useSnapshot()
 */
export function useSnapshot() {
  const [snapshot, setSnapshot] = useState(() => {
    return globalStateManager.snapshot();
  });

  const saveSnapshot = useCallback(() => {
    const newSnapshot = globalStateManager.snapshot();
    setSnapshot(newSnapshot);
    return newSnapshot;
  }, []);

  const restoreSnapshot = useCallback((snapshotData) => {
    globalStateManager.restore(snapshotData);
    setSnapshot(snapshotData);
  }, []);

  return {
    snapshot,
    save: saveSnapshot,
    restore: restoreSnapshot
  };
}

/**
 * useStore: 전체 저장소 접근
 *
 * const store = useStore()
 * store.dispatch('action', payload)
 */
export function useStore() {
  return globalStateManager;
}

/**
 * withStore: HOC (함수형 컴포넌트가 아닌 경우)
 *
 * export default withStore(MyComponent)
 */
export function withStore(Component) {
  return (props) => {
    const store = useStore();
    return <Component {...props} store={store} />;
  };
}
