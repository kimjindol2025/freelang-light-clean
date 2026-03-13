/**
 * React Context for FreeLang State Management
 * Wraps globalStateManager and makes it accessible to all components
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { globalStateManager } from './freelang-state';

/**
 * Create context for FreeLang store
 */
const FreeLangContext = createContext(null);

/**
 * FreeLangProvider: Wraps your app and initializes FreeLang state
 *
 * Usage:
 * <FreeLangProvider stateDefinition={{ counter: { count: 0 }, todos: { items: [] } }}>
 *   <MyApp />
 * </FreeLangProvider>
 */
export function FreeLangProvider({ children, stateDefinition = {}, actions = {} }) {
  const [initialized, setInitialized] = useState(false);
  const [providerState, setProviderState] = useState(null);

  // Initialize state on mount
  useEffect(() => {
    if (stateDefinition && Object.keys(stateDefinition).length > 0) {
      globalStateManager.defineState(stateDefinition);
    }

    // Register actions
    for (const [actionName, handler] of Object.entries(actions)) {
      globalStateManager.defineAction(actionName, handler);
    }

    // Subscribe to state changes
    const unsubscribe = globalStateManager.subscribe((state) => {
      setProviderState(state);
    });

    setInitialized(true);

    // Cleanup on unmount
    return unsubscribe;
  }, [stateDefinition, actions]);

  if (!initialized) {
    return <div>Loading...</div>; // or custom loading component
  }

  return (
    <FreeLangContext.Provider value={{ store: globalStateManager, state: providerState }}>
      {children}
    </FreeLangContext.Provider>
  );
}

/**
 * useFreeLangContext: Direct access to FreeLang context
 *
 * const { store, state } = useFreeLangContext()
 */
export function useFreeLangContext() {
  const context = useContext(FreeLangContext);

  if (!context) {
    throw new Error(
      'useFreeLangContext must be used within <FreeLangProvider>. ' +
      'Did you forget to wrap your app with <FreeLangProvider>?'
    );
  }

  return context;
}

/**
 * withFreeLangProvider: HOC to wrap component with provider
 *
 * export default withFreeLangProvider(MyComponent, stateDefinition, actions)
 */
export function withFreeLangProvider(Component, stateDefinition = {}, actions = {}) {
  return (props) => (
    <FreeLangProvider stateDefinition={stateDefinition} actions={actions}>
      <Component {...props} />
    </FreeLangProvider>
  );
}

/**
 * useInitializeFreeLang: Initialize state and actions programmatically
 * Useful for dynamic initialization
 *
 * useInitializeFreeLang({ counter: { count: 0 } }, { 'counter/increment': handler })
 */
export function useInitializeFreeLang(stateDefinition, actionsMap) {
  useEffect(() => {
    if (stateDefinition) {
      globalStateManager.defineState(stateDefinition);
    }

    if (actionsMap) {
      for (const [actionName, handler] of Object.entries(actionsMap)) {
        globalStateManager.defineAction(actionName, handler);
      }
    }
  }, [stateDefinition, actionsMap]);
}

/**
 * useSubscribeToState: Subscribe to entire state changes
 *
 * useSubscribeToState((state) => {
 *   console.log('State changed:', state)
 * })
 */
export function useSubscribeToState(callback) {
  useEffect(() => {
    const unsubscribe = globalStateManager.subscribe(callback);
    return unsubscribe;
  }, [callback]);
}

/**
 * useStateSnapshot: Get current state snapshot
 * Updates on every state change
 */
export function useStateSnapshot() {
  const [snapshot, setSnapshot] = useState(() => globalStateManager.getState());

  useEffect(() => {
    const unsubscribe = globalStateManager.subscribe((state) => {
      setSnapshot(state);
    });

    return unsubscribe;
  }, []);

  return snapshot;
}

/**
 * useActionCreators: Create and memoize action creators
 *
 * const { increment, decrement } = useActionCreators({
 *   increment: 'counter/increment',
 *   decrement: 'counter/decrement'
 * })
 */
export function useActionCreators(actionMap) {
  const creators = {};

  for (const [key, actionName] of Object.entries(actionMap)) {
    creators[key] = useCallback((payload) => {
      return globalStateManager.dispatch(actionName, payload);
    }, [actionName]);
  }

  return creators;
}

/**
 * useAsyncState: Combine async data fetching with FreeLang state
 *
 * const { data, loading, error } = useAsyncState(
 *   'todos/items',
 *   async () => await fetch('/api/todos').then(r => r.json()),
 *   'todos/setItems'
 * )
 */
export function useAsyncState(statePath, fetchFn, updateAction) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(() => globalStateManager.getState(statePath));

  // Watch state path for changes
  useEffect(() => {
    const unsubscribe = globalStateManager.watch(statePath, (newValue) => {
      setData(newValue);
    });

    return unsubscribe;
  }, [statePath]);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      if (updateAction) {
        globalStateManager.dispatch(updateAction, result);
      }
      setData(result);
      return result;
    } catch (err) {
      setError(err.message || 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchFn, updateAction]);

  return { data, loading, error, fetch };
}

/**
 * useDevTools: Connect to Redux DevTools (if available)
 * Enables time-travel debugging in browser DevTools
 */
export function useDevTools() {
  useEffect(() => {
    // Setup DevTools if available
    if (typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION__) {
      const devtools = window.__REDUX_DEVTOOLS_EXTENSION__;

      // Track state changes
      globalStateManager.subscribe((state) => {
        devtools.send('STATE_CHANGE', { state });
      });

      // Enable time-travel
      if (window.__REDUX_DEVTOOLS_EXTENSION__.connect) {
        const devtoolsConnection = devtools.connect();

        devtoolsConnection.subscribe((message) => {
          if (message.type === 'DISPATCH' && message.payload.type === 'JUMP_TO_ACTION') {
            const historyIndex = message.payload.actionId - 1;
            globalStateManager.timeTravel(historyIndex);
          }
        });
      }
    }
  }, []);
}

/**
 * createStoreConfig: Helper to create store configuration
 *
 * const storeConfig = createStoreConfig(
 *   { counter: { count: 0 } },
 *   {
 *     'counter/increment': (state, payload) => { state.counter.count += payload },
 *     'counter/decrement': (state, payload) => { state.counter.count -= payload }
 *   }
 * )
 *
 * return <FreeLangProvider {...storeConfig}><App /></FreeLangProvider>
 */
export function createStoreConfig(initialState, actionsMap) {
  return {
    stateDefinition: initialState,
    actions: actionsMap
  };
}

/**
 * Export context for advanced use cases
 */
export { FreeLangContext, globalStateManager };
