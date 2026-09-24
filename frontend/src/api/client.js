import axios from 'axios';
import { useAuth } from '../stores/auth.js';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4101/api/v1';

export { API_BASE };

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const { accessToken } = useAuth.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  config.retryCount = config.retryCount ?? 0;
  if (config.params) {
    const cleaned = Object.fromEntries(
      Object.entries(config.params).filter(([, v]) => v !== '' && v !== undefined && v !== null)
    );
    config.params = cleaned;
  }
  return config;
});

const MAX_RETRIES = 2;
const isRetryable = (method, error) => {
  if (!['GET', 'HEAD'].includes(method)) return false;
  const status = error?.response?.status;
  return !error.response || status === 502 || status === 503 || status === 504;
};
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Single-flight refresh: parallel 401s share one refresh call instead of stampeding /auth/refresh.
let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (original && isRetryable(original.method?.toUpperCase(), error) && (original.retryCount ?? 0) < MAX_RETRIES) {
      original.retryCount = (original.retryCount ?? 0) + 1;
      await delay(400 * original.retryCount);
      return api(original);
    }
    if (error.response?.status === 401 && !original?._retry) {
      original._retry = true;
      const { refreshToken } = useAuth.getState();
      if (refreshToken) {
        try {
          if (!refreshPromise) {
            refreshPromise = axios
              .post(`${API_BASE}/auth/refresh`, { refreshToken: useAuth.getState().refreshToken })
              .then((res) => res.data)
              .finally(() => {
                refreshPromise = null;
              });
          }
          const newToken = await refreshPromise;
          useAuth.getState().setTokens(newToken);
          original.headers.Authorization = `Bearer ${newToken.accessToken}`;
          return api(original);
        } catch (e) {
          const status = e?.response?.status;
          if (status === 401 || status === 400 || status === 403) {
            useAuth.getState().logout();
            window.location.href = '/';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);