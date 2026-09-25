import { healthRepository, DatabaseHealthResult } from '../repositories/health.repository';

export interface HealthCheckResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
  uptimeSeconds: number;
  database: {
    status: 'connected' | 'disconnected';
    latencyMs?: number;
  };
}

export class HealthService {
  async getHealthStatus(): Promise<{ statusCode: number; data: HealthCheckResponse }> {
    const dbHealth: DatabaseHealthResult = await healthRepository.pingDatabase();

    const isDbConnected = dbHealth.connected;
    const response: HealthCheckResponse = {
      status: isDbConnected ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        status: isDbConnected ? 'connected' : 'disconnected',
        ...(isDbConnected && dbHealth.latencyMs !== undefined ? { latencyMs: dbHealth.latencyMs } : {}),
      },
    };

    // Return 200 when healthy, 503 Service Unavailable when DB is down
    const statusCode = isDbConnected ? 200 : 503;

    return { statusCode, data: response };
  }
}

export const healthService = new HealthService();
