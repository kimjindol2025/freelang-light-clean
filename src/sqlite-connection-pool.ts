/**
 * Phase 11.2: SQLite Connection Pool
 *
 * Manages a pool of reusable database connections with:
 * - Connection caching and reuse
 * - Concurrent access control
 * - Idle connection cleanup
 * - Pool statistics and monitoring
 */

import SQLiteNative, { SQLiteConnection } from './sqlite-native';

/**
 * Pool Configuration Options
 */
export interface PoolOptions {
  maxConnections?: number;        // Maximum number of connections (default: 5)
  idleTimeout?: number;           // Idle timeout in ms (default: 30000)
  acquireTimeout?: number;        // Timeout waiting for connection (default: 10000)
  connectionCheckInterval?: number; // Check idle connections every N ms (default: 5000)
}

/**
 * Pool Statistics
 */
export interface PoolStats {
  totalCreated: number;           // Total connections created
  activeConnections: number;      // Currently in use
  idleConnections: number;        // Available in pool
  waitingRequests: number;        // Requests waiting for connection
  totalAcquired: number;          // Total acquire() calls
  totalReleased: number;          // Total release() calls
  idleTimeouts: number;           // Connections closed due to idle timeout
  averageAcquireTime: number;     // Average ms to acquire connection
}

/**
 * Connection Wrapper
 * Tracks usage time and metadata
 */
interface PooledConnection {
  connection: SQLiteConnection;
  createdAt: number;
  lastUsedAt: number;
  inUse: boolean;
  id: string;
}

/**
 * Pending Request Queue Item
 */
interface PendingRequest {
  resolve: (conn: SQLiteConnection) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

/**
 * SQLite Connection Pool
 * Manages reusable database connections with lifecycle management
 */
export class SQLiteConnectionPool {
  private filename: string;
  private options: Required<PoolOptions>;
  private connections: Map<string, PooledConnection> = new Map();
  private availablePool: string[] = [];
  private pendingRequests: PendingRequest[] = [];
  private nextConnId: number = 1;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private stats = {
    totalCreated: 0,
    totalAcquired: 0,
    totalReleased: 0,
    idleTimeouts: 0,
    acquireTimings: [] as number[]
  };
  private isClosed: boolean = false;

  constructor(filename: string, options: PoolOptions = {}) {
    this.filename = filename;
    this.options = {
      maxConnections: options.maxConnections ?? 5,
      idleTimeout: options.idleTimeout ?? 30000,
      acquireTimeout: options.acquireTimeout ?? 10000,
      connectionCheckInterval: options.connectionCheckInterval ?? 5000
    };

    // Start cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Acquire connection from pool or create new one
   * @returns SQLiteConnection ready to use
   */
  public async acquire(): Promise<SQLiteConnection> {
    if (this.isClosed) {
      throw new Error('Connection pool is closed');
    }

    const acquireStart = Date.now();

    // Check if connection available in pool
    if (this.availablePool.length > 0) {
      const connId = this.availablePool.pop();
      if (connId) {
        const pooled = this.connections.get(connId);
        if (pooled) {
          pooled.inUse = true;
          pooled.lastUsedAt = Date.now();

          this.stats.totalAcquired++;
          const duration = Date.now() - acquireStart;
          this.stats.acquireTimings.push(duration);

          return pooled.connection;
        }
      }
    }

    // Create new connection if under limit
    if (this.connections.size < this.options.maxConnections) {
      const conn = SQLiteNative.openDatabase(this.filename);
      const connId = `conn-${this.nextConnId++}`;
      const pooled: PooledConnection = {
        connection: conn,
        createdAt: Date.now(),
        lastUsedAt: Date.now(),
        inUse: true,
        id: connId
      };

      this.connections.set(connId, pooled);
      this.stats.totalCreated++;
      this.stats.totalAcquired++;

      const duration = Date.now() - acquireStart;
      this.stats.acquireTimings.push(duration);

      return conn;
    }

    // Wait for connection to become available
    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        const index = this.pendingRequests.indexOf(request);
        if (index >= 0) {
          this.pendingRequests.splice(index, 1);
        }
        reject(new Error(`Timeout waiting for connection after ${this.options.acquireTimeout}ms`));
      }, this.options.acquireTimeout);

