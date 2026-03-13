/**
 * Homepage - FreeLang + Next.js Hybrid Stack
 *
 * Sections:
 * - Hero
 * - Features
 * - Live Demo
 * - Technology Stack
 * - Statistics
 * - Call to Action
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAction } from '@/bridge/hooks';

export default function HomePage() {
  const [demoCount, setDemoCount] = useState(0);
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

  // Demo counter (client-side only)
  const incrementDemo = () => setDemoCount(demoCount + 1);
  const decrementDemo = () => setDemoCount(demoCount - 1);

  return (
    <div className="homepage">
      {/* ==================== HERO ==================== */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">🚀 Now Available</div>

          <h1 className="hero-title">
            Build Modern Web Apps with <span className="gradient">FreeLang</span>
          </h1>

          <p className="hero-subtitle">
            Redux 없이도 강력한 상태 관리. React의 단순함 + FreeLang의 효율성 = 최고의 개발 경험
          </p>

          <div className="hero-buttons">
            <Link href="/counter" className="btn btn-primary btn-lg">
              🎮 Live Demo
            </Link>
            <Link href="/blog" className="btn btn-secondary btn-lg">
              📚 Learn More
            </Link>
          </div>

          <div className="hero-stats">
            <div className="stat">
              <div className="stat-value">0</div>
              <div className="stat-label">npm Dependencies</div>
            </div>
            <div className="stat">
              <div className="stat-value">15</div>
              <div className="stat-label">API Endpoints</div>
            </div>
            <div className="stat">
              <div className="stat-value">20</div>
              <div className="stat-label">Tests (100% Pass)</div>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="code-window">
            <div className="code-header">
              <span className="code-title">✨ Example Code</span>
            </div>
            <pre className="code-body">{`const { count, dispatch } =
  useFreeLang('counter')

const increment =
  useAction('counter/increment')

return (
  <button onClick={() => increment(1)}>
    Count: {count}
  </button>
)`}</pre>
          </div>
        </div>
      </section>

      {/* ==================== FEATURES ==================== */}
      <section className="features">
        <h2>Why FreeLang?</h2>

        <div className="features-grid">
          {[
            {
              id: 'zero-deps',
              icon: '📦',
              title: 'Zero Dependencies',
              desc: 'No Redux, no Zustand, no Jotai. Just pure React + FreeLang',
            },
            {
              id: 'type-safe',
              icon: '✅',
              title: 'Type Safe',
              desc: 'Full TypeScript support with complete type inference',
            },
            {
              id: 'time-travel',
              icon: '⏰',
              title: 'Time Travel Debugging',
              desc: 'Built-in action history and state replay',
            },
            {
              id: 'ssr',
              icon: '⚡',
              title: 'SSR Ready',
              desc: 'Next.js server-side rendering out of the box',
            },
            {
              id: 'api',
              icon: '🔌',
              title: '15 API Endpoints',
              desc: 'Ready-to-use REST API with Counter & Todo',
            },
            {
              id: 'tested',
              icon: '🧪',
              title: '100% Test Coverage',
              desc: '20 integration tests, all passing',
            },
          ].map((feature) => (
            <div
              key={feature.id}
              className="feature-card"
              onMouseEnter={() => setHoveredFeature(feature.id)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
              {hoveredFeature === feature.id && (
                <div className="feature-hover">✨ Click to learn more</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ==================== LIVE DEMO ==================== */}
      <section className="live-demo">
        <h2>Try It Out</h2>
        <p className="demo-subtitle">
          Simple counter demo showing state management in action
        </p>

        <div className="demo-container">
          <div className="demo-counter">
            <div className="demo-display">{demoCount}</div>

            <div className="demo-buttons">
              <button className="btn btn-outline" onClick={decrementDemo}>
                − Decrease
              </button>
              <button className="btn btn-outline" onClick={incrementDemo}>
                + Increase
              </button>
            </div>

            <p className="demo-code">
              const [count, setCount] = useState({demoCount})
            </p>
          </div>

          <div className="demo-description">
            <h3>How It Works</h3>
            <ol>
              <li>State is managed by FreeLang</li>
              <li>React components use custom hooks</li>
              <li>Actions dispatch state changes</li>
              <li>Components re-render automatically</li>
              <li>History is tracked for debugging</li>
            </ol>
            <Link href="/counter" className="btn btn-primary">
              See Full Demo →
            </Link>
          </div>
        </div>
      </section>

      {/* ==================== ARCHITECTURE ==================== */}
      <section className="architecture">
        <h2>Modern Architecture</h2>

        <div className="arch-diagram">
          <div className="arch-layer">
            <div className="layer-label">Browser</div>
            <div className="layer-content">React Components (UI)</div>
          </div>

          <div className="arch-arrow">↓</div>

          <div className="arch-layer">
            <div className="layer-label">Bridge</div>
            <div className="layer-content">12 Custom Hooks + Context</div>
          </div>

          <div className="arch-arrow">↓</div>

          <div className="arch-layer">
            <div className="layer-label">State Management</div>
            <div className="layer-content">FreeLang State Manager</div>
          </div>

          <div className="arch-arrow">↓</div>

          <div className="arch-layer">
            <div className="layer-label">Backend</div>
            <div className="layer-content">REST API + Database</div>
          </div>
        </div>

        <div className="arch-benefits">
          <h3>Benefits</h3>
          <ul>
            <li>🚀 Faster development</li>
            <li>📉 Smaller bundle size</li>
            <li>🧪 Easier testing</li>
            <li>🔍 Better debugging</li>
            <li>📚 Less boilerplate</li>
            <li>🎯 Clear data flow</li>
          </ul>
        </div>
      </section>

      {/* ==================== STATS ==================== */}
      <section className="stats">
        <h2>By The Numbers</h2>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">2,900+</div>
            <div className="stat-text">Lines of Code</div>
          </div>

          <div className="stat-card">
            <div className="stat-number">13</div>
            <div className="stat-text">Created Files</div>
          </div>

          <div className="stat-card">
            <div className="stat-number">15</div>
            <div className="stat-text">API Endpoints</div>
          </div>

          <div className="stat-card">
            <div className="stat-number">20</div>
            <div className="stat-text">Tests (100% Pass)</div>
          </div>

          <div className="stat-card">
            <div className="stat-number">1,000+</div>
            <div className="stat-text">Documentation Lines</div>
          </div>

          <div className="stat-card">
            <div className="stat-number">0</div>
            <div className="stat-text">External Dependencies</div>
          </div>
        </div>
      </section>

      {/* ==================== TECH STACK ==================== */}
      <section className="tech-stack">
        <h2>Technology Stack</h2>

        <div className="tech-grid">
          <div className="tech-category">
            <h3>Frontend</h3>
            <ul>
              <li>React 18+</li>
              <li>Next.js 14+</li>
              <li>TypeScript</li>
              <li>Tailwind CSS</li>
            </ul>
          </div>

          <div className="tech-category">
            <h3>State Management</h3>
            <ul>
              <li>FreeLang State Manager</li>
              <li>React Context API</li>
              <li>12 Custom Hooks</li>
              <li>Time Travel Debugging</li>
            </ul>
          </div>

          <div className="tech-category">
            <h3>Backend</h3>
            <ul>
              <li>Node.js (HTTP Module)</li>
              <li>REST API</li>
              <li>JSON Database</li>
              <li>Auto Persistence</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ==================== CTA ==================== */}
      <section className="cta">
        <h2>Ready to Build?</h2>
        <p>Start building modern web apps with FreeLang + Next.js today</p>

        <div className="cta-buttons">
          <Link href="/counter" className="btn btn-primary btn-lg">
            🚀 Get Started
          </Link>
          <a href="https://github.com/freelang-dev/freelang-hybrid" className="btn btn-secondary btn-lg">
            ⭐ View on GitHub
          </a>
        </div>

        <div className="cta-footer">
          <p>Made with ❤️ by FreeLang Team</p>
          <p>© 2026 FreeLang. All rights reserved.</p>
        </div>
      </section>

      <style jsx>{`
        .homepage {
          width: 100%;
        }

        /* ==================== HERO ==================== */
        .hero {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 6rem 2rem;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
          min-height: 80vh;
        }

        .hero-badge {
          display: inline-block;
          background: rgba(255, 255, 255, 0.2);
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.9rem;
          margin-bottom: 1rem;
          width: fit-content;
        }

        .hero-title {
          font-size: 3.5rem;
          font-weight: 800;
          line-height: 1.2;
          margin-bottom: 1.5rem;
        }

        .hero-title .gradient {
          background: linear-gradient(90deg, #ffd89b 0%, #19547b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          font-size: 1.2rem;
          opacity: 0.95;
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .hero-buttons {
          display: flex;
          gap: 1rem;
          margin-bottom: 3rem;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          display: inline-block;
        }

        .btn-primary {
          background: white;
          color: #667eea;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 2px solid white;
        }

        .btn-secondary:hover {
          background: white;
          color: #667eea;
        }

        .btn-lg {
          padding: 1rem 2rem;
          font-size: 1.1rem;
        }

        .hero-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          margin-top: 3rem;
        }

        .stat {
          text-align: center;
        }

        .stat-value {
          font-size: 2.5rem;
          font-weight: 800;
        }

        .stat-label {
          font-size: 0.9rem;
          opacity: 0.8;
        }

        .code-window {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 12px;
          overflow: hidden;
          backdrop-filter: blur(10px);
        }

        .code-header {
          background: rgba(0, 0, 0, 0.5);
          padding: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .code-title {
          font-size: 0.9rem;
          font-weight: 600;
        }

        .code-body {
          padding: 1.5rem;
          font-family: 'Courier New', monospace;
          font-size: 0.9rem;
          color: #ffd89b;
          margin: 0;
          overflow-x: auto;
        }

        /* ==================== FEATURES ==================== */
        .features {
          padding: 6rem 2rem;
          background: white;
        }

        .features h2,
        .live-demo h2,
        .architecture h2,
        .stats h2,
        .tech-stack h2,
        .cta h2 {
          text-align: center;
          font-size: 2.5rem;
          margin-bottom: 1rem;
          color: #333;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-top: 3rem;
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
        }

        .feature-card {
          background: #f9f9f9;
          padding: 2rem;
          border-radius: 12px;
          border: 2px solid transparent;
          transition: all 0.3s ease;
          position: relative;
          cursor: pointer;
        }

        .feature-card:hover {
          border-color: #667eea;
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.1);
        }

        .feature-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .feature-card h3 {
          font-size: 1.3rem;
          margin-bottom: 0.5rem;
          color: #333;
        }

        .feature-card p {
          color: #666;
          line-height: 1.6;
          margin: 0;
        }

        .feature-hover {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: #667eea;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        /* ==================== LIVE DEMO ==================== */
        .live-demo {
          padding: 6rem 2rem;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }

        .demo-subtitle {
          text-align: center;
          font-size: 1.1rem;
          color: #666;
          margin-bottom: 3rem;
        }

        .demo-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          max-width: 1000px;
          margin: 0 auto;
          align-items: center;
        }

        .demo-counter {
          background: white;
          padding: 3rem;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          text-align: center;
        }

        .demo-display {
          font-size: 4rem;
          font-weight: 800;
          color: #667eea;
          margin-bottom: 2rem;
          font-family: 'Courier New', monospace;
        }

        .demo-buttons {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .btn-outline {
          background: transparent;
          color: #667eea;
          border: 2px solid #667eea;
          flex: 1;
        }

        .btn-outline:hover {
          background: #667eea;
          color: white;
        }

        .demo-code {
          background: #f5f5f5;
          padding: 1rem;
          border-radius: 8px;
          font-family: 'Courier New', monospace;
          font-size: 0.9rem;
          color: #667eea;
          margin: 0;
        }

        .demo-description h3 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          color: #333;
        }

        .demo-description ol {
          text-align: left;
          color: #555;
          line-height: 1.8;
          margin-bottom: 1.5rem;
        }

        /* ==================== ARCHITECTURE ==================== */
        .architecture {
          padding: 6rem 2rem;
          background: white;
        }

        .arch-diagram {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          max-width: 500px;
          margin: 3rem auto;
        }

        .arch-layer {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 1.5rem 3rem;
          border-radius: 8px;
          width: 100%;
          text-align: center;
        }

        .layer-label {
          font-size: 0.85rem;
          opacity: 0.8;
          margin-bottom: 0.5rem;
        }

        .layer-content {
          font-weight: 600;
        }

        .arch-arrow {
          font-size: 2rem;
          color: #667eea;
        }

        .arch-benefits {
          background: #f9f9f9;
          padding: 2rem;
          border-radius: 12px;
          max-width: 600px;
          margin: 2rem auto;
        }

        .arch-benefits h3 {
          margin-top: 0;
          color: #333;
        }

        .arch-benefits ul {
          list-style: none;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .arch-benefits li {
          padding: 0.5rem 0;
          color: #666;
        }

        /* ==================== STATS ==================== */
        .stats {
          padding: 6rem 2rem;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 2rem;
          max-width: 1200px;
          margin: 3rem auto 0;
        }

        .stat-card {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
        }

        .stat-number {
          font-size: 2.5rem;
          font-weight: 800;
          color: #667eea;
          margin-bottom: 0.5rem;
        }

        .stat-text {
          color: #666;
          font-size: 0.95rem;
        }

        /* ==================== TECH STACK ==================== */
        .tech-stack {
          padding: 6rem 2rem;
          background: white;
        }

        .tech-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
          max-width: 1000px;
          margin: 3rem auto;
        }

        .tech-category {
          background: #f9f9f9;
          padding: 2rem;
          border-radius: 12px;
          border-left: 4px solid #667eea;
        }

        .tech-category h3 {
          color: #667eea;
          margin-top: 0;
        }

        .tech-category ul {
          list-style: none;
          padding: 0;
          color: #666;
        }

        .tech-category li {
          padding: 0.5rem 0;
        }

        .tech-category li:before {
          content: '✓ ';
          color: #667eea;
          font-weight: bold;
          margin-right: 0.5rem;
        }

        /* ==================== CTA ==================== */
        .cta {
          padding: 6rem 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
        }

        .cta h2 {
          color: white;
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }

        .cta > p {
          font-size: 1.2rem;
          opacity: 0.95;
          margin-bottom: 2rem;
        }

        .cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 3rem;
          flex-wrap: wrap;
        }

        .cta-footer {
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
        }

        .cta-footer p {
          margin: 0.5rem 0;
        }

        /* ==================== RESPONSIVE ==================== */
        @media (max-width: 768px) {
          .hero {
            grid-template-columns: 1fr;
            padding: 3rem 1rem;
          }

          .hero-title {
            font-size: 2rem;
          }

          .hero-buttons {
            flex-direction: column;
          }

          .features-grid,
          .stats-grid,
          .tech-grid {
            grid-template-columns: 1fr;
          }

          .demo-container {
            grid-template-columns: 1fr;
          }

          .arch-benefits ul {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
