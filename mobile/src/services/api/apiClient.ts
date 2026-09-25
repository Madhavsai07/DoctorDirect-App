import axios, { AxiosInstance } from 'axios';

/**
 * Central Axios API client for DoctorDirect.
 *
 * All outbound HTTP requests go through this instance so that the base URL,
 * request timeouts, and future auth-token interceptors live in one place.
 *
 * API Base URL Strategy
 * ─────────────────────
 * The base URL is read from the EXPO_PUBLIC_API_BASE_URL environment variable
 * at build time. Expo SDK 49+ inlines any variable prefixed with EXPO_PUBLIC_
 * directly into the bundle — no additional library needed.
 *
 * To configure for local development:
 *   1. Copy mobile/.env.example → mobile/.env
 *   2. Set EXPO_PUBLIC_API_BASE_URL=http://<your-LAN-IP>:5001/api/v1
 *      (Use your machine's LAN IP when testing on a physical device.
 *       localhost works only on an emulator.)
 *
 * The fallback value below is for emulator/simulator development only.
 */
const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5001/api/v1';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

import { authService } from '../auth';

/**
 * Request interceptor: attaches active auth credentials / dev bypass headers.
 */
apiClient.interceptors.request.use(
  async (reqConfig) => {
    const user = await authService.getCurrentUser();
    if (user) {
      reqConfig.headers['x-dev-user-id'] = user.id;
      reqConfig.headers['x-dev-role'] = user.role;
      reqConfig.headers['x-dev-bypass'] = 'true';
    }
    return reqConfig;
  },
  (error) => Promise.reject(error),
);

/**
 * Response interceptor placeholder.
 * Global error handling (401 refresh, network errors) will be added later.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);

export default apiClient;
