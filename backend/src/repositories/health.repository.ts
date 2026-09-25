import { pool } from '../db/pool';

export interface DatabaseHealthResult {
  connected: boolean;
  latencyMs?: number;
  serverTime?: Date;
  error?: string;
}

export class HealthRepository {
  async pingDatabase(): Promise<DatabaseHealthResult> {
    const start = Date.now();
    try {
      const result = await pool.query<{ ok: number; server_time: Date }>(
        'SELECT 1 AS ok, NOW() AS server_time'
      );
      const latencyMs = Date.now() - start;
      const serverTime = result.rows[0]?.server_time;

      return {
        connected: true,
        latencyMs,
        serverTime,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Database ping failed';
      return {
        connected: false,
        error: message,
      };
    }
  }
}

export const healthRepository = new HealthRepository();
