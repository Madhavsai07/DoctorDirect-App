import { Pool, QueryResult, QueryResultRow } from 'pg';
import config from '../config/env';

/**
 * PostgreSQL Connection Pool for DoctorDirect.
 *
 * Configured via DATABASE_URL environment variable.
 * Reuses connection pool across repositories and health checks.
 */
export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[DoctorDirect Database] Unexpected error on idle client:', err.message);
});

/**
 * Helper to execute parameterized SQL queries.
 */
export const query = async <T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> => {
  return pool.query<T>(text, params);
};

/**
 * Test database connectivity and measure latency.
 */
export const checkConnection = async (): Promise<{ ok: boolean; latencyMs?: number; error?: string }> => {
  if (!config.databaseUrl) {
    return { ok: false, error: 'DATABASE_URL is not configured' };
  }

  const start = Date.now();
  try {
    await pool.query('SELECT 1');
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database connection failed';
    return { ok: false, error: message };
  }
};

export default pool;
