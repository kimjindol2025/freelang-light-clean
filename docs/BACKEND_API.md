# Backend API Documentation

**FreeLang + Next.js Hybrid - REST API Server**

---

## 🚀 Quick Start

### 1. Start the backend server

```bash
node backend/server.js
```

Output:
```
🚀 Initializing FreeLang Backend Server...
✅ Database initialized

🚀 API Server running on http://localhost:3001
📚 Documentation: http://localhost:3001/api/docs
```

### 2. Test the API

```bash
curl http://localhost:3001/api/health
```

### 3. Run integration tests

```bash
node backend/test.js
```

---

## 📚 API Endpoints

### Health & Documentation

#### `GET /` - Root endpoint

```bash
curl http://localhost:3001/
```

Response:
```json
{
  "status": "success",
  "data": {
    "message": "FreeLang Backend API",
    "version": "1.0.0",
    "docs": "http://localhost:3001/api/docs"
  }
}
```

#### `GET /api/health` - Health check

```bash
curl http://localhost:3001/api/health
```

Response:
```json
{
  "status": "success",
  "data": {
    "status": "healthy",
    "uptime": "2.34s",
    "timestamp": "2026-03-12T10:30:00.000Z",
    "database": {
      "counter": 1,
      "todos": 5
    }
  }
}
```

#### `GET /api/docs` - API documentation

```bash
curl http://localhost:3001/api/docs
```

---

## 🔢 Counter Endpoints

### `GET /api/counter` - Get current counter

```bash
curl http://localhost:3001/api/counter
```

Response:
```json
{
  "status": "success",
  "data": {
    "id": "main",
    "count": 42,
    "name": "Main Counter",
    "createdAt": "2026-03-12T10:00:00.000Z",
    "updatedAt": "2026-03-12T10:30:00.000Z"
  }
}
```

### `POST /api/counter/increment` - Increment counter

```bash
curl -X POST http://localhost:3001/api/counter/increment \
  -H "Content-Type: application/json" \
  -d '{"amount": 5}'
```

**Request Body**:
```json
{
  "amount": 5  // Optional, default: 1
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "message": "Counter incremented by 5",
    "counter": {
      "id": "main",
      "count": 47,
      "name": "Main Counter",
      "updatedAt": "2026-03-12T10:30:30.000Z"
    }
  }
}
```

### `POST /api/counter/decrement` - Decrement counter

```bash
curl -X POST http://localhost:3001/api/counter/decrement \
  -H "Content-Type: application/json" \
  -d '{"amount": 3}'
```

**Request Body**:
```json
{
  "amount": 3  // Optional, default: 1
}
```

### `POST /api/counter/reset` - Reset counter to 0

```bash
curl -X POST http://localhost:3001/api/counter/reset
```

### `POST /api/counter/set` - Set counter to specific value

```bash
curl -X POST http://localhost:3001/api/counter/set \
  -H "Content-Type: application/json" \
  -d '{"count": 100}'
```

**Request Body**:
```json
{
  "count": 100  // Required
}
```

### `GET /api/counter/history` - Get counter history

```bash
curl http://localhost:3001/api/counter/history
```

---

## ✅ Todo Endpoints

### `GET /api/todos` - Get all todos

```bash
curl http://localhost:3001/api/todos
```

**Query Parameters**:
```bash
curl "http://localhost:3001/api/todos?filter=done"
curl "http://localhost:3001/api/todos?filter=pending"
curl "http://localhost:3001/api/todos?filter=all"  # Default
```

Response:
```json
{
  "status": "success",
  "data": {
    "todos": [
      {
        "id": 1,
        "text": "Buy groceries",
        "done": false,
        "priority": "high",
        "tags": [],
        "createdAt": "2026-03-12T10:00:00.000Z",
        "updatedAt": "2026-03-12T10:00:00.000Z"
      }
    ],
    "total": 1,
    "filter": "all"
  }
}
```

### `GET /api/todos/:id` - Get specific todo

