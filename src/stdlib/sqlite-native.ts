/**
 * FreeLang v2 - SQLite Native Functions
 * Phase H: SQLite database driver via /usr/bin/sqlite3 CLI (zero npm)
 *
 * Provides database operations:
 * - db_open(path) → db_id
 * - db_query(db_id, sql, params) → results array
 * - db_exec(db_id, sql, params) → success/failure
 * - db_close(db_id)
 * - db_all(db_id, sql, params) → all rows
 * - db_one(db_id, sql, params) → first row or null
 */

import { spawnSync } from 'child_process';
import { NativeFunctionRegistry } from '../vm/native-function-registry';
import { FFIFunctionSignature } from '../ffi/type-bindings';

const SQLITE3_BIN = '/usr/bin/sqlite3';

/**
 * SQLite 데이터베이스 풀 관리 (CLI 기반 - 파일 경로만 보관)
 * Map<db_id: number, { file: string }>
 * Compile-Time-ORM: orm-native.ts가 참조할 수 있도록 export
 */
export const sqlitePool = new Map<number, { file: string }>();
let nextDbId = 1000;

/** SQL 파라미터 바인딩 (? → 이스케이프된 값) */
function bindSql(sql: string, params: any[]): string {
  let i = 0;
  return sql.replace(/\?/g, () => {
    const v = params[i++];
    if (v === null || v === undefined) return 'NULL';
    if (typeof v === 'number') return String(v);
    return `'${String(v).replace(/'/g, "''")}'`;
  });
}

/** sqlite3 CLI 실행 헬퍼 */
function runSqliteCli(file: string, sql: string, params: any[]): {
  rows: any[];
  rowCount: number;
  lastId: number;
  changes: number;
} {
  const bound = bindSql(sql, params);
  const isSelect = /^\s*SELECT/i.test(bound.trim());

  if (isSelect) {
    const r = spawnSync(SQLITE3_BIN, ['-json', file], {
      input: bound,
      encoding: 'utf8',
      timeout: 10000,
    });
    const out = r.stdout?.trim();
    const rows = out ? JSON.parse(out) : [];
    return { rows, rowCount: rows.length, lastId: 0, changes: 0 };
  }

  // DML: changes() + last_insert_rowid()
  const wrapped = `${bound}; SELECT changes() as _c, last_insert_rowid() as _lid;`;
  const r = spawnSync(SQLITE3_BIN, ['-json', file], {
    input: wrapped,
    encoding: 'utf8',
    timeout: 10000,
  });
  if (r.error) throw r.error;
  const out = r.stdout?.trim();
  const meta = out ? JSON.parse(out) : [{ _c: 0, _lid: 0 }];
  const m = Array.isArray(meta) ? meta[meta.length - 1] : meta;
  return { rows: [], rowCount: 0, lastId: m?._lid ?? 0, changes: m?._c ?? 0 };
}

/**
 * Register SQLite native functions
 */
