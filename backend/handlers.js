/**
 * API Handlers - Business Logic Layer
 *
 * Handles:
 * - Counter operations
 * - Todo CRUD operations
 * - User authentication
 * - Health checks
 */

/**
 * Counter Handlers
 */
class CounterHandler {
  constructor(db) {
    this.db = db;
    this.collection = db.collection('counter');
  }

  /**
   * Initialize counter
   */
  init() {
    if (this.collection.length() === 0) {
      this.collection.insert({
        id: 'main',
        count: 0,
        name: 'Main Counter',
      });
    }
  }

  /**
   * GET /api/counter
   */
  async getCounter(context, params) {
    this.init();
    const counter = this.collection.findById('main');
    return {
      statusCode: 200,
      data: counter,
    };
  }

  /**
   * POST /api/counter/increment
   */
  async increment(context, params) {
    this.init();
    const amount = context.body?.amount || 1;
    const counter = this.collection.updateById('main', {
      count: this.collection.findById('main').count + amount,
    });

    return {
      statusCode: 200,
      data: {
        message: `Counter incremented by ${amount}`,
        counter,
      },
    };
  }

  /**
   * POST /api/counter/decrement
   */
  async decrement(context, params) {
    this.init();
    const amount = context.body?.amount || 1;
    const counter = this.collection.updateById('main', {
      count: this.collection.findById('main').count - amount,
    });

    return {
      statusCode: 200,
      data: {
        message: `Counter decremented by ${amount}`,
        counter,
      },
    };
  }

  /**
   * POST /api/counter/reset
   */
  async reset(context, params) {
    this.init();
    const counter = this.collection.updateById('main', { count: 0 });

    return {
      statusCode: 200,
      data: {
        message: 'Counter reset',
        counter,
      },
    };
  }

  /**
   * POST /api/counter/set
   */
  async setCount(context, params) {
    this.init();
    const count = context.body?.count;

    if (count === undefined || typeof count !== 'number') {
      throw new Error('Missing or invalid "count" in request body');
    }

    const counter = this.collection.updateById('main', { count });

    return {
      statusCode: 200,
      data: {
        message: `Counter set to ${count}`,
        counter,
      },
    };
  }

  /**
   * GET /api/counter/history
   */
  async getHistory(context, params) {
    // Simple counter history from local state
    // In production, would track changes in database
    const counter = this.collection.findById('main');

    return {
      statusCode: 200,
      data: {
        counter,
        lastUpdated: counter.updatedAt,
      },
    };
  }
}

/**
 * Todo Handlers
 */
class TodoHandler {
  constructor(db) {
    this.db = db;
    this.collection = db.collection('todos');
  }

  /**
   * GET /api/todos
   */
  async getTodos(context, params) {
    const filter = context.query?.filter || 'all';
    let todos = this.collection.findAll();

    if (filter === 'done') {
      todos = todos.filter((t) => t.done);
    } else if (filter === 'pending') {
      todos = todos.filter((t) => !t.done);
    }

    return {
      statusCode: 200,
      data: {
        todos,
        total: todos.length,
        filter,
      },
    };
  }

  /**
   * GET /api/todos/:id
   */
  async getTodoById(context, params) {
    const todo = this.collection.findById(params.id);

    if (!todo) {
      throw Object.assign(new Error('Todo not found'), {
        statusCode: 404,
      });
    }

    return {
      statusCode: 200,
      data: todo,
    };
  }

  /**
   * POST /api/todos
   */
  async createTodo(context, params) {
    const { text, priority } = context.body || {};

    if (!text || typeof text !== 'string') {
      throw new Error('Missing or invalid "text" in request body');
    }

    const todo = this.collection.insert({
      text,
      done: false,
      priority: priority || 'medium',
      tags: [],
    });

    return {
      statusCode: 201,
      data: {
        message: 'Todo created',
        todo,
      },
    };
  }

  /**
   * PATCH /api/todos/:id
   */
  async updateTodo(context, params) {
    const todo = this.collection.findById(params.id);

    if (!todo) {
      throw Object.assign(new Error('Todo not found'), {
        statusCode: 404,
      });
    }

    const updates = context.body || {};
    const updated = this.collection.updateById(params.id, updates);

    return {
      statusCode: 200,
      data: {
        message: 'Todo updated',
        todo: updated,
      },
    };
  }