```bash
curl http://localhost:3001/api/todos/1
```

### `POST /api/todos` - Create new todo

```bash
curl -X POST http://localhost:3001/api/todos \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Learn FreeLang",
    "priority": "high"
  }'
```

**Request Body**:
```json
{
  "text": "Learn FreeLang",          // Required
  "priority": "high|medium|low",   // Optional, default: "medium"
  "tags": []                        // Optional
}
```

Response:
```json
{
  "status": "success",
  "statusCode": 201,
  "data": {
    "message": "Todo created",
    "todo": {
      "id": 1,
      "text": "Learn FreeLang",
      "done": false,
      "priority": "high",
      "tags": [],
      "createdAt": "2026-03-12T10:30:00.000Z",
      "updatedAt": "2026-03-12T10:30:00.000Z"
    }
  }
}
```

### `PATCH /api/todos/:id` - Update todo

```bash
curl -X PATCH http://localhost:3001/api/todos/1 \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Learn FreeLang Advanced",
    "priority": "medium"
  }'
```

**Request Body** (all fields optional):
```json
{
  "text": "New text",
  "done": true,
  "priority": "low",
  "tags": ["important"]
}
```

### `POST /api/todos/:id/toggle` - Toggle todo status

```bash
curl -X POST http://localhost:3001/api/todos/1/toggle
```

### `DELETE /api/todos/:id` - Delete specific todo

```bash
curl -X DELETE http://localhost:3001/api/todos/1
```

### `DELETE /api/todos` - Delete all todos

```bash
curl -X DELETE http://localhost:3001/api/todos
```

Response:
```json
{
  "status": "success",
  "data": {
    "message": "5 todos cleared",
    "count": 5
  }
}
```

### `GET /api/todos/stats` - Get todo statistics

```bash
curl http://localhost:3001/api/todos/stats
```

Response:
```json
{
  "status": "success",
  "data": {
    "total": 5,
    "done": 2,
    "pending": 3,
    "byPriority": {
      "high": 1,
      "medium": 2,
      "low": 2
    }
  }
}
```

---

## 📊 Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | GET, POST, PATCH success |
| 201 | Created | POST new resource |
| 400 | Bad Request | Missing required field |
| 404 | Not Found | Todo ID doesn't exist |
| 500 | Server Error | Unhandled exception |

---

## 🔧 Architecture

### Layers

```
┌─────────────────────────────────────┐
│      API Server (api.js)            │
│  - HTTP server, routing, CORS       │
├─────────────────────────────────────┤
│   Handlers (handlers.js)            │
│  - CounterHandler                   │
│  - TodoHandler                      │
│  - HealthHandler                    │
├─────────────────────────────────────┤
│   Database Layer (db.js)            │
│  - Collection abstraction           │
│  - Query & filtering                │
│  - File persistence                 │
├─────────────────────────────────────┤
│  Storage (data/db.json)             │
│  - Persistent JSON file             │
└─────────────────────────────────────┘
```

### Key Components

#### API Server
- **File**: `backend/api.js`
- **Class**: `APIServer`
- **Features**:
  - Routing (GET, POST, PATCH, DELETE)
  - Middleware system
  - Error handling
  - Request logging
  - CORS support

**Example**:
```javascript
const api = new APIServer(3001);
api.get('/api/counter', handler);
api.post('/api/todos', handler);
api.use(validateContentType);
api.start();
```

#### Database
- **File**: `backend/db.js`
- **Classes**: `Database`, `Collection`
- **Features**:
  - JSON persistence
  - In-memory with auto-save
  - Query filtering
  - Transactions
  - Atomic operations

**Example**:
```javascript
const db = new Database('./data.json');
const todos = db.collection('todos');

todos.insert({ text: 'Learn' });
todos.findAll({ done: false });
todos.updateById(1, { done: true });
todos.deleteById(1);
```

#### Handlers
- **File**: `backend/handlers.js`
- **Classes**: `CounterHandler`, `TodoHandler`, `HealthHandler`
- **Features**:
  - Business logic
  - Input validation
  - Error handling

