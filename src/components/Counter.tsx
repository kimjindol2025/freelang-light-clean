/**
 * Counter Component Example
 * Demonstrates FreeLang state management with React/Next.js
 *
 * Shows:
 * - useFreeLang() hook for state + dispatch
 * - useAction() hook for bound action handlers
 * - useHistory() hook for time-travel debugging
 * - useWatch() hook for side effects
 */

'use client';

import React, { useState } from 'react';
import { useFreeLang, useAction, useHistory, useWatch } from '@/bridge/hooks';

interface CounterState {
  count: number;
  lastUpdate: number;
}

export default function Counter() {
  // Get state and dispatch from FreeLang
  const { count = 0, lastUpdate = 0, dispatch } = useFreeLang('counter') as CounterState & {
    dispatch: Function;
  };

  // Bind individual actions
  const increment = useAction('counter/increment');
  const decrement = useAction('counter/decrement');
  const reset = useAction('counter/reset');

  // Get history for debugging
  const history = useHistory(10);

  // Track state changes
  const [changeLog, setChangeLog] = useState<string[]>([]);

  useWatch('counter.count', (newValue, oldValue) => {
    setChangeLog((prev) => [
      ...prev,
      `Count changed: ${oldValue} → ${newValue}`
    ].slice(-5)); // Keep last 5 entries
  });

  const handleIncrement = () => {
    increment(1);
  };

  const handleDecrement = () => {
    decrement(1);
  };

  const handleIncrement5 = () => {
    increment(5);
  };

  const handleReset = () => {
    reset();
  };

  return (
    <div className="counter-container">
      <h1>Counter (FreeLang + React)</h1>

      {/* Current Count Display */}
      <div className="counter-display">
        <div className="count-value">{count}</div>
        <div className="count-meta">
          Last updated: {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'N/A'}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="counter-controls">
        <button onClick={handleDecrement} className="btn btn-secondary">
          − Decrease
        </button>
        <button onClick={handleReset} className="btn btn-warning">
          Reset
        </button>
        <button onClick={handleIncrement} className="btn btn-primary">
          + Increase
        </button>
        <button onClick={handleIncrement5} className="btn btn-success">
          + 5
        </button>
      </div>

      {/* Change Log */}
      {changeLog.length > 0 && (
        <div className="change-log">
          <h3>Change History</h3>
          <ul>
            {changeLog.map((entry, idx) => (
              <li key={idx}>{entry}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Action History (Time-Travel) */}
      {history.length > 0 && (
        <div className="action-history">
          <h3>Action History ({history.length})</h3>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Action</th>
                <th>Payload</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry, idx) => (
                <tr key={idx}>
                  <td>{idx}</td>
                  <td>{entry.action}</td>
                  <td>{JSON.stringify(entry.payload)}</td>
                  <td>{new Date(entry.timestamp).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .counter-container {
          max-width: 600px;
          margin: 2rem auto;
          padding: 2rem;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }

        h1 {
          text-align: center;
          color: #333;
          margin-bottom: 2rem;
        }

        .counter-display {
          text-align: center;
          background: white;
          padding: 2rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .count-value {
          font-size: 4rem;
          font-weight: bold;
          color: #1e90ff;
          font-family: 'Courier New', monospace;
        }

        .count-meta {
          font-size: 0.9rem;
          color: #666;
          margin-top: 0.5rem;
        }

        .counter-controls {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 600;
        }

        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .btn-primary {
          background: #1e90ff;
          color: white;
        }

        .btn-primary:hover {
          background: #1873cc;
        }

        .btn-secondary {
          background: #888;
          color: white;
        }

        .btn-secondary:hover {
          background: #666;
        }

        .btn-warning {
          background: #ff9800;
          color: white;
        }

        .btn-warning:hover {
          background: #e68900;
        }

        .btn-success {
          background: #4caf50;
          color: white;
        }

        .btn-success:hover {
          background: #45a049;
        }

        .change-log {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .change-log h3 {
          margin-top: 0;
          color: #333;
          border-bottom: 2px solid #1e90ff;
          padding-bottom: 0.5rem;
        }

        .change-log ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .change-log li {
          padding: 0.5rem 0;
          color: #555;
          font-family: 'Courier New', monospace;
          font-size: 0.9rem;
          border-left: 3px solid #1e90ff;
          padding-left: 0.75rem;
        }

        .action-history {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow-x: auto;
        }

        .action-history h3 {
          margin-top: 0;
          color: #333;
          border-bottom: 2px solid #4caf50;
          padding-bottom: 0.5rem;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }

        thead {
          background: #f5f5f5;
        }

        th {
          padding: 0.75rem;
          text-align: left;
          font-weight: 600;
          color: #333;
          border-bottom: 2px solid #ddd;
        }

        td {
          padding: 0.75rem;
          border-bottom: 1px solid #eee;
          color: #555;
        }

        tbody tr:hover {
          background: #f9f9f9;
        }

        @media (max-width: 600px) {
          .counter-controls {
            grid-template-columns: 1fr;
          }

          .count-value {
            font-size: 3rem;
          }
        }
      `}</style>
    </div>
  );
}
