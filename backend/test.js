/**
 * Backend Integration Tests
 * Test counter and todo endpoints
 *
 * Run: node backend/test.js
 */

const http = require('http');
const { initializeServer } = require('./server');

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

/**
 * Make HTTP request
 */
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: JSON.parse(data),
          });
        } catch {
          resolve({
            statusCode: res.statusCode,
            body: data,
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Test Runner
 */
async function runTests() {
  console.log('\n' + colors.bright + '🧪 Backend Integration Tests\n' + colors.reset);

  // Initialize server
  const { server } = await initializeServer();

  // Wait for server to start
  await new Promise((resolve) => setTimeout(resolve, 500));

  let passed = 0;
  let failed = 0;

  /**
   * Test helper
   */
  const test = async (name, fn) => {
    try {
      await fn();
      console.log(colors.green + '✅' + colors.reset + ' ' + name);
      passed++;
    } catch (error) {
      console.log(colors.red + '❌' + colors.reset + ' ' + name);
      console.log('  Error: ' + error.message);
      failed++;
    }
  };

  /**
   * Assert helper
   */
  const assert = (condition, message) => {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  };

  // ==================== HEALTH TESTS ====================

  await test('GET /api/health returns 200', async () => {
    const res = await makeRequest('GET', '/api/health');
    assert(res.statusCode === 200, 'Expected 200');
    assert(res.body.data.status === 'healthy', 'Expected healthy status');
  });

  await test('GET /api/docs returns documentation', async () => {
    const res = await makeRequest('GET', '/api/docs');
    assert(res.statusCode === 200, 'Expected 200');
    assert(res.body.data.endpoints.length > 0, 'Expected endpoints list');
  });

  // ==================== COUNTER TESTS ====================

  await test('GET /api/counter returns initial value', async () => {
    const res = await makeRequest('GET', '/api/counter');
    assert(res.statusCode === 200, 'Expected 200');
    assert(res.body.data.count >= 0, 'Expected count >= 0');
  });

  await test('POST /api/counter/increment increases value', async () => {
    const before = await makeRequest('GET', '/api/counter');
    const res = await makeRequest('POST', '/api/counter/increment', { amount: 5 });
    const after = await makeRequest('GET', '/api/counter');

    assert(res.statusCode === 200, 'Expected 200');
    assert(
      after.body.data.count === before.body.data.count + 5,
      'Expected count to increase by 5'
    );
  });

  await test('POST /api/counter/decrement decreases value', async () => {
    const before = await makeRequest('GET', '/api/counter');
    const res = await makeRequest('POST', '/api/counter/decrement', { amount: 3 });
    const after = await makeRequest('GET', '/api/counter');

    assert(res.statusCode === 200, 'Expected 200');
    assert(
      after.body.data.count === before.body.data.count - 3,
      'Expected count to decrease by 3'
    );
  });

  await test('POST /api/counter/reset sets value to 0', async () => {
    const res = await makeRequest('POST', '/api/counter/reset');
    const after = await makeRequest('GET', '/api/counter');

    assert(res.statusCode === 200, 'Expected 200');
    assert(after.body.data.count === 0, 'Expected count to be 0');
  });

  await test('POST /api/counter/set sets specific value', async () => {
    const res = await makeRequest('POST', '/api/counter/set', { count: 42 });
    const after = await makeRequest('GET', '/api/counter');

    assert(res.statusCode === 200, 'Expected 200');
    assert(after.body.data.count === 42, 'Expected count to be 42');
  });

  // ==================== TODO TESTS ====================

  await test('POST /api/todos creates new todo', async () => {
    const res = await makeRequest('POST', '/api/todos', {
      text: 'Test todo',
      priority: 'high',
    });

    assert(res.statusCode === 201, 'Expected 201');
    assert(res.body.data.todo.text === 'Test todo', 'Expected todo text');
    assert(res.body.data.todo.done === false, 'Expected done=false');
  });

  await test('GET /api/todos returns list', async () => {
    const res = await makeRequest('GET', '/api/todos');

    assert(res.statusCode === 200, 'Expected 200');
    assert(Array.isArray(res.body.data.todos), 'Expected todos array');
    assert(res.body.data.todos.length > 0, 'Expected at least 1 todo');
  });

  await test('GET /api/todos with filter=done', async () => {
    const res = await makeRequest('GET', '/api/todos?filter=done');

    assert(res.statusCode === 200, 'Expected 200');
    assert(Array.isArray(res.body.data.todos), 'Expected todos array');
  });

  await test('GET /api/todos/:id returns specific todo', async () => {
    const listRes = await makeRequest('GET', '/api/todos');
    const todoId = listRes.body.data.todos[0].id;

    const res = await makeRequest('GET', `/api/todos/${todoId}`);

    assert(res.statusCode === 200, 'Expected 200');
    assert(res.body.data.id === todoId, 'Expected correct todo');
  });

  await test('PATCH /api/todos/:id updates todo', async () => {
    const listRes = await makeRequest('GET', '/api/todos');
    const todoId = listRes.body.data.todos[0].id;

    const res = await makeRequest('PATCH', `/api/todos/${todoId}`, {
      text: 'Updated todo',
      priority: 'low',
    });

    assert(res.statusCode === 200, 'Expected 200');
    assert(res.body.data.todo.text === 'Updated todo', 'Expected updated text');
  });

  await test('POST /api/todos/:id/toggle toggles done status', async () => {
    const listRes = await makeRequest('GET', '/api/todos');
    const todo = listRes.body.data.todos[0];

    const res = await makeRequest('POST', `/api/todos/${todo.id}/toggle`);
    const updated = await makeRequest('GET', `/api/todos/${todo.id}`);

    assert(res.statusCode === 200, 'Expected 200');
    assert(updated.body.data.done === !todo.done, 'Expected done status to toggle');
  });

  await test('GET /api/todos/stats returns statistics', async () => {
    const res = await makeRequest('GET', '/api/todos/stats');

    assert(res.statusCode === 200, 'Expected 200');
    assert(res.body.data.total >= 0, 'Expected total count');
    assert(res.body.data.done >= 0, 'Expected done count');
    assert(res.body.data.pending >= 0, 'Expected pending count');
  });

  await test('DELETE /api/todos/:id deletes todo', async () => {
    // Create a todo to delete
    const createRes = await makeRequest('POST', '/api/todos', {
      text: 'Todo to delete',
    });
    const todoId = createRes.body.data.todo.id;

    const deleteRes = await makeRequest('DELETE', `/api/todos/${todoId}`);
    const getRes = await makeRequest('GET', `/api/todos/${todoId}`);

    assert(deleteRes.statusCode === 200, 'Expected 200');
    assert(getRes.statusCode === 404, 'Expected 404 after delete');
  });

  // ==================== ERROR TESTS ====================

  await test('GET /nonexistent returns 404', async () => {
    const res = await makeRequest('GET', '/nonexistent');
    assert(res.statusCode === 404, 'Expected 404');
  });

  await test('POST /api/todos without text returns 400', async () => {
    const res = await makeRequest('POST', '/api/todos', {});
    assert(res.statusCode >= 400, 'Expected error status');
  });

  // ==================== SUMMARY ====================

  console.log('\n' + colors.bright + '📊 Test Summary\n' + colors.reset);
  console.log(colors.green + 'Passed: ' + passed + colors.reset);
  console.log(colors.red + 'Failed: ' + failed + colors.reset);
  console.log(colors.blue + 'Total:  ' + (passed + failed) + colors.reset + '\n');

  // Close server
  server.close();

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
