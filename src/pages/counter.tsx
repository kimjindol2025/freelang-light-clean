/**
 * Counter Page
 * Demonstrates Full FreeLang + Next.js Integration
 *
 * Features:
 * - FreeLangProvider wrapping the entire page
 * - State definition (counter module)
 * - Action handlers (increment, decrement, reset)
 * - SSR compatibility with Next.js
 */

import React from 'react';
import { FreeLangProvider } from '@/bridge/context';
import Counter from '@/components/Counter';

/**
 * Counter state definition
 */
const counterState = {
  counter: {
    count: 0,
    lastUpdate: null as number | null,
  }
};

/**
 * Counter action handlers
 */
const counterActions = {
  'counter/increment': (state: any, payload: number) => {
    state.counter.count += payload;
    state.counter.lastUpdate = Date.now();
  },

  'counter/decrement': (state: any, payload: number) => {
    state.counter.count -= payload;
    state.counter.lastUpdate = Date.now();
  },

  'counter/reset': (state: any) => {
    state.counter.count = 0;
    state.counter.lastUpdate = Date.now();
  },

  'counter/setCount': (state: any, payload: number) => {
    state.counter.count = payload;
    state.counter.lastUpdate = Date.now();
  },
};

/**
 * CounterPage Component
 */
export default function CounterPage() {
  return (
    <FreeLangProvider stateDefinition={counterState} actions={counterActions}>
      <div className="page-wrapper">
        <header className="page-header">
          <h1>🚀 FreeLang + React/Next.js Counter Demo</h1>
          <p>State management powered by FreeLang, rendered with React</p>
        </header>

        <main className="page-content">
          <Counter />

          <section className="explanation">
            <h2>How It Works</h2>
            <div className="code-section">
              <h3>1. State Definition</h3>
              <pre><code>{`
const counterState = {
  counter: {
    count: 0,
    lastUpdate: null
  }
}
              `}</code></pre>
            </div>

            <div className="code-section">
              <h3>2. Action Handlers</h3>
              <pre><code>{`
const counterActions = {
  'counter/increment': (state, payload) => {
    state.counter.count += payload
    state.counter.lastUpdate = Date.now()
  },
  'counter/decrement': (state, payload) => {
    state.counter.count -= payload
    state.counter.lastUpdate = Date.now()
  },
  'counter/reset': (state) => {
    state.counter.count = 0
    state.counter.lastUpdate = Date.now()
  }
}
              `}</code></pre>
            </div>

            <div className="code-section">
              <h3>3. Provider Setup</h3>
              <pre><code>{`
<FreeLangProvider
  stateDefinition={counterState}
  actions={counterActions}
>
  <Counter />
</FreeLangProvider>
              `}</code></pre>
            </div>

            <div className="code-section">
              <h3>4. Component Usage</h3>
              <pre><code>{`
export function Counter() {
  // Get state and dispatch from FreeLang
  const { count, lastUpdate, dispatch } = useFreeLang('counter')

  // Bind individual actions
  const increment = useAction('counter/increment')
  const decrement = useAction('counter/decrement')
  const reset = useAction('counter/reset')

  // Track changes
  useWatch('counter.count', (newValue, oldValue) => {
    console.log(\`Changed: \${oldValue} → \${newValue}\`)
  })

  return (
    <button onClick={() => increment(1)}>
      Count: {count}
    </button>
  )
}
              `}</code></pre>
            </div>
          </section>

          <section className="benefits">
            <h2>Benefits of This Architecture</h2>
            <ul>
              <li>✅ <strong>Zero Redux</strong> - FreeLang handles all state management</li>
              <li>✅ <strong>Type-Safe</strong> - FreeLang's type system ensures correctness</li>
              <li>✅ <strong>Time-Travel Debugging</strong> - Built-in action history and replay</li>
              <li>✅ <strong>SSR Compatible</strong> - Works seamlessly with Next.js</li>
              <li>✅ <strong>Minimal Dependencies</strong> - Only React, no Redux/Zustand/Jotai</li>
              <li>✅ <strong>Predictable Updates</strong> - Pure action handlers</li>
              <li>✅ <strong>DevTools Support</strong> - Browser DevTools integration ready</li>
              <li>✅ <strong>Async Ready</strong> - useAsyncAction hook for API calls</li>
            </ul>
          </section>

          <section className="next-steps">
            <h2>Next Steps</h2>
            <ol>
              <li>Create more complex state modules (todos, users, etc.)</li>
              <li>Implement async actions with API integration</li>
              <li>Add DevTools browser extension integration</li>
              <li>Create reusable state configuration patterns</li>
              <li>Build full-stack example with backend API</li>
              <li>Implement middleware system for side effects</li>
              <li>Add persistence layer (localStorage/SessionStorage)</li>
              <li>Create testing utilities for FreeLang components</li>
            </ol>
          </section>
        </main>

        <footer className="page-footer">
          <p>
            Built with FreeLang, React 18, and Next.js 14 |
            <a href="https://github.com/freelang-dev/freelang-hybrid" target="_blank" rel="noopener noreferrer">
              {' '}View on GitHub
            </a>
          </p>
        </footer>
      </div>

      <style jsx>{`
        .page-wrapper {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          flex-direction: column;
        }

        .page-header {
          background: rgba(0, 0, 0, 0.3);
          color: white;
          padding: 3rem 1rem;
          text-align: center;
          backdrop-filter: blur(10px);
        }

        .page-header h1 {
          margin: 0;
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }

        .page-header p {
          margin: 0;
          font-size: 1.1rem;
          opacity: 0.9;
        }

        .page-content {
          flex: 1;
          max-width: 1000px;
          margin: 2rem auto;
          width: 100%;
          padding: 0 1rem;
        }

        section {
          background: white;
          padding: 2rem;
          margin-bottom: 2rem;
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        section h2 {
          color: #333;
          border-bottom: 3px solid #667eea;
          padding-bottom: 1rem;
          margin-top: 0;
        }

        .code-section {
          margin-bottom: 2rem;
          padding: 1rem;
          background: #f5f5f5;
          border-left: 4px solid #667eea;
          border-radius: 4px;
        }

        .code-section h3 {
          margin-top: 0;
          color: #667eea;
        }

        pre {
          background: #2d2d2d;
          color: #f8f8f2;
          padding: 1rem;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 0.9rem;
          line-height: 1.5;
          margin: 0;
        }

        code {
          font-family: 'Courier New', monospace;
        }

        .benefits ul {
          list-style: none;
          padding: 0;
        }

        .benefits li {
          padding: 0.75rem 0;
          padding-left: 2rem;
          position: relative;
        }

        .benefits li:before {
          content: '✓';
          position: absolute;
          left: 0;
          color: #4caf50;
          font-weight: bold;
        }

        .next-steps ol {
          padding-left: 1.5rem;
        }

        .next-steps li {
          padding: 0.5rem 0;
          color: #555;
        }

        .page-footer {
          background: rgba(0, 0, 0, 0.3);
          color: white;
          padding: 2rem 1rem;
          text-align: center;
          backdrop-filter: blur(10px);
        }

        .page-footer p {
          margin: 0;
        }

        .page-footer a {
          color: #fff;
          text-decoration: none;
          font-weight: 600;
          border-bottom: 2px solid #fff;
        }

        .page-footer a:hover {
          opacity: 0.8;
        }

        @media (max-width: 768px) {
          .page-header h1 {
            font-size: 1.8rem;
          }

          section {
            padding: 1.5rem;
          }

          pre {
            font-size: 0.8rem;
          }
        }
      `}</style>
    </FreeLangProvider>
  );
}