---

## 📝 Examples

### JavaScript/Node.js

```javascript
// Using fetch (client-side or Node.js)
const response = await fetch('http://localhost:3001/api/counter');
const data = await response.json();
console.log(data);
```

### cURL

```bash
# Get counter
curl http://localhost:3001/api/counter

# Increment counter
curl -X POST http://localhost:3001/api/counter/increment \
  -H "Content-Type: application/json" \
  -d '{"amount": 1}'

# Create todo
curl -X POST http://localhost:3001/api/todos \
  -H "Content-Type: application/json" \
  -d '{"text": "Buy milk", "priority": "high"}'
```

### React Frontend

```typescript
import { useAsyncAction } from '@/bridge/hooks';

function TodoApp() {
  const { loading, error, execute } = useAsyncAction(async () => {
    const response = await fetch('http://localhost:3001/api/todos');
    return response.json();
  });

  const loadTodos = async () => {
    const data = await execute();
    console.log(data);
  };

  return (
    <button onClick={loadTodos}>
      {loading ? 'Loading...' : 'Load Todos'}
    </button>
  );
}
```

---

## 🔌 Integration with Frontend

### Using useAsyncAction

```typescript
const { loading, error, execute } = useAsyncAction(async () => {
  const response = await fetch('/api/todos');
  return response.json();
});

const createTodo = async (text) => {
  const data = await execute(async () => {
    const response = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return response.json();
  });
};
```

---

## 📦 Data Persistence

### Database File Location

```
freelang-hybrid/
└── data/
    └── db.json
```

### Auto-save Features

- Changes are automatically saved to disk
- Interval: 1 second
- All operations are atomic
- File-based backup support

### Example data/db.json

```json
{
  "counter": [
    {
      "id": "main",
      "count": 42,
      "name": "Main Counter",
      "createdAt": "2026-03-12T10:00:00.000Z",
      "updatedAt": "2026-03-12T10:30:00.000Z"
    }
  ],
  "todos": [
    {
      "id": 1,
      "text": "Buy groceries",
      "done": false,
      "priority": "high",
      "tags": [],
      "createdAt": "2026-03-12T10:00:00.000Z",
      "updatedAt": "2026-03-12T10:00:00.000Z"
    }
  ]
}
```

---

## 🧪 Testing

### Run All Tests

```bash
node backend/test.js
```

### Manual Testing

```bash
# Start server in one terminal
node backend/server.js

# In another terminal
curl http://localhost:3001/api/health
curl -X POST http://localhost:3001/api/counter/increment
curl http://localhost:3001/api/todos
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Use different port
PORT=3002 node backend/server.js
```

### Database File Corrupted

```bash
# Reset database
rm data/db.json
node backend/server.js
```

### CORS Issues

The API server sends `Access-Control-Allow-Origin: *` for all responses.
If you still get CORS errors, ensure the frontend is making requests to the correct URL.

---

## 📈 Performance

- **Response time**: < 10ms (in-memory)
- **Concurrent connections**: Unlimited (Node.js)
- **Database size**: Tested up to 10,000 items
- **Auto-save interval**: 1 second
- **Zero npm dependencies**: Pure Node.js http module

---

## 🔐 Security Notes

This is a development/demo API. For production:

1. Add authentication (JWT tokens)
2. Add rate limiting
3. Validate all inputs
4. Use HTTPS
5. Implement proper error handling
6. Add request logging
7. Use a real database (PostgreSQL, MongoDB)
8. Implement CORS properly (whitelist domains)

---

## 📚 Next Steps

1. Connect frontend to backend using `useAsyncAction`
2. Add user authentication
3. Implement real database (PostgreSQL)
4. Add input validation middleware
5. Deploy to production
6. Monitor performance
7. Scale database layer

---

**Last Updated**: 2026-03-12
**Status**: Phase 2 - Backend API Complete
**Next**: Phase 3 - Frontend Integration & Advanced Features
