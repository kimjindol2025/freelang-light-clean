#!/usr/bin/env node

/**
 * Backend Server - Main Entry Point
 *
 * Starts REST API server with:
 * - Counter CRUD operations
 * - Todo CRUD operations
 * - Health checks
 * - 0 npm dependencies (pure Node.js)
 */

const { APIServer, validateContentType, logMiddleware, authMiddleware } = require('./api');
const { Database } = require('./db');
const { CounterHandler, TodoHandler, HealthHandler } = require('./handlers');

// Port configuration
const PORT = process.env.PORT || 3001;

/**
 * Initialize Server
 */
async function initializeServer() {
  console.log('\n🚀 Initializing FreeLang Backend Server...\n');

  // Initialize database
  const db = new Database('./data/db.json');
  console.log('✅ Database initialized\n');

  // Initialize API server
  const api = new APIServer(PORT);

  // Register middlewares
  api.use(validateContentType);
  api.use(logMiddleware);
  api.use(authMiddleware);

  // Error handler
  api.onError((error) => {
    if (error.statusCode) {
      return {
        statusCode: error.statusCode,
        message: error.message,
      };
    }

    console.error('❌ Unhandled error:', error);
    return {
      statusCode: 500,
      message: 'Internal Server Error',
      details: error.message,
    };
  });

  // Initialize handlers
  const counterHandler = new CounterHandler(db);
  const todoHandler = new TodoHandler(db);
  const healthHandler = new HealthHandler(db);

  // Initialize data
  counterHandler.init();

  // ==================== COUNTER ROUTES ====================

  api.get('/api/counter', (context) => counterHandler.getCounter(context));

  api.post('/api/counter/increment', (context) =>
    counterHandler.increment(context)
  );

  api.post('/api/counter/decrement', (context) =>
    counterHandler.decrement(context)
  );

  api.post('/api/counter/reset', (context) => counterHandler.reset(context));

  api.post('/api/counter/set', (context) => counterHandler.setCount(context));

  api.get('/api/counter/history', (context) =>
    counterHandler.getHistory(context)
  );

  // ==================== TODO ROUTES ====================

  api.get('/api/todos', (context, params) => todoHandler.getTodos(context, params));

  api.get('/api/todos/:id', (context, params) =>
    todoHandler.getTodoById(context, params)
  );

  api.post('/api/todos', (context, params) =>
    todoHandler.createTodo(context, params)
  );

  api.patch('/api/todos/:id', (context, params) =>
    todoHandler.updateTodo(context, params)
  );

  api.post('/api/todos/:id/toggle', (context, params) =>
    todoHandler.toggleTodo(context, params)
  );

  api.delete('/api/todos/:id', (context, params) =>
    todoHandler.deleteTodo(context, params)
  );

  api.delete('/api/todos', (context, params) =>
    todoHandler.clearTodos(context, params)
  );

  api.get('/api/todos/stats', (context, params) =>
    todoHandler.getStats(context, params)
  );

  // ==================== HEALTH ROUTES ====================

  api.get('/api/health', (context) => healthHandler.check(context));

  api.get('/api/docs', (context) => healthHandler.getDocs(context));

  // ==================== ROOT REDIRECT ====================

  api.get('/', () => ({
    statusCode: 200,
    data: {
      message: 'FreeLang Backend API',
      version: '1.0.0',
      docs: 'http://localhost:' + PORT + '/api/docs',
    },
  }));

  // Start server
  const server = api.start();

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('\n⏹️  Shutting down gracefully...');
    server.close(() => {
      console.log('✅ Server stopped');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('\n⏹️  Shutting down gracefully...');
    server.close(() => {
      console.log('✅ Server stopped');
      process.exit(0);
    });
  });

  return { api, db, server };
}

/**
 * Main
 */
if (require.main === module) {
  initializeServer().catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });
}

module.exports = { initializeServer };
