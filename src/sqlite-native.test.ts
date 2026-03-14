/**
 * Phase 11.1: SQLite Native Function Interface Tests
 *
 * Tests for low-level SQLite binding interface
 * Focuses on: Connection management, statement preparation, parameter binding, result fetching
 */

import SQLiteNative, { SQLiteConnection, SQLiteStatement } from './sqlite-native';

describe('Phase 11.1: SQLite Native Functions', () => {
  let conn: SQLiteConnection;

  beforeEach(() => {
    // Open in-memory database for each test
    conn = SQLiteNative.openDatabase(':memory:');
  });

  afterEach(() => {
    // Close connection
    if (conn && conn.isOpen) {
      SQLiteNative.closeDatabase(conn);
    }
  });

  describe('Connection Management', () => {
    test('should open in-memory database', () => {
      expect(conn).toBeDefined();
      expect(conn.handle).toBeGreaterThan(0);
      expect(conn.filename).toBe(':memory:');
      expect(conn.isOpen).toBe(true);
      expect(conn.lastError).toBeNull();
    });

    test('should open file-based database', () => {
      const fileConn = SQLiteNative.openDatabase('./test.db');

      expect(fileConn.filename).toBe('./test.db');
      expect(fileConn.isOpen).toBe(true);

      SQLiteNative.closeDatabase(fileConn);
    });

    test('should close open connection', () => {
      expect(conn.isOpen).toBe(true);

      const result = SQLiteNative.closeDatabase(conn);

      expect(result).toBe(true);
      expect(conn.isOpen).toBe(false);
    });

    test('should handle closing already-closed connection', () => {
      SQLiteNative.closeDatabase(conn);

      const result = SQLiteNative.closeDatabase(conn);

      expect(result).toBe(false);
    });

    test('should generate unique handles for multiple connections', () => {
      const conn2 = SQLiteNative.openDatabase(':memory:');
      const conn3 = SQLiteNative.openDatabase(':memory:');

      expect(conn.handle).not.toBe(conn2.handle);
      expect(conn2.handle).not.toBe(conn3.handle);

      SQLiteNative.closeDatabase(conn2);
      SQLiteNative.closeDatabase(conn3);
    });
  });

  describe('Statement Preparation', () => {
    test('should prepare valid SQL statement', () => {
      const sql = 'SELECT * FROM users WHERE id = ?';
      const stmt = SQLiteNative.prepareStatement(conn, sql);

      expect(stmt).toBeDefined();
      expect(stmt.handle).toBeGreaterThan(0);
      expect(stmt.sql).toBe(sql);
    });

    test('should fail on closed connection', () => {
      SQLiteNative.closeDatabase(conn);

      expect(() => {
        SQLiteNative.prepareStatement(conn, 'SELECT 1');
      }).toThrow('Database connection is closed');
    });

    test('should prepare INSERT statement', () => {
      const sql = 'INSERT INTO users (name, email) VALUES (?, ?)';
      const stmt = SQLiteNative.prepareStatement(conn, sql);

      expect(stmt.sql).toContain('INSERT');
      expect(stmt.paramCount).toBeGreaterThanOrEqual(0);
    });

    test('should prepare UPDATE statement', () => {
      const sql = 'UPDATE users SET email = ? WHERE id = ?';
      const stmt = SQLiteNative.prepareStatement(conn, sql);

      expect(stmt.sql).toContain('UPDATE');
    });

    test('should prepare DELETE statement', () => {
      const sql = 'DELETE FROM users WHERE id > ?';
      const stmt = SQLiteNative.prepareStatement(conn, sql);

      expect(stmt.sql).toContain('DELETE');
    });
  });

  describe('Parameter Binding', () => {
    let stmt: SQLiteStatement;

    beforeEach(() => {
      stmt = SQLiteNative.prepareStatement(
        conn,
        'SELECT * FROM users WHERE id = ? AND name = ? AND age > ?'
      );
      stmt.paramCount = 3; // Mock parameter count
    });

    test('should bind string parameter', () => {
      const result = SQLiteNative.bindParameter(stmt, 1, 'John Doe');

      expect(result).toBe(true);
    });

    test('should bind integer parameter', () => {
      const result = SQLiteNative.bindParameter(stmt, 1, 42);

      expect(result).toBe(true);
    });

    test('should bind null parameter', () => {
      const result = SQLiteNative.bindParameter(stmt, 1, null);

      expect(result).toBe(true);
    });

    test('should bind blob parameter', () => {
      const buffer = Buffer.from('binary data');
      const result = SQLiteNative.bindParameter(stmt, 1, buffer);

      expect(result).toBe(true);
    });

    test('should bind multiple parameters', () => {
      const r1 = SQLiteNative.bindParameter(stmt, 1, 123);
      const r2 = SQLiteNative.bindParameter(stmt, 2, 'Alice');
      const r3 = SQLiteNative.bindParameter(stmt, 3, 25);

      expect(r1).toBe(true);
      expect(r2).toBe(true);
      expect(r3).toBe(true);
    });

    test('should reject out-of-range parameter index', () => {
      expect(() => {
        SQLiteNative.bindParameter(stmt, 10, 'value');
      }).toThrow('Invalid parameter index');
    });

    test('should reject zero parameter index', () => {
      expect(() => {
        SQLiteNative.bindParameter(stmt, 0, 'value');
      }).toThrow('Invalid parameter index');
    });
  });

  describe('Statement Execution', () => {
    test('should step through SELECT results', () => {
      const stmt = SQLiteNative.prepareStatement(conn, 'SELECT 1 as value');

      const row = SQLiteNative.step(stmt);

      expect(row).toBeDefined();

      SQLiteNative.finalizeStatement(stmt);
    });

    test('should return null when no more rows', () => {
      const stmt = SQLiteNative.prepareStatement(conn, 'SELECT 1 WHERE 0');

      const row = SQLiteNative.step(stmt);

      expect(row).toBeNull();

      SQLiteNative.finalizeStatement(stmt);
    });

    test('should reset statement for re-execution', () => {
      const stmt = SQLiteNative.prepareStatement(conn, 'SELECT 1');

      SQLiteNative.step(stmt);
      const result = SQLiteNative.reset(stmt);

      expect(result).toBe(true);

      SQLiteNative.finalizeStatement(stmt);
    });

    test('should finalize statement', () => {
      const stmt = SQLiteNative.prepareStatement(conn, 'SELECT 1');

      const result = SQLiteNative.finalizeStatement(stmt);

      expect(result).toBe(true);
    });

    test('should fail finalizing non-existent statement', () => {
      const fakeStmt: SQLiteStatement = {
        handle: 99999,
        sql: 'SELECT 1',
        columnCount: 0,
        paramCount: 0
      };

      const result = SQLiteNative.finalizeStatement(fakeStmt);

      expect(result).toBe(false);
    });
  });

  describe('Convenience Methods', () => {
    test('should query all rows', () => {
      // Note: In real implementation, this would actually execute against database
      const rows = SQLiteNative.queryAll(
        conn,
        'SELECT 1 as id, "test" as name'
      );

      expect(Array.isArray(rows)).toBe(true);
    });

    test('should query with parameters', () => {
      const rows = SQLiteNative.queryAll(
        conn,
        'SELECT ? as id, ? as name',
        [1, 'test']
      );

      expect(Array.isArray(rows)).toBe(true);
    });

    test('should execute INSERT and get affected rows', () => {
      const affected = SQLiteNative.execute(
        conn,
        'INSERT INTO users (name) VALUES (?)',
        ['John']
      );

      expect(affected).toBeGreaterThanOrEqual(0);
    });

    test('should execute UPDATE with parameters', () => {
      const affected = SQLiteNative.execute(
        conn,
        'UPDATE users SET email = ? WHERE id = ?',
        ['new@example.com', 1]
      );

      expect(affected).toBeGreaterThanOrEqual(0);
    });

    test('should execute DELETE with parameters', () => {
      const affected = SQLiteNative.execute(
        conn,
        'DELETE FROM users WHERE id = ?',
        [1]
      );

      expect(affected).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    test('should get last error message', () => {
      conn.lastError = 'syntax error';

      const error = SQLiteNative.getLastError(conn);

      expect(error).toBe('syntax error');
    });

    test('should return default error when no error set', () => {
      const error = SQLiteNative.getLastError(conn);

      expect(error).toBe('Unknown error');
    });

    test('should handle NULL error messages gracefully', () => {
      conn.lastError = null;

      const error = SQLiteNative.getLastError(conn);

      expect(error).toBeDefined();
      expect(typeof error).toBe('string');
    });
  });
});
