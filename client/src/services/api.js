// services/api.js - Production ready with token auto-refresh
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : (import.meta.env.PROD 
      ? 'https://the-quality-pulse.onrender.com/api' 
      : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Sends the HttpOnly refreshToken cookie automatically
});

// ─── Request Interceptor: Attach Access Token ────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: Silently Refresh 15-min Access Token ──────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const url = originalRequest?.url || '';

    // Skip refresh logic for auth endpoints to prevent loops
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh-token');

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // Queue up requests waiting for the new token
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Silent token refresh using the HttpOnly cookie
        const { data } = await axios.post(`${BASE_URL}/auth/refresh-token`, {}, { withCredentials: true });
        const newToken = data.token;
        localStorage.setItem('token', newToken);
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Refresh token itself is invalid — log the user out
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        const isAuthPage = ['/login', '/register', '/'].includes(window.location.pathname);
        if (!isAuthPage) window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;