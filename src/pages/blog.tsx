import React, { useState, useMemo } from 'react';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
  tags: string[];
  readTime: number;
  featured?: boolean;
}

const BLOG_POSTS: BlogPost[] = [
  {
    id: 'freelang-intro',
    title: 'FreeLang으로 시작하기: State Management를 다시 생각해보다',
    excerpt: 'Redux 없이도 완벽한 상태 관리가 가능할까요? FreeLang의 혁신적인 접근 방식을 알아봅시다.',
    content: `FreeLang은 복잡한 JavaScript 상태 관리 라이브러리를 대체하기 위해 설계되었습니다.

## 전통적 상태 관리의 문제점
- Redux: 너무 많은 보일러플레이트
- MobX: 복잡한 데코레이터 문법
- Zustand: 경량이지만 기능 제한

## FreeLang의 해결책
FreeLang State Manager는 다음 특징을 제공합니다:

1. **간단한 API**: 3줄로 상태 관리 시작
2. **타입 안전**: 빌트인 타입 검증
3. **시간 여행 디버깅**: 모든 상태 변경 추적
4. **반응형**: 변경 감지 및 자동 UI 업데이트

\`\`\`javascript
// 상태 정의
const state = {
  count: 0,
  todos: []
};

// 액션 등록
const actions = {
  increment: () => state.count++,
  addTodo: (text) => state.todos.push({ text, done: false })
};

// React에서 사용
const { count, increment } = useFreeLang('counter');
\`\`\`

이렇게 간단하게 Redux, Recoil 같은 복잡한 도구 없이도 완벽한 상태 관리를 할 수 있습니다.`,
    author: 'FreeLang Team',
    date: '2026-03-12',
    category: 'Getting Started',
    tags: ['state-management', 'react', 'beginner'],
    readTime: 5,
    featured: true
  },
  {
    id: 'rest-api-design',
    title: 'REST API를 Node.js 기본 모듈로 구현하기',
    excerpt: '외부 라이브러리 없이 순수 Node.js http 모듈만으로 강력한 REST API 서버를 만들어봅시다.',
    content: `npm 패키지에 의존하지 않고도 프로덕션급 REST API를 구현할 수 있습니다.

## 전통적 접근: Express.js의 문제점
- 번들 크기 증가
- 의존성 체인 복잡성
- 버전 업데이트 관리 어려움

## FreeLang 방식: 순수 Node.js
\`\`\`javascript
const http = require('http');

class APIServer {
  constructor(port) {
    this.port = port;
    this.routes = {};
  }

  get(path, handler) {
    this.routes[\`GET \${path}\`] = handler;
  }

  post(path, handler) {
    this.routes[\`POST \${path}\`] = handler;
  }

  start() {
    http.createServer((req, res) => {
      const key = \`\${req.method} \${req.url}\`;
      const handler = this.routes[key];

      if (handler) {
        handler(req, res);
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    }).listen(this.port);
  }
}
\`\`\`

## 장점
1. **Zero Dependencies**: npm install 필요 없음
2. **성능**: 미들웨어 오버헤드 없음
3. **학습**: Node.js 핵심만 이해하면 됨
4. **통제**: 모든 코드가 눈에 보임

## 단점과 해결책
- 동적 라우팅 → 정규표현식 패턴 매칭
- 쿼리 파싱 → URLSearchParams API
- 요청 바디 → Stream 처리

이렇게 간단한 API 서버를 구현하고, 나중에 필요하면 Express로 마이그레이션할 수 있습니다.`,
    author: 'FreeLang Team',
    date: '2026-03-10',
    category: 'Advanced',
    tags: ['backend', 'node.js', 'api'],
    readTime: 8,
    featured: true
  },
  {
    id: 'typescript-benefits',
    title: 'TypeScript로 React 컴포넌트의 버그를 90% 줄이는 방법',
    excerpt: 'FreeLang 프로젝트에서 TypeScript를 활용하여 런타임 에러를 사전에 방지하는 전략을 공유합니다.',
    content: `TypeScript는 단순히 "타입 체킹"이 아니라 설계 도구입니다.

## JavaScript에서의 일반적인 버그
\`\`\`javascript
function addTodo(text, priority) {
  return { text, priority };
}

// 실수하기 쉬운 호출
addTodo(123, 'high');           // text가 숫자?
addTodo('Learn', 'urgent');     // priority가 'urgent'?
addTodo('Learn');               // priority 빠짐?
\`\`\`

## TypeScript의 해결책
\`\`\`typescript
type Priority = 'low' | 'medium' | 'high';

function addTodo(text: string, priority: Priority) {
  return { text, priority };
}

// 이제 타입 체커가 모든 실수를 방지
addTodo(123, 'high');           // ❌ Error: text는 string이어야 함
addTodo('Learn', 'urgent');     // ❌ Error: priority는 'low'|'medium'|'high'만 가능
addTodo('Learn');               // ❌ Error: priority 매개변수 필수
addTodo('Learn', 'high');       // ✅ OK
\`\`\`

## 추가 이점
1. **자동 완성**: IDE가 가능한 메서드와 속성을 모두 제시
2. **리팩토링 안전성**: 타입 변경 시 모든 사용처 찾기 용이
3. **문서화**: 타입이 최고의 문서
4. **성능**: 번들 크기는 증가하지만, 버그로 인한 성능 저하 방지

## 실전 전략
\`\`\`typescript
// 1. 처음부터 strict 모드 사용
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true
  }
}

// 2. 복잡한 타입은 interface로 정의
interface Todo {
  id: number;
  text: string;
  done: boolean;
  priority: Priority;
  tags: string[];
}

// 3. 함수 반환형 명시
function getTodos(): Promise<Todo[]> {
  return fetch('/api/todos').then(r => r.json());
}
\`\`\`

이렇게 하면 개발 시간은 조금 더 들지만, 버그로 인한 디버깅 시간은 훨씬 줄어듭니다.`,
    author: 'Kim Dev',
    date: '2026-03-08',
    category: 'Advanced',
    tags: ['typescript', 'react', 'best-practices'],
    readTime: 12,
    featured: false
  },
  {
    id: 'ssr-optimization',
    title: 'Next.js SSR에서 성능 최적화: 100점 만드는 가이드',
    excerpt: 'Lighthouse 95점 이상을 유지하면서 SEO와 성능을 동시에 확보하는 방법.',
    content: `Next.js는 기본적으로 SSR을 지원하지만, 제대로 설정하지 않으면 오히려 성능이 나빠집니다.

## 성능 측정
먼저 현재 상태를 파악하세요:
- Lighthouse 점수 (Performance, Accessibility, Best Practices, SEO)
- Core Web Vitals (LCP, FID, CLS)
- 번들 크기 분석

## 최적화 전략

### 1. 이미지 최적화
\`\`\`typescript
import Image from 'next/image';

// ❌ 나쁜 예
<img src="/hero.jpg" alt="Hero" width="1200" height="600" />

// ✅ 좋은 예
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority={true}  // LCP 이미지는 preload
  quality={75}
/>
\`\`\`

### 2. 코드 분할
\`\`\`typescript
import dynamic from 'next/dynamic';

// 무거운 컴포넌트는 동적 로드
const HeavyChart = dynamic(
  () => import('@/components/Chart'),
  { loading: () => <div>Loading...</div> }
);
\`\`\`

### 3. 폰트 최적화
\`\`\`typescript
// next.config.js
module.exports = {
  fonts: {
    google: [
      { family: 'Inter', weights: [400, 700] }
    ]
  }
};
\`\`\`

## 결과
- Lighthouse Performance: 95+
- LCP: < 2.5s
- FID: < 100ms
- CLS: < 0.1`,
    author: 'Performance Team',
    date: '2026-03-06',
    category: 'Performance',
    tags: ['nextjs', 'optimization', 'seo'],
    readTime: 10,
    featured: false
  },
  {
    id: 'freelang-architecture',
    title: 'FreeLang + Next.js 하이브리드 아키텍처 설계',
    excerpt: '프론트엔드 상태 관리부터 백엔드 로직까지 FreeLang이 어떻게 전체 스택을 통일하는지 알아봅시다.',
    content: `FreeLang의 진정한 강점은 프론트엔드와 백엔드를 동일한 언어와 패러다임으로 작성할 수 있다는 것입니다.

## 전통적 웹 스택의 문제점
- 프론트엔드: JavaScript + React
- 백엔드: Python/Go/Node.js
- 통신: REST API/GraphQL
- 상태: Redux + SQL

각 레이어가 다른 언어, 다른 패러다임으로 작성되므로:
1. 개발 팀이 언어별로 분리됨
2. 상태 모델이 프론트엔드와 백엔드에 중복됨
3. API 문서 유지가 어려움

## FreeLang의 해결책
\`\`\`freelang
// 같은 언어, 같은 타입으로 전체 스택 작성

// 프론트엔드 상태
global AppState {
  todos: array<Todo>
  loading: boolean
}

// 백엔드 상태
collection<Todo> {
  id: number
  text: string
  done: boolean
}

// 둘 다 동일한 타입 정의!
\`\`\`

## 아키텍처 흐름
\`\`\`
┌─────────────────────────────────────┐
│  Browser (React UI)                 │
│  - Components                       │
│  - Event Handlers                   │
└──────────┬──────────────────────────┘
           │
┌──────────▼──────────────────────────┐
│  Bridge Layer                       │
│  - State Sync                       │
│  - API Calls                        │
└──────────┬──────────────────────────┘
           │
┌──────────▼──────────────────────────┐
│  FreeLang Core (프론트엔드)          │
│  - 상태 관리                         │
│  - 비즈니스 로직                     │
│  - 벨리데이션                       │
└──────────┬──────────────────────────┘
           │ (REST API)
┌──────────▼──────────────────────────┐
│  FreeLang Core (백엔드)              │
│  - 동일한 로직                       │
│  - 데이터베이스 영속성               │
└──────────┬──────────────────────────┘
           │
┌──────────▼──────────────────────────┐
│  Database (PostgreSQL, MySQL)       │
└─────────────────────────────────────┘
\`\`\`

## 장점
1. **DRY (Don't Repeat Yourself)**: 로직을 한 번만 작성
2. **타입 안전성**: 프론트부터 DB까지 타입 일관성
3. **개발 속도**: 같은 언어로 전체 스택 담당 가능
4. **유지보수**: 변경사항이 전체 스택에 자동 반영`,
    author: 'Architecture Team',
    date: '2026-03-04',
    category: 'Architecture',
    tags: ['freelang', 'architecture', 'fullstack'],
    readTime: 9,
    featured: true
  },
  {
    id: 'testing-strategy',
    title: 'FreeLang에서 100% 테스트 커버리지 달성하기',
    excerpt: '단순한 유닛 테스트를 넘어, 통합 테스트와 E2E 테스트로 전체 시스템의 안정성을 보장합니다.',
    content: `테스트는 비용이 아니라 투자입니다. 특히 FreeLang 같은 컴파일 언어에서는 더욱 그렇습니다.

## 테스트 피라미드
\`\`\`
        ╱╲
       ╱  ╲         E2E (10%)
      ╱────╲        사용자 시나리오
     ╱      ╲
    ╱────────╲      Integration (30%)
   ╱          ╲     컴포넌트 간 통신
  ╱────────────╲
 ╱              ╲   Unit (60%)
╱────────────────╲  개별 함수 테스트
\`\`\`

## FreeLang에서의 테스트 전략

### 1. 유닛 테스트: State Manager
\`\`\`javascript
describe('FreeLang State Manager', () => {
  it('should increment counter', () => {
    const state = { count: 0 };
    const action = () => state.count++;

    action();
    assert.equal(state.count, 1);
  });

  it('should track history', () => {
    // 모든 상태 변경이 자동 기록됨
    assert.equal(store.getHistory().length, 2);
  });
});
\`\`\`

### 2. 통합 테스트: API 서버
\`\`\`javascript
describe('REST API', () => {
  let server;

  before(() => {
    server = new APIServer(3001);
    server.start();
  });

  it('POST /api/todos creates todo', async () => {
    const res = await fetch('http://localhost:3001/api/todos', {
      method: 'POST',
      body: JSON.stringify({ text: 'Learn FreeLang' })
    });
    const data = await res.json();
    assert.equal(data.status, 'success');
  });
});
\`\`\`

### 3. E2E 테스트: Playwright
\`\`\`javascript
describe('User Flow', () => {
  it('user can create and complete todo', async () => {
    await page.goto('http://localhost:3000');

    // 입력
    await page.type('input[name=todo]', 'Buy milk');
    await page.click('button:has-text("Add")');

    // 확인
    const todo = await page.$('text=Buy milk');
    assert(todo);

    // 완료 표시
    await page.click('button[data-action=toggle]');

    // 상태 확인
    const done = await page.$('.todo.done');
    assert(done);
  });
});
\`\`\`

## 100% 커버리지 달성하기
1. 모든 함수에 테스트 케이스 작성
2. 모든 조건문 분기 테스트 (if-else)
3. 에러 케이스 테스트 (try-catch)
4. 엣지 케이스 테스트 (null, undefined, empty array)

## 자동화
\`\`\`bash
# GitHub Actions로 자동 테스트
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm test
      - run: npm run coverage
      - uses: codecov/codecov-action@v3
\`\`\``,
    author: 'QA Team',
    date: '2026-03-02',
    category: 'Best Practices',
    tags: ['testing', 'quality', 'automation'],
    readTime: 11,
    featured: false
  },
  {
    id: 'memory-management',
    title: 'FreeLang의 메모리 관리가 C와 다른 이유',
    excerpt: 'FreeLang이 가비지 컬렉션과 수동 메모리 관리의 장점만 결합한 방식을 파헤칩니다.',
    content: `메모리 관리는 프로그래머의 가장 큰 골칫거리입니다. FreeLang은 이를 어떻게 해결했을까요?

## C의 문제점
\`\`\`c
// 메모리 직접 관리 = 위험
int *arr = malloc(10 * sizeof(int));
// ... 사용 ...
free(arr);  // 빠뜨리면 메모리 누수!
\`\`\`

## JavaScript의 문제점
\`\`\`javascript
// 가비지 컬렉션 = 예측 불가능한 멈춤
const largeArray = new Array(1000000);
delete largeArray;  // 언제 해제될지 모름
// 게임/실시간 시스템에서는 치명적
\`\`\`

## FreeLang의 해결책
\`\`\`freelang
// 1. 명시적 할당
let arr: array<int> = [1, 2, 3];

// 2. 자동 스코프 정리 (RAII 패턴)
{
  let temp = allocate_large();
  // 사용
}  // 스코프 벗어나면 자동 정리

// 3. 참조 카운팅
let arr1 = [1, 2, 3];
let arr2 = arr1;  // 참조 카운트: 2
// arr2 스코프 종료 → 카운트: 1
// arr1 스코프 종료 → 카운트: 0 → 자동 정리
\`\`\`

## 성능 비교
| 방식 | 할당 | 정리 | 예측성 |
|------|------|------|--------|
| C | 수동 | 수동 | 높음 |
| JS | 자동 | GC | 낮음 |
| FreeLang | 자동 | 자동 | 높음 |

## 결론
FreeLang은 편리함(자동 메모리)과 성능(예측 가능성)의 최고의 균형을 제공합니다.`,
    author: 'Systems Team',
    date: '2026-02-28',
    category: 'Advanced',
    tags: ['memory-management', 'performance', 'c-comparison'],
    readTime: 7
  }
];

