// services/api.js - UPDATED WITH DEBUG LOGS
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
  // timeout: 10000
});

// Request interceptor to add auth token if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('API Request - Token exists:', !!token, 'URL:', config.url);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - FIXED
api.interceptors.response.use(
  (response) => {
    console.log('API Response success:', response.status, response.config.url);
    return response;
  },
  (error) => {
    const { status } = error.response || {};
    const url = error.config?.url || '';
    
    console.log('API Response error:', status, url, error.message);
    
    // Don't automatically redirect for auth/me endpoint
    if (status === 401 && url.includes('/auth/me')) {
      console.log('Auth check failed, letting AuthContext handle it');
      return Promise.reject(error);
    }
    
    // Handle other 401 errors
    if (status === 401) {
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath.includes('/login') || currentPath.includes('/register') || currentPath === '/';
      
      // Only redirect if we're not already on an auth page
      if (!isAuthPage) {
        console.log('Session expired, redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;