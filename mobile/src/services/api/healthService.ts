import apiClient from './apiClient';

/**
 * Health check — confirms the mobile app can reach the Express backend.
 *
 * Used for development verification only.
 * Returns true if the backend responds with { status: 'ok' }.
 */
export async function checkBackendHealth(): Promise<boolean> {
  const response = await apiClient.get<{ status: string }>('/health');
  return response.data.status === 'ok';
}