export function registerSQLiteNativeFunctions(registry: NativeFunctionRegistry): void {
  // ────────────────────────────────────────────────────────────
  // DB_OPEN: 데이터베이스 연결 (경로)
  // ────────────────────────────────────────────────────────────

  registry.register({
    name: 'db_open',
    module: 'sqlite',
    executor: (args) => {
      try {
        const dbPath = String(args[0]);
        const dbId = nextDbId++;
        sqlitePool.set(dbId, { file: dbPath });
        return dbId;
      } catch (error) {
        console.error('db_open error:', error);
        return -1;
      }
    },
  });

  // ────────────────────────────────────────────────────────────
  // DB_EXEC: SQL 실행 (INSERT/UPDATE/DELETE)
  // ────────────────────────────────────────────────────────────

  registry.register({
    name: 'db_exec',
    module: 'sqlite',
    executor: (args) => {
      try {
        const dbId = args[0] as number;
        const sql = String(args[1]);
        const params = (args[2] as any[]) || [];

        const entry = sqlitePool.get(dbId);
        if (!entry) {
          console.error(`db_exec: Database ${dbId} not found`);
          return false;
        }

        const result = runSqliteCli(entry.file, sql, params);
        return result.changes > 0;
      } catch (error) {
        console.error('db_exec error:', error);
        return false;
      }
    },
    signature: {
      name: 'db_exec',
      returnType: 'boolean',
      parameters: [
        { name: 'db_id', type: 'number' },
        { name: 'sql', type: 'string' },
        { name: 'params', type: 'array' }
      ],
      category: 'event'
    } as FFIFunctionSignature
  });

  // ────────────────────────────────────────────────────────────
  // DB_QUERY: SQL SELECT 실행 (모든 행)
  // ────────────────────────────────────────────────────────────

  registry.register({
    name: 'db_query',
    module: 'sqlite',
    executor: (args) => {
      try {
        const dbId = args[0] as number;
        const sql = String(args[1]);
        const params = (args[2] as any[]) || [];

        const entry = sqlitePool.get(dbId);
        if (!entry) {
          console.error(`db_query: Database ${dbId} not found`);
          return [];
        }

        return runSqliteCli(entry.file, sql, params).rows;
      } catch (error) {
        console.error('db_query error:', error);
        return [];
      }
    },
    signature: {
      name: 'db_query',
      returnType: 'array',
      parameters: [
        { name: 'db_id', type: 'number' },
        { name: 'sql', type: 'string' },
        { name: 'params', type: 'array' }
      ],
      category: 'event'
    } as FFIFunctionSignature
  });

  // ────────────────────────────────────────────────────────────
  // DB_ONE: SQL SELECT 실행 (첫 행만)
  // ────────────────────────────────────────────────────────────

  registry.register({
    name: 'db_one',
    module: 'sqlite',
    executor: (args) => {
      try {
        const dbId = args[0] as number;
        const sql = String(args[1]);
        const params = (args[2] as any[]) || [];

        const entry = sqlitePool.get(dbId);
        if (!entry) {
          console.error(`db_one: Database ${dbId} not found`);
          return null;
        }

        const rows = runSqliteCli(entry.file, sql, params).rows;
        return rows[0] ?? null;
      } catch (error) {
        console.error('db_one error:', error);
        return null;
      }
    },
    signature: {
      name: 'db_one',
      returnType: 'object',
      parameters: [
        { name: 'db_id', type: 'number' },
        { name: 'sql', type: 'string' },
        { name: 'params', type: 'array' }
      ],
      category: 'event'
    } as FFIFunctionSignature
  });

  // ────────────────────────────────────────────────────────────
  // DB_ALL: SQL SELECT 실행 (배열 반환)
  // ────────────────────────────────────────────────────────────

  registry.register({
    name: 'db_all',
    module: 'sqlite',
    executor: (args) => {
      try {
        const dbId = args[0] as number;
        const sql = String(args[1]);
        const params = (args[2] as any[]) || [];

        const entry = sqlitePool.get(dbId);
        if (!entry) {
          console.error(`db_all: Database ${dbId} not found`);
          return [];
        }

        return runSqliteCli(entry.file, sql, params).rows;
      } catch (error) {
        console.error('db_all error:', error);
        return [];
      }
    },
  });

  // ────────────────────────────────────────────────────────────
  // DB_CLOSE: 데이터베이스 연결 종료
  // ────────────────────────────────────────────────────────────

  registry.register({
    name: 'db_close',
    module: 'sqlite',
    executor: (args) => {
      try {
        const dbId = args[0] as number;
        if (!sqlitePool.has(dbId)) {
          console.error(`db_close: Database ${dbId} not found`);
          return false;
        }
        sqlitePool.delete(dbId);
        return true;
      } catch (error) {
        console.error('db_close error:', error);
        return false;
      }
    },
  });

  // ────────────────────────────────────────────────────────────
  // DB_COUNT: 행 개수 조회
  // ────────────────────────────────────────────────────────────

  registry.register({
    name: 'db_count',
    module: 'sqlite',
    executor: (args) => {
      try {
        const dbId = args[0] as number;
        const sql = String(args[1]);
        const params = (args[2] as any[]) || [];

        const entry = sqlitePool.get(dbId);
        if (!entry) {
          console.error(`db_count: Database ${dbId} not found`);
          return 0;
        }

        const rows = runSqliteCli(entry.file, sql, params).rows;
        const row = rows[0] as any;
        return row?.count ?? row?.[Object.keys(row || {})[0]] ?? 0;
      } catch (error) {
        console.error('db_count error:', error);
        return 0;
      }
    },
  });

  // ────────────────────────────────────────────────────────────
  // DB_LAST_INSERT_ROWID: 마지막 INSERT의 rowid
  // ────────────────────────────────────────────────────────────

  registry.register({
    name: 'db_last_insert_rowid',
    module: 'sqlite',
    executor: (args) => {
      try {
        const dbId = args[0] as number;
        const entry = sqlitePool.get(dbId);
        if (!entry) {
          console.error(`db_last_insert_rowid: Database ${dbId} not found`);
          return 0;
        }

        const rows = runSqliteCli(entry.file, 'SELECT last_insert_rowid() as id', []).rows;
        return (rows[0] as any)?.id ?? 0;
      } catch (error) {
        console.error('db_last_insert_rowid error:', error);
        return 0;
      }
    },
  });

  process.stderr.write('✅ SQLite native functions registered (Phase H - CLI mode)\n');
}