      const request: PendingRequest = {
        resolve: (conn) => {
          clearTimeout(timeoutHandle);
          this.stats.totalAcquired++;
          const duration = Date.now() - acquireStart;
          this.stats.acquireTimings.push(duration);
          resolve(conn);
        },
        reject: (error) => {
          clearTimeout(timeoutHandle);
          reject(error);
        },
        timestamp: Date.now()
      };

      this.pendingRequests.push(request);
    });
  }

  /**
   * Release connection back to pool
   * @param conn Connection to release
   */
  public release(conn: SQLiteConnection): void {
    if (this.isClosed) {
      // Close connection if pool is closed
      SQLiteNative.closeDatabase(conn);
      return;
    }

    // Find connection in pool
    for (const [connId, pooled] of this.connections.entries()) {
      if (pooled.connection === conn) {
        pooled.inUse = false;
        pooled.lastUsedAt = Date.now();
        this.stats.totalReleased++;

        // Check if there are pending requests
        if (this.pendingRequests.length > 0) {
          const request = this.pendingRequests.shift();
          if (request) {
            pooled.inUse = true;
            request.resolve(conn);
            return;
          }
        }

        // Return to available pool
        this.availablePool.push(connId);
        return;
      }
    }
  }

  /**
   * Close all connections and shutdown pool
   */
  public async close(): Promise<void> {
    if (this.isClosed) {
      return;
    }

    this.isClosed = true;

    // Stop cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Reject pending requests
    for (const request of this.pendingRequests) {
      request.reject(new Error('Connection pool is closed'));
    }
    this.pendingRequests = [];

    // Close all connections
    for (const [, pooled] of this.connections.entries()) {
      try {
        SQLiteNative.closeDatabase(pooled.connection);
      } catch (error) {
        // Ignore errors when closing
      }
    }

    this.connections.clear();
    this.availablePool = [];
  }

  /**
   * Get pool statistics
   */
  public getStats(): PoolStats {
    const activeConnections = Array.from(this.connections.values())
      .filter(p => p.inUse).length;
    const idleConnections = this.availablePool.length;

    let averageAcquireTime = 0;
    if (this.stats.acquireTimings.length > 0) {
      const sum = this.stats.acquireTimings.reduce((a, b) => a + b, 0);
      averageAcquireTime = Math.round(sum / this.stats.acquireTimings.length);
    }

    return {
      totalCreated: this.stats.totalCreated,
      activeConnections,
      idleConnections,
      waitingRequests: this.pendingRequests.length,
      totalAcquired: this.stats.totalAcquired,
      totalReleased: this.stats.totalReleased,
      idleTimeouts: this.stats.idleTimeouts,
      averageAcquireTime
    };
  }

  /**
   * Reset pool statistics
   */
  public resetStats(): void {
    this.stats = {
      totalCreated: this.stats.totalCreated,
      totalAcquired: 0,
      totalReleased: 0,
      idleTimeouts: 0,
      acquireTimings: []
    };
  }

  /**
   * Start periodic cleanup of idle connections
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleConnections();
    }, this.options.connectionCheckInterval);

    // Unref so it doesn't keep process alive
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Remove idle connections that exceed timeout
   */
  private cleanupIdleConnections(): void {
    const now = Date.now();
    const toRemove: string[] = [];

    for (const [connId, pooled] of this.connections.entries()) {
      // Only check idle connections
      if (!pooled.inUse) {
        const idleSince = now - pooled.lastUsedAt;

        // Remove if idle longer than timeout
        if (idleSince > this.options.idleTimeout) {
          toRemove.push(connId);
        }
      }
    }

    // Remove idle connections
    for (const connId of toRemove) {
      const pooled = this.connections.get(connId);
      if (pooled) {
        try {
          SQLiteNative.closeDatabase(pooled.connection);
        } catch (error) {
          // Ignore errors when closing
        }

        this.connections.delete(connId);

        // Remove from available pool
        const index = this.availablePool.indexOf(connId);
        if (index >= 0) {
          this.availablePool.splice(index, 1);
        }

        this.stats.idleTimeouts++;
      }
    }
  }

  /**
   * Check pool health status
   */
  public getHealthStatus(): {
    isHealthy: boolean;
    activeConnections: number;
    availableConnections: number;
    waitingRequests: number;
  } {
    const stats = this.getStats();

    return {
      isHealthy: stats.waitingRequests === 0 && !this.isClosed,
      activeConnections: stats.activeConnections,
      availableConnections: stats.idleConnections,
      waitingRequests: stats.waitingRequests
    };
  }
}

export default SQLiteConnectionPool;
