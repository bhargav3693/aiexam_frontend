import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || ''}/api`.replace(/([^:]\/)\/+/g, "$1"),
});

// ─── Helpers ────────────────────────────────────────────────────────────────
const STORAGE_KEYS = ['access', 'refresh', 'user'];

function hardLogout() {
  console.warn('[Auth] Hard logout triggered — clearing tokens and redirecting to /login');
  STORAGE_KEYS.forEach(k => localStorage.removeItem(k));
  // Only redirect if not already on /login to avoid loops
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
  }
}

// ─── Request Interceptor ─────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  // CRITICAL: Bypasses the Localtunnel warning page
  config.headers['Bypass-Tunnel-Reminder'] = 'true';
  const token = localStorage.getItem('access');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response Interceptor ────────────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config || {};

    // ── Case 1: If the refresh endpoint itself failed (any status) → hard logout ──
    if (original.url && original.url.includes('/auth/refresh/')) {
      console.error('[Auth] Refresh endpoint failed:', err.response?.status, err.message);
      hardLogout();
      return new Promise(() => {}); // Freeze — never resolve/reject, redirect is happening
    }

    // ── Case 2: Any other request got a 401 → try to refresh once ──
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem('refresh');
        if (!refresh) {
          throw new Error('No refresh token in storage');
        }

        const refreshUrl = `${api.defaults.baseURL}/auth/refresh/`.replace(/([^:]\/)\/+/g, "$1");
        const { data } = await axios.post(refreshUrl, { refresh });

        localStorage.setItem('access', data.access);
        if (original.headers) {
          original.headers.Authorization = `Bearer ${data.access}`;
        }
        return api(original); // Retry the original request with new token

      } catch (refreshErr) {
        // Refresh failed (any reason: 401, 500, network error, user deleted)
        console.error('[Auth] Token refresh failed:', refreshErr.response?.status || refreshErr.message);
        hardLogout();
        return new Promise(() => {}); // Freeze — redirect is happening
      }
    }

    // ── Case 3: All other errors pass through normally ──
    return Promise.reject(err);
  }
);

export default api;
