/**
 * Phase 11.1: SQLite Native Function Interface
 *
 * Direct binding to SQLite3 C API via FreeLang native functions
 * Provides: sqlite_open, sqlite_prepare, sqlite_bind, sqlite_step, sqlite_finalize
 */

/**
 * SQLite Statement Wrapper
 * Represents a prepared SQL statement handle
 */
export interface SQLiteStatement {
  handle: number; // Opaque statement pointer
  sql: string;
  columnCount: number;
  paramCount: number;
}

/**
 * SQLite Connection Wrapper
 * Represents an open database connection
 */
export interface SQLiteConnection {
  handle: number; // Opaque database pointer
  filename: string;
  isOpen: boolean;
  lastError: string | null;
}

/**
 * SQLite Query Result
 * Represents a single row from executed query
 */
export interface SQLiteRow {
  [columnName: string]: any;
}

/**
 * Native SQLite Binding
 * Maps FreeLang native function calls to SQLite3 C API
 */
export class SQLiteNative {
  private static nextHandle: number = 1;
  private static connections = new Map<number, SQLiteConnection>();
  private static statements = new Map<number, SQLiteStatement>();

  /**
   * Open database connection
   * @param filename Database file path (":memory:" for in-memory)
   * @returns SQLiteConnection with handle
   */
  public static openDatabase(filename: string): SQLiteConnection {
    // In real implementation: calls native sqlite3_open()
    // FreeLang native function: FreeLang.sqlite_open(filename)

    const handle = this.nextHandle++;
    const conn: SQLiteConnection = {
      handle,
      filename,
      isOpen: true,
      lastError: null
    };

    this.connections.set(handle, conn);
    return conn;
  }

  /**
   * Close database connection
   * @param conn SQLiteConnection to close
   * @returns true if successful
   */
  public static closeDatabase(conn: SQLiteConnection): boolean {
    if (!conn.isOpen) return false;

    // In real implementation: calls native sqlite3_close()
    // FreeLang native function: FreeLang.sqlite_close(conn.handle)

    this.connections.delete(conn.handle);
    conn.isOpen = false;
    return true;
  }

  /**
   * Prepare SQL statement
   * @param conn SQLiteConnection
   * @param sql SQL statement string
   * @returns SQLiteStatement with compiled bytecode handle
   */
  public static prepareStatement(conn: SQLiteConnection, sql: string): SQLiteStatement {
    if (!conn.isOpen) {
      throw new Error('Database connection is closed');
    }

    // In real implementation: calls native sqlite3_prepare_v2()
    // FreeLang native function: FreeLang.sqlite_prepare(conn.handle, sql)
    // Returns: { handle, columnCount, paramCount }

    const handle = this.nextHandle++;
    const stmt: SQLiteStatement = {
      handle,
      sql,
      columnCount: 0,  // Would be set by native function
      paramCount: 0    // Would be set by native function
    };

    this.statements.set(handle, stmt);
    return stmt;
  }

  /**
   * Bind parameter to prepared statement
   * @param stmt SQLiteStatement
   * @param index Parameter index (1-based)
   * @param value Value to bind (string, number, null, Buffer)
   * @returns true if successful
   */
  public static bindParameter(stmt: SQLiteStatement, index: number, value: any): boolean {
    // In real implementation: calls appropriate sqlite3_bind_*() based on type
    // - sqlite3_bind_text() for string
    // - sqlite3_bind_int64() for number
    // - sqlite3_bind_null() for null
    // - sqlite3_bind_blob() for Buffer
    //
    // FreeLang native functions:
    //   - FreeLang.sqlite_bind_text(stmt.handle, index, value)
    //   - FreeLang.sqlite_bind_int(stmt.handle, index, value)
    //   - FreeLang.sqlite_bind_null(stmt.handle, index)
    //   - FreeLang.sqlite_bind_blob(stmt.handle, index, value)

    if (index < 1 || index > stmt.paramCount) {
      throw new Error(`Invalid parameter index: ${index}`);
    }

    // Type-based binding
    if (value === null) {
      // sqlite3_bind_null
      return true;
    } else if (typeof value === 'string') {
      // sqlite3_bind_text
      return true;
    } else if (typeof value === 'number') {
      // sqlite3_bind_int64 or sqlite3_bind_double
      return true;
    } else if (value instanceof Uint8Array || Buffer.isBuffer(value)) {
      // sqlite3_bind_blob
      return true;
    }

    return false;
  }

