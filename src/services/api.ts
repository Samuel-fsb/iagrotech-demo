// ============================================
// API Client — Axios Instance
// ============================================

import axios from 'axios';
import { DEMO_MODE } from '../config/demo';

/**
 * Legacy API client retained for the original backend integration.
 * In this portfolio build DEMO_MODE is enabled and requests are blocked below.
 */
const API_URL = import.meta.env.VITE_API_URL || '/api';

if (!DEMO_MODE && import.meta.env.PROD && API_URL === '/api') {
  console.warn(
    '[api] VITE_API_URL is not set. API calls will use the relative path /api, ' +
    'which will only work if the frontend and backend are served from the same domain. ' +
    'Set VITE_API_URL in the Vercel project environment variables.'
  );
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Fail closed in the portfolio build: accidental API calls must never leave the browser.
if (DEMO_MODE) {
  api.interceptors.request.use(() => {
    return Promise.reject(new Error('A API está desativada no modo demonstração do IAgroTech.'));
  });
}

// === Request Interceptor — Add Auth Token ===
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// === Response Interceptor — Handle Errors ===
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      // Only redirect if we're not already on the login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
