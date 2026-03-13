/**
 * Next.js App Component (_app.tsx)
 * Entry point for all pages in the application
 *
 * Demonstrates:
 * - Global FreeLang state initialization
 * - Global action registration
 * - Provider setup for entire app
 * - Shared state across pages
 */

import React, { ReactElement, ReactNode } from 'react';
import type { NextPage } from 'next';
import type { AppProps } from 'next/app';
import { FreeLangProvider } from '@/bridge/context';
import '../styles/globals.css';

/**
 * Global application state definition
 * Accessible to all pages and components
 */
const globalAppState = {
  // Counter module
  counter: {
    count: 0,
    lastUpdate: null as number | null,
  },

  // User module (example)
  user: {
    id: null as string | null,
    name: '',
    email: '',
    role: 'guest',
    authenticated: false,
  },

  // UI state module
  ui: {
    sidebarOpen: true,
    theme: 'light',
    notifications: [] as Array<{ id: string; message: string; type: string }>,
  },

  // App metadata
  meta: {
    initialized: false,
    appVersion: '1.0.0',
    buildTime: new Date().toISOString(),
  },
};

/**
 * Global action handlers
 * Available throughout the entire application
 */
const globalActions = {
  // Counter actions
  'counter/increment': (state: any, payload: number = 1) => {
    state.counter.count += payload;
    state.counter.lastUpdate = Date.now();
  },

  'counter/decrement': (state: any, payload: number = 1) => {
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

  // User actions
  'user/login': (state: any, payload: { id: string; name: string; email: string; role: string }) => {
    state.user.id = payload.id;
    state.user.name = payload.name;
    state.user.email = payload.email;
    state.user.role = payload.role;
    state.user.authenticated = true;
  },

  'user/logout': (state: any) => {
    state.user.id = null;
    state.user.name = '';
    state.user.email = '';
    state.user.role = 'guest';
    state.user.authenticated = false;
  },

  'user/updateProfile': (state: any, payload: { name?: string; email?: string; role?: string }) => {
    if (payload.name) state.user.name = payload.name;
    if (payload.email) state.user.email = payload.email;
    if (payload.role) state.user.role = payload.role;
  },

  // UI actions
  'ui/toggleSidebar': (state: any) => {
    state.ui.sidebarOpen = !state.ui.sidebarOpen;
  },

  'ui/setSidebar': (state: any, payload: boolean) => {
    state.ui.sidebarOpen = payload;
  },

  'ui/setTheme': (state: any, payload: 'light' | 'dark') => {
    state.ui.theme = payload;
  },

  'ui/addNotification': (state: any, payload: { message: string; type?: string }) => {
    const id = `notif-${Date.now()}`;
    state.ui.notifications.push({
      id,
      message: payload.message,
      type: payload.type || 'info',
    });
  },

  'ui/removeNotification': (state: any, payload: string) => {
    state.ui.notifications = state.ui.notifications.filter((n: any) => n.id !== payload);
  },

  'ui/clearNotifications': (state: any) => {
    state.ui.notifications = [];
  },

  // Meta actions
  'meta/setInitialized': (state: any, payload: boolean) => {
    state.meta.initialized = payload;
  },
};

/**
 * Extended Next.js Page type with Layout support
 */
type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

/**
 * Extended App Props with Layout support
 */
type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

/**
 * App Component
 */
function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  // Get layout from component if available
  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <FreeLangProvider stateDefinition={globalAppState} actions={globalActions}>
      <AppContainer>
        {getLayout(<Component {...pageProps} />)}
      </AppContainer>
    </FreeLangProvider>
  );
}

/**
 * App Container Component
 * Wrapper for app-wide features (layout, theme, etc.)
 */
function AppContainer({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <div className="app-container">{children}</div>;
}

export default MyApp;

/**
 * Global Styles (inline for clarity)
 * Normally would be in separate CSS file
 */
const globalStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background: #f5f5f5;
    color: #333;
  }

  body.dark-mode {
    background: #1e1e1e;
    color: #f0f0f0;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button {
    font-family: inherit;
  }

  .app-container {
    min-height: 100vh;
  }
`;
