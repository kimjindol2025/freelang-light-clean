# FreeLang + Next.js Bridge Guide

**Complete Guide to Integrating FreeLang State Management with React/Next.js**

---

## 📚 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Components](#core-components)
3. [Setup Instructions](#setup-instructions)
4. [Usage Patterns](#usage-patterns)
5. [Advanced Features](#advanced-features)
6. [Examples](#examples)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────┐
│     Next.js Application (_app.tsx)      │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   FreeLangProvider (Context)    │   │
│  │                                 │   │
│  │  ┌─────────────────────────┐   │   │
│  │  │  globalStateManager     │   │   │
│  │  │  (FreeLangStateManager) │   │   │
│  │  │                         │   │   │
│  │  │  State:                 │   │   │
│  │  │  - counter              │   │   │
│  │  │  - user                 │   │   │
│  │  │  - ui                   │   │   │
│  │  │                         │   │   │
│  │  │  Actions:               │   │   │
│  │  │  - increment/decrement  │   │   │
│  │  │  - login/logout         │   │   │
│  │  │  - toggleSidebar        │   │   │
│  │  └─────────────────────────┘   │   │
│  │                                 │   │
│  │  ┌─────────────────────────┐   │   │
│  │  │  React Components       │   │   │
│  │  │  (Using Hooks)          │   │   │
│  │  │                         │   │   │
│  │  │  useFreeLang()          │   │   │
│  │  │  useAction()            │   │   │
│  │  │  useSelector()          │   │   │
│  │  │  useWatch()             │   │   │
│  │  │  useHistory()           │   │   │
│  │  └─────────────────────────┘   │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## 🧩 Core Components

### 1. **freelang-state.js** - State Manager

The heart of the state management system. Replaces Redux/Vuex.

```javascript
// Singleton instance
globalStateManager.defineState(stateDefinition)
globalStateManager.defineAction(actionName, handler)
globalStateManager.dispatch(actionName, payload)
globalStateManager.getState(path)
globalStateManager.subscribe(listener)
globalStateManager.watch(path, callback)
globalStateManager.timeTravel(index)
```

**Features**:
- ✅ Redux-like dispatch/subscribe pattern
- ✅ Action history tracking
- ✅ Time-travel debugging
- ✅ Watchers for path-specific changes
- ✅ Immutable updates via deep copying
- ✅ DevTools integration support

### 2. **hooks.js** - React Hooks Integration

12 custom hooks for seamless React integration.

```javascript
const state = useFreeLang(moduleName)
const value = useSelector(selector)
const dispatch = useDispatch()
const action = useAction(actionName)
const actions = useActions(actionMap)
const { loading, error, execute } = useAsyncAction(handler)
useWatch(path, callback)
const history = useHistory(limit)
const { snapshot, save, restore } = useSnapshot()
const store = useStore()
```

### 3. **context.js** - React Context Provider

Makes FreeLang state accessible to entire React tree.

```javascript
<FreeLangProvider stateDefinition={state} actions={actions}>
  <YourApp />
</FreeLangProvider>
```

---

## 🚀 Setup Instructions

### Step 1: Define Global State

In `pages/_app.tsx`:

```typescript
const globalAppState = {
  counter: {
    count: 0,
    lastUpdate: null,
  },
  user: {
    id: null,
    name: '',
    email: '',
    authenticated: false,
  },
  ui: {
    sidebarOpen: true,
    theme: 'light',
    notifications: [],
  },
};
```

### Step 2: Define Global Actions

```typescript
const globalActions = {
  'counter/increment': (state, payload = 1) => {
    state.counter.count += payload;
    state.counter.lastUpdate = Date.now();
  },

  'user/login': (state, payload) => {
    state.user = { ...state.user, ...payload, authenticated: true };
  },

  'ui/addNotification': (state, payload) => {
    state.ui.notifications.push({
      id: `notif-${Date.now()}`,
      message: payload.message,
      type: payload.type || 'info',
    });
  },
};
```

### Step 3: Wrap Application with Provider

```typescript
function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  return (
    <FreeLangProvider stateDefinition={globalAppState} actions={globalActions}>
      <Component {...pageProps} />
    </FreeLangProvider>
  );
}
```

---

## 📖 Usage Patterns

### Pattern 1: Basic State + Dispatch

```typescript
import { useFreeLang } from '@/bridge/hooks';

function Counter() {
  const { count, dispatch } = useFreeLang('counter');

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => dispatch('counter/increment', 1)}>
        +1
      </button>
    </div>
  );
}
```

### Pattern 2: Bound Actions

```typescript
import { useAction } from '@/bridge/hooks';

function Counter() {
  const increment = useAction('counter/increment');
  const decrement = useAction('counter/decrement');

  return (
    <div>
      <button onClick={() => increment(1)}>+1</button>
      <button onClick={() => decrement(1)}>-1</button>
    </div>
  );
}
```

### Pattern 3: Multiple Actions

```typescript
import { useActions } from '@/bridge/hooks';

function Counter() {
  const { increment, decrement, reset } = useActions({
    increment: 'counter/increment',
    decrement: 'counter/decrement',
    reset: 'counter/reset',
  });

  return (
    <div>
      <button onClick={() => increment(1)}>+1</button>
      <button onClick={() => decrement(1)}>-1</button>
      <button onClick={() => reset()}>Reset</button>
    </div>
  );
}
```

### Pattern 4: Selectors (Redux-style)

```typescript
import { useSelector } from '@/bridge/hooks';

function Counter() {
  const count = useSelector(state => state.counter.count);
  const userName = useSelector(state => state.user.name);

  return (
    <div>
      <p>{userName}: {count}</p>
    </div>
  );
}
```

### Pattern 5: Side Effects

```typescript
import { useWatch } from '@/bridge/hooks';
import { useEffect } from 'react';

function Counter() {
  useWatch('counter.count', (newValue, oldValue) => {
    console.log(`Count changed: ${oldValue} → ${newValue}`);
  });

  useEffect(() => {
    // Run when counter changes
  }, [count]);

  return <div>...</div>;
}
```

### Pattern 6: Async Actions

```typescript
import { useAsyncAction } from '@/bridge/hooks';

function TodoList() {
  const { loading, error, execute } = useAsyncAction(async (payload) => {
    const response = await fetch('/api/todos');
    return response.json();
  });

  const loadTodos = async () => {
    const todos = await execute();
    // State updated via action dispatch
  };

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      <button onClick={loadTodos}>Load Todos</button>
    </div>
  );
}
```

### Pattern 7: History & Time-Travel

```typescript
import { useHistory } from '@/bridge/hooks';
import { useStore } from '@/bridge/hooks';

function DebugPanel() {
  const history = useHistory(10);
  const store = useStore();

  const timeTravel = (index) => {
    store.timeTravel(index);
  };

  return (
    <div>
      <h3>Action History</h3>
      {history.map((entry, idx) => (
        <div key={idx} onClick={() => timeTravel(idx)}>
          {entry.action}: {JSON.stringify(entry.payload)}
        </div>
      ))}
    </div>
  );
}
```

### Pattern 8: Snapshots

```typescript
import { useSnapshot } from '@/bridge/hooks';

function StateBackup() {
  const { snapshot, save, restore } = useSnapshot();

  return (
    <div>
      <button onClick={() => save()}>Save State</button>
      <button onClick={() => restore(snapshot)}>Restore</button>
    </div>
  );
}
```

---

## 🔧 Advanced Features

### Feature 1: Dynamic State Initialization

```typescript
function DynamicPage() {
  const { store } = useFreeLangContext();

  useEffect(() => {
    // Initialize module-specific state
    store.defineState({
      pageData: { items: [], loading: false }
    });

    store.defineAction('pageData/setLoading', (state, payload) => {
      state.pageData.loading = payload;
    });
  }, []);

  return <div>...</div>;
}
```

### Feature 2: Middleware-like Side Effects

```typescript
function StateMonitor() {
  useSubscribeToState((state) => {
    // Log all state changes
    console.log('State updated:', state);

    // Send to analytics
    analytics.track('state_changed', state);

    // Sync to server
    api.syncState(state);
  });

  return null;
}
```

### Feature 3: DevTools Integration

```typescript
function App() {
  useDevTools(); // Enables Redux DevTools support

  return <div>...</div>;
}
```

### Feature 4: Persisted State

```typescript
function PersistedApp({ children }) {
  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('appState');
    if (saved) {
      const store = useFreeLangContext().store;
      store.defineState(JSON.parse(saved));
    }
  }, []);

  useSubscribeToState((state) => {
    // Save to localStorage on change
    localStorage.setItem('appState', JSON.stringify(state));
  });

  return <>{children}</>;
}
```

---

## 📝 Examples

### Example 1: Counter Page

See `src/pages/counter.tsx` - Full working example with:
- State definition
- Action handlers
- Multiple hooks usage
- Change logging
- Time-travel history

### Example 2: Todo List (Planned)

```typescript
// State
const todoState = {
  todos: {
    items: [],
    filter: 'all',
  }
};

// Actions
const todoActions = {
  'todos/add': (state, payload) => {
    state.todos.items.push({
      id: Date.now(),
      text: payload,
      done: false,
    });
  },
  'todos/toggle': (state, payload) => {
    const todo = state.todos.items.find(t => t.id === payload);
    if (todo) todo.done = !todo.done;
  },
  'todos/remove': (state, payload) => {
    state.todos.items = state.todos.items.filter(t => t.id !== payload);
  },
  'todos/setFilter': (state, payload) => {
    state.todos.filter = payload;
  },
};

// Component
function TodoApp() {
  const { items, filter, dispatch } = useFreeLang('todos');

  const addTodo = (text) => dispatch('todos/add', text);

  const filtered = items.filter(t => {
    if (filter === 'done') return t.done;
    if (filter === 'pending') return !t.done;
    return true;
  });

  return (
    <div>
      <input onKeyPress={(e) => {
        if (e.key === 'Enter') addTodo(e.target.value);
      }} />
      {filtered.map(todo => (
        <div key={todo.id}>
          <input type="checkbox" checked={todo.done}
            onChange={() => dispatch('todos/toggle', todo.id)} />
          {todo.text}
        </div>
      ))}
    </div>
  );
}
```

---

## ✅ Best Practices

### 1. Module-Based State Organization

```typescript
const appState = {
  // Group related state
  counter: { count: 0 },
  todos: { items: [] },
  user: { id: null, name: '' },
  ui: { theme: 'light' },
};

// Name actions with module prefix
const actions = {
  'counter/increment': ...,
  'todos/add': ...,
  'user/login': ...,
  'ui/setTheme': ...,
};
```

### 2. Normalize State Shape

```typescript
// ❌ Avoid deeply nested state
const bad = {
  users: {
    byId: {
      '1': { id: '1', posts: { byId: { '1': { id: '1', comments: [...] } } } }
    }
  }
};

// ✅ Prefer flat, normalized state
const good = {
  users: { byId: { '1': { id: '1' } } },
  posts: { byId: { '1': { id: '1', userId: '1' } } },
  comments: { byId: { '1': { id: '1', postId: '1' } } },
};
```

### 3. Keep Actions Pure

```typescript
// ✅ Pure actions (only state changes)
'counter/increment': (state, payload) => {
  state.counter.count += payload;
},

// ❌ Avoid side effects in actions
'counter/incrementBad': (state, payload) => {
  state.counter.count += payload;
  fetch('/api/update'); // ❌ Side effect
  localStorage.setItem('count', state.counter.count); // ❌ Side effect
}
```

### 4. Use Selectors for Derived State

```typescript
// ✅ Compute in selectors
const completedTodos = useSelector(state =>
  state.todos.items.filter(t => t.done)
);

// ❌ Avoid storing computed state
const appState = {
  todos: { items: [] },
  completedTodos: [], // ❌ Redundant
};
```

### 5. Type Your State (TypeScript)

```typescript
// Define types
interface CounterState {
  count: number;
  lastUpdate: number | null;
}

interface AppState {
  counter: CounterState;
  user: UserState;
  ui: UIState;
}

// Use in components
const state = useFreeLang('counter') as CounterState;
```

---

## 🔍 Troubleshooting

### Issue: "useFreeLangContext must be used within <FreeLangProvider>"

**Solution**: Ensure component is wrapped with `<FreeLangProvider>`

```typescript
// ✅ Correct
<FreeLangProvider stateDefinition={state} actions={actions}>
  <YourComponent />
</FreeLangProvider>

// ❌ Wrong (context outside provider)
<YourComponent />
<FreeLangProvider stateDefinition={state} actions={actions}>
</FreeLangProvider>
```

### Issue: State changes don't trigger re-renders

**Solution**: Ensure you're mutating the state object directly in actions

```typescript
// ✅ Correct (mutate directly)
'counter/increment': (state, payload) => {
  state.counter.count += payload; // Mutates object
}

// ❌ Wrong (creates new object)
'counter/increment': (state, payload) => {
  state.counter = { ...state.counter, count: state.counter.count + 1 }; // Creates copy
}
```

### Issue: Watchers not firing

**Solution**: Use correct path syntax for nested values

```typescript
// ✅ Correct
useWatch('counter.count', callback);
useWatch('user.name', callback);

// ❌ Wrong
useWatch('counter', callback); // Won't detect nested changes
```

### Issue: Actions not found

**Solution**: Verify action names match when dispatching

```typescript
// Register
globalActions['counter/increment'] = handler;

// Use
dispatch('counter/increment', 5); // ✅ Exact match

// ❌ Wrong names
dispatch('counter/inc', 5);
dispatch('INCREMENT', 5);
```

---

## 📚 Related Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [API Reference](./API_REFERENCE.md)
- [Examples & Tutorials](./EXAMPLES.md)
- [Performance Guide](./PERFORMANCE.md)
- [Testing Guide](./TESTING.md)

---

**Last Updated**: 2026-03-12
**Status**: Phase 1 Complete (Bridge + Context + Examples)
**Next Phase**: Phase 2 - Backend API Integration & SSR Optimization
