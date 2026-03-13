-- ============================================================================
-- FreeLang Light PostgreSQL 초기화 스크립트
-- ============================================================================
-- 목적: Docker 컨테이너 시작 시 자동 실행
-- 위치: docker-compose 볼륨으로 /docker-entrypoint-initdb.d/ 참조

-- 1. 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "hstore";

-- ============================================================================
-- 테이블 1: 포스트 (posts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    author VARCHAR(100),
    category VARCHAR(100),
    tags TEXT,  -- JSON 배열 형식: '["freelang","optimization","search"]'
    slug VARCHAR(255) UNIQUE,
    featured BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'published',  -- 'published', 'draft', 'archived'
    is_draft BOOLEAN DEFAULT false,
    created_at BIGINT,  -- Unix timestamp (ms)
    updated_at BIGINT,
    view_count INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    reading_time INTEGER,
    reading_time_display VARCHAR(50),

    -- 메타데이터
    created_at_ts TIMESTAMPTZ DEFAULT NOW(),
    updated_at_ts TIMESTAMPTZ DEFAULT NOW(),

    -- 검색 인덱싱
    full_text_search TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('korean', title) ||
        to_tsvector('korean', description) ||
        to_tsvector('korean', content)
    ) STORED
);

-- 인덱스: 조회, 필터링, 검색
CREATE INDEX idx_posts_published ON posts(status) WHERE status = 'published';
CREATE INDEX idx_posts_author ON posts(author);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_featured ON posts(featured) WHERE featured = true;
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_fts ON posts USING GIN(full_text_search);  -- 전문 검색

-- ============================================================================
-- 테이블 2: 댓글 (comments)
-- ============================================================================
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author VARCHAR(100),
    email VARCHAR(255),
    content TEXT NOT NULL,
    approved BOOLEAN DEFAULT false,
    created_at BIGINT,
    updated_at BIGINT,
    created_at_ts TIMESTAMPTZ DEFAULT NOW(),
    updated_at_ts TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_approved ON comments(approved) WHERE approved = true;
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

-- ============================================================================
-- 테이블 3: 사용자 (users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',  -- 'admin', 'editor', 'author', 'user'
    is_active BOOLEAN DEFAULT true,
    created_at_ts TIMESTAMPTZ DEFAULT NOW(),
    updated_at_ts TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- ============================================================================
-- 테이블 4: 조회 수 통계 (view_stats)
-- ============================================================================
CREATE TABLE IF NOT EXISTS view_stats (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    viewer_ip VARCHAR(50),
    user_agent TEXT,
    referer TEXT,
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_view_stats_post_id ON view_stats(post_id);
CREATE INDEX idx_view_stats_viewed_at ON view_stats(viewed_at DESC);

-- ============================================================================
-- 테이블 5: 검색 로그 (search_logs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS search_logs (
    id SERIAL PRIMARY KEY,
    query VARCHAR(255),
    result_count INTEGER,
    searched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_search_logs_query ON search_logs(query);
CREATE INDEX idx_search_logs_searched_at ON search_logs(searched_at DESC);

-- ============================================================================
-- 테이블 6: 캐시 통계 (cache_stats)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cache_stats (
    id SERIAL PRIMARY KEY,
    cache_key VARCHAR(255) NOT NULL,
    hits INTEGER DEFAULT 0,
    misses INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at_ts TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cache_stats_cache_key ON cache_stats(cache_key);

-- ============================================================================
-- 테이블 7: 시스템 메트릭 (system_metrics)
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100),
    metric_value FLOAT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_system_metrics_metric_name ON system_metrics(metric_name);
CREATE INDEX idx_system_metrics_recorded_at ON system_metrics(recorded_at DESC);

-- ============================================================================
-- 테이블 8: 에러 로그 (error_logs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS error_logs (
    id SERIAL PRIMARY KEY,
    level VARCHAR(20),  -- 'ERROR', 'WARN', 'INFO', 'DEBUG'
    message TEXT,
    stack_trace TEXT,
    context JSONB,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_error_logs_level ON error_logs(level);
CREATE INDEX idx_error_logs_logged_at ON error_logs(logged_at DESC);

-- ============================================================================
-- 뷰: 인기 포스트 (popular_posts)
-- ============================================================================
CREATE OR REPLACE VIEW popular_posts AS
SELECT
    id, title, author, view_count, likes,
    (view_count + likes * 2) AS popularity_score,
    created_at_ts
FROM posts
WHERE status = 'published'
ORDER BY popularity_score DESC
LIMIT 100;

-- ============================================================================
-- 뷰: 최신 댓글 (recent_comments)
-- ============================================================================
CREATE OR REPLACE VIEW recent_comments AS
SELECT
    c.id, c.post_id, c.author, c.content,
    p.title AS post_title,
    c.created_at_ts
FROM comments c
JOIN posts p ON c.post_id = p.id
WHERE c.approved = true AND p.status = 'published'
ORDER BY c.created_at_ts DESC
LIMIT 100;

-- ============================================================================
-- 저장 프로시저: 포스트 조회수 증가 (increment_view_count)
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_view_count(post_id INT)
RETURNS void AS $$
BEGIN
    UPDATE posts
    SET view_count = view_count + 1,
        updated_at_ts = NOW()
    WHERE id = post_id;

    INSERT INTO view_stats (post_id) VALUES (post_id);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 저장 프로시저: 댓글 추가 (add_comment)
-- ============================================================================
CREATE OR REPLACE FUNCTION add_comment(
    post_id INT,
    author VARCHAR,
    email VARCHAR,
    content TEXT
)
RETURNS INT AS $$
DECLARE
    comment_id INT;
BEGIN
    INSERT INTO comments (post_id, author, email, content, approved, created_at)
    VALUES (post_id, author, email, content, false, EXTRACT(EPOCH FROM NOW())::BIGINT * 1000)
    RETURNING id INTO comment_id;

    RETURN comment_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 초기 데이터 (선택사항: 테스트용)
-- ============================================================================
INSERT INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@freelang.dev', '$2b$10$example_hash_here', 'admin'),
('editor', 'editor@freelang.dev', '$2b$10$example_hash_here', 'editor')
ON CONFLICT (username) DO NOTHING;

INSERT INTO posts (title, description, content, author, category, status, created_at, updated_at) VALUES
('Welcome to FreeLang',
 'FreeLang is a powerful programming language',
 'FreeLang은 고성능 프로그래밍 언어입니다. 이것은 초기 포스트입니다.',
 'admin',
 'announcement',
 'published',
 EXTRACT(EPOCH FROM NOW())::BIGINT * 1000,
 EXTRACT(EPOCH FROM NOW())::BIGINT * 1000
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 권한 설정
-- ============================================================================
-- 필요시 애플리케이션 사용자 생성
-- CREATE USER freelang_app WITH PASSWORD 'secure_password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO freelang_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO freelang_app;

-- ============================================================================
-- 마이그레이션 로깅 (선택사항)
-- ============================================================================
-- 이 스크립트 실행 완료를 기록
COMMENT ON DATABASE freelang IS 'FreeLang Light Blog Database - initialized at ' || NOW()::TEXT;

-- EOF
