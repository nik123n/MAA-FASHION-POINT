import axios from 'axios';
import { auth } from '../firebase/config';

// In production (GitHub Pages), VITE_API_URL must be set to your Render/Railway backend URL.
// In development, Vite proxy handles /api → localhost:5000.
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach fresh Firebase ID Token to every request automatically.
// Firebase rotates tokens every hour; getIdToken() handles refresh transparently.
api.interceptors.request.use(async (config) => {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const idToken = await currentUser.getIdToken();
      config.headers.Authorization = `Bearer ${idToken}`;
    }
  } catch (_) {
    // Silent fail — unauthenticated requests will be rejected by backend naturally
  }
  return config;
});

// Global response error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Firebase will sign the user out if their session is truly invalid
      // We don't force redirect here — let AuthContext/route guards handle it
    }
    return Promise.reject(err);
  }
);

export default api;