const CATEGORIES = ['All', 'Getting Started', 'Advanced', 'Performance', 'Architecture', 'Best Practices'];

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const allTags = Array.from(
    new Set(BLOG_POSTS.flatMap(post => post.tags))
  ).sort();

  const filteredPosts = useMemo(() => {
    return BLOG_POSTS.filter(post => {
      const matchesSearch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;

      const matchesTags = selectedTags.length === 0 ||
        selectedTags.some(tag => post.tags.includes(tag));

      return matchesSearch && matchesCategory && matchesTags;
    });
  }, [searchQuery, selectedCategory, selectedTags]);

  const featuredPosts = filteredPosts.filter(post => post.featured);
  const regularPosts = filteredPosts.filter(post => !post.featured);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>FreeLang 블로그</h1>
          <p style={styles.subtitle}>
            기술 글, 모범 사례, 성능 최적화 팁을 공유합니다
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div style={styles.searchSection}>
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="블로그 검색 (제목, 내용)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          <svg style={styles.searchIcon} viewBox="0 0 20 20">
            <path fill="currentColor" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" />
          </svg>
        </div>
      </div>

      {/* Category Filter */}
      <div style={styles.filterSection}>
        <div style={styles.filterLabel}>카테고리</div>
        <div style={styles.categoryTabs}>
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              style={{
                ...styles.categoryTab,
                ...(selectedCategory === category
                  ? styles.categoryTabActive
                  : styles.categoryTabInactive)
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Tag Filter */}
      <div style={styles.filterSection}>
        <div style={styles.filterLabel}>태그</div>
        <div style={styles.tagContainer}>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              style={{
                ...styles.tag,
                ...(selectedTags.includes(tag)
                  ? styles.tagSelected
                  : styles.tagUnselected)
              }}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <div style={styles.featuredSection}>
          <h2 style={styles.sectionTitle}>⭐ 인기 글</h2>
          <div style={styles.featuredGrid}>
            {featuredPosts.map(post => (
              <article key={post.id} style={styles.featuredCard}>
                <div style={styles.featuredBadge}>Featured</div>
                <h3 style={styles.postTitle}>{post.title}</h3>
                <p style={styles.postExcerpt}>{post.excerpt}</p>
                <div style={styles.postMeta}>
                  <span style={styles.metaItem}>📅 {post.date}</span>
                  <span style={styles.metaItem}>⏱️ {post.readTime}분</span>
                  <span style={styles.metaItem}>✍️ {post.author}</span>
                </div>
                <div style={styles.postTags}>
                  {post.tags.map(tag => (
                    <span key={tag} style={styles.postTag}>
                      #{tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* Regular Posts */}
      <div style={styles.postsSection}>
        <h2 style={styles.sectionTitle}>
          {selectedCategory !== 'All' ? selectedCategory : '모든 글'} ({regularPosts.length})
        </h2>

        {regularPosts.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>해당하는 글이 없습니다.</p>
            <p style={styles.emptySubtext}>다른 검색어나 필터를 시도해보세요.</p>
          </div>
        ) : (
          <div style={styles.postsList}>
            {regularPosts.map(post => (
              <article key={post.id} style={styles.postCard}>
                <div style={styles.postCardHeader}>
                  <h3 style={styles.postCardTitle}>{post.title}</h3>
                  <span style={styles.categoryBadge}>{post.category}</span>
                </div>

                <p style={styles.postCardExcerpt}>{post.excerpt}</p>

                <div style={styles.postCardFooter}>
                  <div style={styles.postCardMeta}>
                    <span style={styles.metaItem}>📅 {post.date}</span>
                    <span style={styles.metaItem}>⏱️ {post.readTime}분</span>
                    <span style={styles.metaItem}>✍️ {post.author}</span>
                  </div>
                  <div style={styles.postCardTags}>
                    {post.tags.map(tag => (
                      <span key={tag} style={styles.postTag}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Newsletter Section */}
      <div style={styles.newsletterSection}>
        <h2 style={styles.newsletterTitle}>새 글 알림 받기</h2>
        <p style={styles.newsletterSubtitle}>
          매주 FreeLang 개발 팁과 기술 글을 이메일로 받아보세요.
        </p>
        <div style={styles.newsletterForm}>
          <input
            type="email"
            placeholder="이메일 주소 입력..."
            style={styles.newsletterInput}
          />
          <button style={styles.newsletterButton}>구독하기</button>
        </div>
      </div>

      {/* Footer Links */}
      <div style={styles.footerLinks}>
        <a href="/" style={styles.link}>← 홈으로 돌아가기</a>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: '#1f2937',
  },

  // Header
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '60px 40px',
    borderRadius: '12px',
    marginBottom: '40px',
    textAlign: 'center' as const,
  },
  headerContent: {
    maxWidth: '700px',
    margin: '0 auto',
  },
  title: {
    fontSize: '48px',
    fontWeight: 'bold',
    margin: '0 0 16px 0',
  },
  subtitle: {
    fontSize: '18px',
    opacity: 0.95,
    margin: 0,
  },

  // Search Section
  searchSection: {
    marginBottom: '40px',
  },
  searchContainer: {
    position: 'relative' as const,
    maxWidth: '500px',
    margin: '0 auto',
  },
  searchInput: {
    width: '100%',
    padding: '14px 16px 14px 44px',
    fontSize: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box' as const,
    ':focus': {
      borderColor: '#667eea',
      boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
    }
  },
  searchIcon: {
    position: 'absolute' as const,
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '20px',
    height: '20px',
    color: '#9ca3af',
  },

  // Filter Section
  filterSection: {
    marginBottom: '32px',
  },
  filterLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: '12px',
    textTransform: 'uppercase' as const,
  },
  categoryTabs: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  categoryTab: {
    padding: '8px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: 'white',
  },
  categoryTabActive: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
  },
  categoryTabInactive: {
    color: '#6b7280',
  },

  tagContainer: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  tag: {
    padding: '6px 12px',
    fontSize: '13px',
    border: '1px solid #d1d5db',
    borderRadius: '20px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: 'white',
    color: '#6b7280',
  },
  tagSelected: {
    background: '#dbeafe',
    color: '#1e40af',
    border: '1px solid #93c5fd',
  },
  tagUnselected: {
    color: '#6b7280',
  },

  // Featured Section
  featuredSection: {
    marginBottom: '48px',
  },
  featuredGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '24px',
  },
  featuredCard: {
    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
    padding: '28px',
    borderRadius: '12px',
    border: '2px solid #ddd6fe',
    position: 'relative' as const,
    transition: 'all 0.3s ease',
  },
  featuredBadge: {
    position: 'absolute' as const,
    top: '12px',
    right: '12px',
    background: '#fbbf24',
    color: '#78350f',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },

  // Posts Section
  postsSection: {
    marginBottom: '48px',
  },
  sectionTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '24px',
    color: '#1f2937',
  },
  postsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  postCard: {
    background: 'white',
    border: '1px solid #e5e7eb',
    padding: '24px',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
  },
  postCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '12px',
  },
  postCardTitle: {
    fontSize: '20px',
    fontWeight: '600',
    margin: 0,
    color: '#1f2937',
    flex: 1,
  },
  categoryBadge: {
    display: 'inline-block',
    background: '#f3e8ff',
    color: '#6b21a8',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    whiteSpace: 'nowrap' as const,
  },
  postCardExcerpt: {
    margin: '0 0 16px 0',
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: 1.6,
  },
  postCardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap' as const,
  },
  postCardMeta: {
    display: 'flex',
    gap: '16px',
    fontSize: '13px',
    color: '#9ca3af',
  },
  postCardTags: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },

  // Post Meta
  postTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0 0 12px 0',
    color: '#1f2937',
  },
  postExcerpt: {
    color: '#6b7280',
    fontSize: '15px',
    lineHeight: 1.6,
    margin: '0 0 16px 0',
  },
  postMeta: {
    display: 'flex',
    gap: '16px',
    fontSize: '13px',
    color: '#9ca3af',
    marginBottom: '12px',
  },
  metaItem: {
    display: 'inline-flex',
    alignItems: 'center',
  },
  postTags: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  postTag: {
    display: 'inline-block',
    background: '#f0f9ff',
    color: '#0369a1',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
  },

  // Empty State
  emptyState: {
    textAlign: 'center' as const,
    padding: '48px 20px',
    background: '#f9fafb',
    borderRadius: '8px',
  },
  emptyText: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 8px 0',
  },
  emptySubtext: {
    fontSize: '14px',
    color: '#9ca3af',
    margin: 0,
  },

  // Newsletter Section
  newsletterSection: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '48px 40px',
    borderRadius: '12px',
    textAlign: 'center' as const,
    marginBottom: '40px',
  },
  newsletterTitle: {
    fontSize: '32px',
    fontWeight: 'bold',
    margin: '0 0 12px 0',
  },
  newsletterSubtitle: {
    fontSize: '16px',
    opacity: 0.95,
    margin: '0 0 24px 0',
  },
  newsletterForm: {
    display: 'flex',
    gap: '12px',
    maxWidth: '400px',
    margin: '0 auto',
  },
  newsletterInput: {
    flex: 1,
    padding: '12px 16px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
  },
  newsletterButton: {
    padding: '12px 28px',
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    border: '2px solid white',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    whiteSpace: 'nowrap' as const,
  },

  // Footer Links
  footerLinks: {
    textAlign: 'center' as const,
  },
  link: {
    color: '#667eea',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'color 0.2s ease',
  },
};