  /**
   * POST /api/todos/:id/toggle
   */
  async toggleTodo(context, params) {
    const todo = this.collection.findById(params.id);

    if (!todo) {
      throw Object.assign(new Error('Todo not found'), {
        statusCode: 404,
      });
    }

    const updated = this.collection.updateById(params.id, { done: !todo.done });

    return {
      statusCode: 200,
      data: {
        message: `Todo marked as ${updated.done ? 'done' : 'pending'}`,
        todo: updated,
      },
    };
  }

  /**
   * DELETE /api/todos/:id
   */
  async deleteTodo(context, params) {
    const exists = this.collection.findById(params.id);

    if (!exists) {
      throw Object.assign(new Error('Todo not found'), {
        statusCode: 404,
      });
    }

    const success = this.collection.deleteById(params.id);

    return {
      statusCode: success ? 200 : 404,
      data: {
        message: 'Todo deleted',
        id: params.id,
      },
    };
  }

  /**
   * DELETE /api/todos
   */
  async clearTodos(context, params) {
    const count = this.collection.length();
    this.collection.clear();

    return {
      statusCode: 200,
      data: {
        message: `${count} todos cleared`,
        count,
      },
    };
  }

  /**
   * GET /api/todos/stats
   */
  async getStats(context, params) {
    const todos = this.collection.findAll();
    const stats = {
      total: todos.length,
      done: todos.filter((t) => t.done).length,
      pending: todos.filter((t) => !t.done).length,
      byPriority: {
        high: todos.filter((t) => t.priority === 'high').length,
        medium: todos.filter((t) => t.priority === 'medium').length,
        low: todos.filter((t) => t.priority === 'low').length,
      },
    };

    return {
      statusCode: 200,
      data: stats,
    };
  }
}

/**
 * Health Check Handlers
 */
class HealthHandler {
  constructor(db) {
    this.db = db;
    this.startTime = Date.now();
  }

  /**
   * GET /api/health
   */
  async check(context, params) {
    const uptime = Date.now() - this.startTime;
    const stats = this.db.stats();

    return {
      statusCode: 200,
      data: {
        status: 'healthy',
        uptime: `${(uptime / 1000).toFixed(2)}s`,
        timestamp: new Date().toISOString(),
        database: stats,
      },
    };
  }

  /**
   * GET /api/docs
   */
  async getDocs(context, params) {
    return {
      statusCode: 200,
      data: {
        title: 'FreeLang + Next.js Hybrid API',
        version: '1.0.0',
        endpoints: [
          {
            method: 'GET',
            path: '/api/health',
            description: 'Health check',
          },
          {
            method: 'GET',
            path: '/api/docs',
            description: 'API documentation',
          },
          {
            method: 'GET',
            path: '/api/counter',
            description: 'Get current counter value',
          },
          {
            method: 'POST',
            path: '/api/counter/increment',
            description: 'Increment counter',
            body: { amount: 'number' },
          },
          {
            method: 'POST',
            path: '/api/counter/decrement',
            description: 'Decrement counter',
            body: { amount: 'number' },
          },
          {
            method: 'POST',
            path: '/api/counter/reset',
            description: 'Reset counter to 0',
          },
          {
            method: 'POST',
            path: '/api/counter/set',
            description: 'Set counter value',
            body: { count: 'number' },
          },
          {
            method: 'GET',
            path: '/api/todos',
            description: 'Get all todos',
            query: { filter: 'all|done|pending' },
          },
          {
            method: 'GET',
            path: '/api/todos/:id',
            description: 'Get todo by ID',
          },
          {
            method: 'POST',
            path: '/api/todos',
            description: 'Create new todo',
            body: { text: 'string', priority: 'high|medium|low' },
          },
          {
            method: 'PATCH',
            path: '/api/todos/:id',
            description: 'Update todo',
            body: { text: 'string', done: 'boolean', priority: 'string' },
          },
          {
            method: 'POST',
            path: '/api/todos/:id/toggle',
            description: 'Toggle todo done status',
          },
          {
            method: 'DELETE',
            path: '/api/todos/:id',
            description: 'Delete todo',
          },
          {
            method: 'DELETE',
            path: '/api/todos',
            description: 'Clear all todos',
          },
          {
            method: 'GET',
            path: '/api/todos/stats',
            description: 'Get todo statistics',
          },
        ],
      },
    };
  }
}

module.exports = {
  CounterHandler,
  TodoHandler,
  HealthHandler,
};