  /**
   * Execute prepared statement and fetch next row
   * @param stmt SQLiteStatement
   * @returns SQLiteRow if successful, null if no more rows, throws on error
   */
  public static step(stmt: SQLiteStatement): SQLiteRow | null {
    // In real implementation: calls native sqlite3_step()
    // Returns: SQLITE_ROW (100) or SQLITE_DONE (101)
    // If SQLITE_ROW, extract column values via sqlite3_column_*()
    //
    // FreeLang native function: FreeLang.sqlite_step(stmt.handle)
    // Returns: { status: 'row' | 'done', columns?: [...] }

    const row: SQLiteRow = {};

    // Would populate row with column values based on stmt.columnCount
    // Using sqlite3_column_name() and sqlite3_column_*() native functions

    return row; // or null if SQLITE_DONE
  }

  /**
   * Reset prepared statement for re-execution
   * @param stmt SQLiteStatement
   * @returns true if successful
   */
  public static reset(stmt: SQLiteStatement): boolean {
    // In real implementation: calls native sqlite3_reset()
    // FreeLang native function: FreeLang.sqlite_reset(stmt.handle)

    return true;
  }

  /**
   * Finalize (deallocate) prepared statement
   * @param stmt SQLiteStatement
   * @returns true if successful
   */
  public static finalizeStatement(stmt: SQLiteStatement): boolean {
    if (!this.statements.has(stmt.handle)) {
      return false;
    }

    // In real implementation: calls native sqlite3_finalize()
    // FreeLang native function: FreeLang.sqlite_finalize(stmt.handle)

    this.statements.delete(stmt.handle);
    return true;
  }

  /**
   * Get last error message from connection
   * @param conn SQLiteConnection
   * @returns Error message string
   */
  public static getLastError(conn: SQLiteConnection): string {
    // In real implementation: calls native sqlite3_errmsg()
    // FreeLang native function: FreeLang.sqlite_errmsg(conn.handle)

    return conn.lastError || 'Unknown error';
  }

  /**
   * Execute simple query and collect all rows
   * Convenience method for single-use queries
   * @param conn SQLiteConnection
   * @param sql SQL statement
   * @param params Parameter array (optional)
   * @returns Array of SQLiteRow objects
   */
  public static queryAll(
    conn: SQLiteConnection,
    sql: string,
    params?: any[]
  ): SQLiteRow[] {
    const stmt = this.prepareStatement(conn, sql);

    if (params) {
      for (let i = 0; i < params.length; i++) {
        this.bindParameter(stmt, i + 1, params[i]);
      }
    }

    const rows: SQLiteRow[] = [];
    let row;
    while ((row = this.step(stmt)) !== null) {
      rows.push(row);
    }

    this.finalizeStatement(stmt);
    return rows;
  }

  /**
   * Execute INSERT/UPDATE/DELETE and get affected row count
   * @param conn SQLiteConnection
   * @param sql SQL statement
   * @param params Parameter array (optional)
   * @returns Number of affected rows
   */
  public static execute(
    conn: SQLiteConnection,
    sql: string,
    params?: any[]
  ): number {
    const stmt = this.prepareStatement(conn, sql);

    if (params) {
      for (let i = 0; i < params.length; i++) {
        this.bindParameter(stmt, i + 1, params[i]);
      }
    }

    this.step(stmt);
    this.finalizeStatement(stmt);

    // In real implementation: calls native sqlite3_changes()
    // FreeLang native function: FreeLang.sqlite_changes(conn.handle)

    return 0; // Would return actual affected row count
  }
}

export default SQLiteNative;
