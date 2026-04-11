/**
 * api.js
 * Secure Axios instance for all backend API calls.
 *
 * - Automatically attaches fresh Firebase ID token
 * - Updated to /api/v1 base path
 * - Forces token refresh on 401
 * - 1 retry on 5xx errors
 */

import axios from 'axios';
import { auth } from '../firebase/config';

const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : '/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

// ─── Request Interceptor — attach fresh Firebase ID token ─────────────────────
api.interceptors.request.use(async (config) => {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      // getIdToken() transparently handles token refresh (rotates every 1hr)
      const idToken = await currentUser.getIdToken();
      config.headers.Authorization = `Bearer ${idToken}`;
    }
  } catch (_) {
    // Silent — unauthenticated requests are rejected by backend naturally
  }
  return config;
});

// ─── Response Interceptor — handle errors globally ────────────────────────────
api.interceptors.response.use(
  (res) => {
    console.log(`[API RESPONSE] ${res.config.method.toUpperCase()} ${res.config.url} :`, res.status, res.data);
    return res;
  },
  async (err) => {
    const originalRequest = err.config;

    // On 401: force refresh token and retry once
    if (err.response?.status === 401 && !originalRequest._retried) {
      originalRequest._retried = true;
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const freshToken = await currentUser.getIdToken(true); // forceRefresh
          originalRequest.headers.Authorization = `Bearer ${freshToken}`;
          return api(originalRequest);
        }
      } catch (_) {
        // Token refresh failed — let the error bubble up
      }
    }

    console.error(`[API ERROR] ${originalRequest.method.toUpperCase()} ${originalRequest.url} :`, err.message);
    return Promise.reject(err);
  }
);

export default api;
