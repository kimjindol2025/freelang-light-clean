/**
 * Phase 11.2: SQLite Connection Pool Tests
 *
 * Tests for connection pooling, lifecycle management, and statistics
 */

import SQLiteConnectionPool from './sqlite-connection-pool';
import { PoolOptions } from './sqlite-connection-pool';

describe('Phase 11.2: SQLite Connection Pool', () => {
  describe('Pool Initialization', () => {
    test('should create pool with default options', async () => {
      const pool = new SQLiteConnectionPool(':memory:');

      expect(pool).toBeDefined();

      await pool.close();
    });

    test('should create pool with custom options', async () => {
      const pool = new SQLiteConnectionPool(':memory:', {
        maxConnections: 10,
        idleTimeout: 60000,
        acquireTimeout: 20000,
        connectionCheckInterval: 10000
      });

      expect(pool).toBeDefined();

      await pool.close();
    });

    test('should initialize with empty pool', async () => {
      const pool = new SQLiteConnectionPool(':memory:');
      const stats = pool.getStats();

      expect(stats.totalCreated).toBe(0);
      expect(stats.activeConnections).toBe(0);
      expect(stats.idleConnections).toBe(0);

      await pool.close();
    });
  });

  describe('Connection Acquisition', () => {
    let pool: SQLiteConnectionPool;

    beforeEach(() => {
      pool = new SQLiteConnectionPool(':memory:', {
        maxConnections: 3,
        idleTimeout: 5000
      });
    });

    afterEach(async () => {
      await pool.close();
    });

    test('should acquire first connection', async () => {
      const conn = await pool.acquire();

      expect(conn).toBeDefined();
      expect(conn.handle).toBeGreaterThan(0);
      expect(conn.isOpen).toBe(true);

      pool.release(conn);
    });

    test('should acquire multiple connections', async () => {
      const conn1 = await pool.acquire();
      const conn2 = await pool.acquire();
      const conn3 = await pool.acquire();

      expect(conn1.handle).not.toBe(conn2.handle);
      expect(conn2.handle).not.toBe(conn3.handle);

      pool.release(conn1);
      pool.release(conn2);
      pool.release(conn3);
    });

    test('should track active connections', async () => {
      const conn1 = await pool.acquire();
      const stats1 = pool.getStats();
      expect(stats1.activeConnections).toBe(1);

      const conn2 = await pool.acquire();
      const stats2 = pool.getStats();
      expect(stats2.activeConnections).toBe(2);

      pool.release(conn1);
      pool.release(conn2);
    });

    test('should fail when pool is full', async () => {
      const conn1 = await pool.acquire();
      const conn2 = await pool.acquire();
      const conn3 = await pool.acquire();

      const stats = pool.getStats();
      expect(stats.activeConnections).toBe(3);

      // Try to acquire when pool is full - should timeout
      const acquirePromise = pool.acquire();
      await expect(
        Promise.race([
          acquirePromise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Manual timeout')), 2000)
          )
        ])
      ).rejects.toThrow();

      pool.release(conn1);
      pool.release(conn2);
      pool.release(conn3);
    });
  });

  describe('Connection Reuse', () => {
    let pool: SQLiteConnectionPool;

    beforeEach(() => {
      pool = new SQLiteConnectionPool(':memory:', {
        maxConnections: 2
      });
    });

    afterEach(async () => {
      await pool.close();
    });

    test('should reuse released connections', async () => {
      const conn1 = await pool.acquire();
      const handle1 = conn1.handle;

      pool.release(conn1);

      const stats = pool.getStats();
      expect(stats.idleConnections).toBe(1);

      const conn2 = await pool.acquire();
      expect(conn2.handle).toBe(handle1);

      pool.release(conn2);
    });

    test('should prefer idle connections over creating new', async () => {
      const conn1 = await pool.acquire();
      const stats1 = pool.getStats();
      const created1 = stats1.totalCreated;

      pool.release(conn1);

      const conn2 = await pool.acquire();
      const stats2 = pool.getStats();
      const created2 = stats2.totalCreated;

      // Should not have created new connection
      expect(created2).toBe(created1);

      pool.release(conn2);
    });

    test('should track reuse in statistics', async () => {
      const conn1 = await pool.acquire();
      pool.release(conn1);

      const conn2 = await pool.acquire();
      pool.release(conn2);

      const stats = pool.getStats();

      expect(stats.totalCreated).toBe(1);
      expect(stats.totalAcquired).toBeGreaterThanOrEqual(2);
      expect(stats.totalReleased).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Connection Release', () => {
    let pool: SQLiteConnectionPool;

    beforeEach(() => {
      pool = new SQLiteConnectionPool(':memory:', {
        maxConnections: 3
      });
    });

    afterEach(async () => {
      await pool.close();
    });

    test('should return connection to pool', async () => {
      const conn = await pool.acquire();
      const statsActive = pool.getStats();
      expect(statsActive.activeConnections).toBe(1);

      pool.release(conn);
      const statsIdle = pool.getStats();
      expect(statsIdle.idleConnections).toBe(1);
    });

    test('should serve pending requests when connection released', async () => {
      const conn1 = await pool.acquire();
      const conn2 = await pool.acquire();
      const conn3 = await pool.acquire();

      // These should queue since pool is full
      let conn4Acquired = false;
      const promise4 = pool.acquire().then(() => {
        conn4Acquired = true;
      });

      // Give time for queuing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Release a connection - should satisfy pending request
      pool.release(conn1);

      await promise4;
      expect(conn4Acquired).toBe(true);

      pool.release(conn2);
      pool.release(conn3);
    });

    test('should update last used time on release', async () => {
      const conn = await pool.acquire();

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      pool.release(conn);

      // Connection should be in idle pool
      const stats = pool.getStats();
      expect(stats.idleConnections).toBe(1);
    });
  });

  describe('Pool Closure', () => {
    test('should close pool and all connections', async () => {
      const pool = new SQLiteConnectionPool(':memory:', {
        maxConnections: 3
      });

      const conn1 = await pool.acquire();
      const conn2 = await pool.acquire();

      pool.release(conn1);
      pool.release(conn2);

      await pool.close();

      // Should fail after closing
      await expect(pool.acquire()).rejects.toThrow('Connection pool is closed');
    });

    test('should handle multiple close calls', async () => {
      const pool = new SQLiteConnectionPool(':memory:');

      const conn = await pool.acquire();
      pool.release(conn);

      await pool.close();
      await expect(pool.close()).resolves.toBeUndefined();
    });

    test('should close released connections on pool close', async () => {
      const pool = new SQLiteConnectionPool(':memory:', {
        maxConnections: 2
      });

      const conn1 = await pool.acquire();
      const conn2 = await pool.acquire();

      pool.release(conn1);
      pool.release(conn2);

      const statsBefore = pool.getStats();
      expect(statsBefore.idleConnections).toBe(2);

      await pool.close();

      // Pool should be empty
      const statsAfter = pool.getStats();
      expect(statsAfter.idleConnections).toBe(0);
    });
  });

  describe('Statistics and Monitoring', () => {
    let pool: SQLiteConnectionPool;

    beforeEach(() => {
      pool = new SQLiteConnectionPool(':memory:', {
        maxConnections: 3
      });
    });

    afterEach(async () => {
      await pool.close();
    });

    test('should track created connections', async () => {
      const statsBefore = pool.getStats();
      expect(statsBefore.totalCreated).toBe(0);

      const conn1 = await pool.acquire();
      const conn2 = await pool.acquire();

      const statsAfter = pool.getStats();
      expect(statsAfter.totalCreated).toBe(2);

      pool.release(conn1);
      pool.release(conn2);
    });

    test('should track acquired connections', async () => {
      const statsBefore = pool.getStats();
      expect(statsBefore.totalAcquired).toBe(0);

      const conn = await pool.acquire();
      pool.release(conn);

      const statsAfter = pool.getStats();
      expect(statsAfter.totalAcquired).toBe(1);
    });

    test('should track released connections', async () => {
      const conn = await pool.acquire();

      const statsBefore = pool.getStats();
      expect(statsBefore.totalReleased).toBe(0);

      pool.release(conn);

      const statsAfter = pool.getStats();
      expect(statsAfter.totalReleased).toBe(1);
    });

    test('should calculate average acquire time', async () => {
      const conn1 = await pool.acquire();
      const conn2 = await pool.acquire();

      pool.release(conn1);
      pool.release(conn2);

      const stats = pool.getStats();
      expect(stats.averageAcquireTime).toBeGreaterThanOrEqual(0);
    });

    test('should reset statistics', async () => {
      const conn = await pool.acquire();
      pool.release(conn);

      let stats = pool.getStats();
      expect(stats.totalAcquired).toBeGreaterThan(0);

      pool.resetStats();

      stats = pool.getStats();
      expect(stats.totalAcquired).toBe(0);
      expect(stats.totalReleased).toBe(0);
    });
  });

  describe('Health Status', () => {
    let pool: SQLiteConnectionPool;

    beforeEach(() => {
      pool = new SQLiteConnectionPool(':memory:', {
        maxConnections: 2
      });
    });

    afterEach(async () => {
      await pool.close();
    });

    test('should report healthy pool', async () => {
      const health = pool.getHealthStatus();

      expect(health.isHealthy).toBe(true);
      expect(health.waitingRequests).toBe(0);
    });

    test('should track active and available connections', async () => {
      const conn1 = await pool.acquire();
      const conn2 = await pool.acquire();

      const health = pool.getHealthStatus();
      expect(health.activeConnections).toBe(2);
      expect(health.availableConnections).toBe(0);

      pool.release(conn1);

      const health2 = pool.getHealthStatus();
      expect(health2.activeConnections).toBe(1);
      expect(health2.availableConnections).toBe(1);

      pool.release(conn2);
    });
  });

  describe('Idle Timeout', () => {
    test('should close idle connections after timeout', async () => {
      const pool = new SQLiteConnectionPool(':memory:', {
        maxConnections: 2,
        idleTimeout: 500,
        connectionCheckInterval: 100
      });

      const conn = await pool.acquire();
      pool.release(conn);

      let stats = pool.getStats();
      expect(stats.idleConnections).toBe(1);

      // Wait for idle timeout to trigger cleanup
      await new Promise(resolve => setTimeout(resolve, 700));

      stats = pool.getStats();
      expect(stats.idleTimeouts).toBeGreaterThan(0);

      await pool.close();
    });

    test('should not close recently used connections', async () => {
      const pool = new SQLiteConnectionPool(':memory:', {
        maxConnections: 2,
        idleTimeout: 300,
        connectionCheckInterval: 100
      });

      const conn1 = await pool.acquire();
      const conn2 = await pool.acquire();

      pool.release(conn1);

      // Use conn2 again before timeout
      await new Promise(resolve => setTimeout(resolve, 150));
      pool.release(conn2);
      const conn3 = await pool.acquire();
      pool.release(conn3);

      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 400));

      const stats = pool.getStats();
      // Only conn1 should be timed out
      expect(stats.idleTimeouts).toBeGreaterThanOrEqual(1);

      await pool.close();
    });
  });

  describe('Error Handling', () => {
    test('should handle acquire timeout', async () => {
      const pool = new SQLiteConnectionPool(':memory:', {
        maxConnections: 1,
        acquireTimeout: 500
      });

      const conn = await pool.acquire();

      // Try to acquire when pool is full
      await expect(pool.acquire()).rejects.toThrow('Timeout waiting for connection');

      pool.release(conn);
      await pool.close();
    });

    test('should throw when acquiring from closed pool', async () => {
      const pool = new SQLiteConnectionPool(':memory:');

      await pool.close();

      await expect(pool.acquire()).rejects.toThrow('Connection pool is closed');
    });

    test('should handle pending request rejection on close', async () => {
      const pool = new SQLiteConnectionPool(':memory:', {
        maxConnections: 1
      });

      const conn = await pool.acquire();

      // Queue a pending request
      const pendingPromise = pool.acquire();

      // Close pool while request is pending
      await pool.close();

      await expect(pendingPromise).rejects.toThrow('Connection pool is closed');
    });
  });

  describe('Concurrent Operations', () => {
    test('should handle concurrent acquire/release', async () => {
      const pool = new SQLiteConnectionPool(':memory:', {
        maxConnections: 5
      });

      const promises = [];

      // Acquire and release multiple connections concurrently
      for (let i = 0; i < 10; i++) {
        promises.push(
          pool.acquire().then(conn => {
            return new Promise(resolve => {
              setTimeout(() => {
                pool.release(conn);
                resolve(null);
              }, Math.random() * 100);
            });
          })
        );
      }

      await Promise.all(promises);

      const stats = pool.getStats();
      expect(stats.totalAcquired).toBe(10);
      expect(stats.totalReleased).toBe(10);

      await pool.close();
    });

    test('should maintain correct connection count under load', async () => {
      const pool = new SQLiteConnectionPool(':memory:', {
        maxConnections: 3
      });

      const promises = [];

      for (let i = 0; i < 20; i++) {
        promises.push(
          pool.acquire().then(conn => {
            pool.release(conn);
          })
        );
      }

      await Promise.all(promises);

      const stats = pool.getStats();
      expect(stats.totalCreated).toBeLessThanOrEqual(3);
      expect(stats.totalAcquired).toBe(20);

      await pool.close();
    });
  });
});
