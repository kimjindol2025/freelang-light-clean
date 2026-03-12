// ============================================================================
// FreeLang Hybrid: Vanilla JavaScript Frontend
// React 없이 순수 JavaScript로 API 호출
// ============================================================================

const API_BASE = 'http://localhost:3001';

// ──────────────────────────────────────────────────────────────────────────
// Counter 함수들
// ──────────────────────────────────────────────────────────────────────────

async function incrementCounter() {
  try {
    const response = await fetch(`${API_BASE}/api/counter/increment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 1 })
    });
    const data = await response.json();
    updateCounterDisplay(data.data.counter.count);
  } catch (error) {
    console.error('❌ 증가 실패:', error);
    alert('API 호출 실패: ' + error.message);
  }
}

async function decrementCounter() {
  try {
    const response = await fetch(`${API_BASE}/api/counter/decrement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 1 })
    });
    const data = await response.json();
    updateCounterDisplay(data.data.counter.count);
  } catch (error) {
    console.error('❌ 감소 실패:', error);
    alert('API 호출 실패: ' + error.message);
  }
}

async function resetCounter() {
  try {
    const response = await fetch(`${API_BASE}/api/counter/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    updateCounterDisplay(data.data.counter.count);
  } catch (error) {
    console.error('❌ 초기화 실패:', error);
    alert('API 호출 실패: ' + error.message);
  }
}

async function setCounter() {
  const value = prompt('새로운 값을 입력하세요:');
  if (value === null) return;

  try {
    const response = await fetch(`${API_BASE}/api/counter/set`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count: parseInt(value) })
    });
    const data = await response.json();
    updateCounterDisplay(data.data.counter.count);
  } catch (error) {
    console.error('❌ 설정 실패:', error);
    alert('API 호출 실패: ' + error.message);
  }
}

function updateCounterDisplay(value) {
  const element = document.getElementById('counter-value');
  if (element) {
    element.textContent = value;
  }
}

async function loadInitialCounter() {
  try {
    const response = await fetch(`${API_BASE}/api/counter`);
    const data = await response.json();
    updateCounterDisplay(data.data.count);
  } catch (error) {
    console.error('❌ 카운터 로드 실패:', error);
    updateCounterDisplay('오류');
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Todo 함수들
// ──────────────────────────────────────────────────────────────────────────

async function loadTodos() {
  try {
    const response = await fetch(`${API_BASE}/api/todos`);
    const data = await response.json();
    return data.data.todos;
  } catch (error) {
    console.error('❌ Todo 로드 실패:', error);
    return [];
  }
}

async function createTodo(text, priority = 'medium') {
  try {
    const response = await fetch(`${API_BASE}/api/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, priority })
    });
    const data = await response.json();
    return data.data.todo;
  } catch (error) {
    console.error('❌ Todo 생성 실패:', error);
    return null;
  }
}

async function updateTodo(id, updates) {
  try {
    const response = await fetch(`${API_BASE}/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await response.json();
    return data.data.todo;
  } catch (error) {
    console.error('❌ Todo 업데이트 실패:', error);
    return null;
  }
}

async function toggleTodo(id) {
  try {
    const response = await fetch(`${API_BASE}/api/todos/${id}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    return data.data.todo;
  } catch (error) {
    console.error('❌ Todo 토글 실패:', error);
    return null;
  }
}

async function deleteTodo(id) {
  try {
    const response = await fetch(`${API_BASE}/api/todos/${id}`, {
      method: 'DELETE'
    });
    return response.ok;
  } catch (error) {
    console.error('❌ Todo 삭제 실패:', error);
    return false;
  }
}

async function getTodoStats() {
  try {
    const response = await fetch(`${API_BASE}/api/todos/stats`);
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('❌ 통계 로드 실패:', error);
    return null;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// 헬스 체크
// ──────────────────────────────────────────────────────────────────────────

async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    const data = await response.json();
    console.log('✅ 서버 상태 정상:', data.data);
    return true;
  } catch (error) {
    console.error('❌ 서버 연결 실패:', error);
    return false;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// 네비게이션
// ──────────────────────────────────────────────────────────────────────────

function navigateTo(path) {
  window.location.href = path;
}

// ──────────────────────────────────────────────────────────────────────────
// 초기화
// ──────────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 FreeLang Hybrid Frontend 시작...');

  // 카운터 로드
  loadInitialCounter();

  // 헬스 체크
  checkHealth().then(isHealthy => {
    if (isHealthy) {
      console.log('✅ 백엔드 서버 연결 성공');
    } else {
      console.warn('⚠️ 백엔드 서버에 연결할 수 없습니다');
      console.warn('실행: node backend/server.js');
    }
  });
});

// ──────────────────────────────────────────────────────────────────────────
// 디버그 콘솔 함수들 (개발자용)
// ──────────────────────────────────────────────────────────────────────────

// 콘솔에서 호출 가능:
// debug.getTodos()
// debug.createTodo('Learn FreeLang')
// debug.stats()

const debug = {
  getTodos: async () => {
    const todos = await loadTodos();
    console.table(todos);
    return todos;
  },

  createTodo: async (text, priority = 'medium') => {
    const todo = await createTodo(text, priority);
    console.log('✅ Todo 생성됨:', todo);
    return todo;
  },

  toggleTodo: async (id) => {
    const todo = await toggleTodo(id);
    console.log('✅ Todo 토글됨:', todo);
    return todo;
  },

  deleteTodo: async (id) => {
    const result = await deleteTodo(id);
    console.log(`✅ Todo ${id} 삭제됨`);
    return result;
  },

  stats: async () => {
    const stats = await getTodoStats();
    console.table(stats);
    return stats;
  },

  health: async () => {
    const response = await fetch(`${API_BASE}/api/health`);
    const data = await response.json();
    console.table(data.data);
    return data.data;
  }
};

// 전역 노출 (콘솔에서 사용)
window.debug = debug;
