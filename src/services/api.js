import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach Bearer JWT token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let refreshPromise = null;

// Response Interceptor: Normalize responses and handle token expiration
api.interceptors.response.use(
  (response) => {
    // Return standard ApiResponse envelope payload
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 429 Too Many Requests (Rate Limiting)
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers?.['retry-after'] || error.response.headers?.['Retry-After'];
      const serverMsg = error.response?.data?.message;
      const friendlyMsg = serverMsg || (retryAfter 
        ? `Too many requests. Please wait ${retryAfter} seconds before trying again.` 
        : 'Too many requests. Please slow down.');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app:toast', {
          detail: { type: 'error', message: friendlyMsg, duration: 5000 }
        }));
      }

      return Promise.reject({
        status: 429,
        retryAfter: retryAfter ? parseInt(retryAfter, 10) : 60,
        message: friendlyMsg,
        data: error.response?.data,
      });
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          if (!isRefreshing) {
            isRefreshing = true;
            refreshPromise = axios
              .post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken })
              .then((res) => {
                const envelope = res.data;
                const data = envelope?.data || envelope;
                const { accessToken, refreshToken: newRefreshToken } = data;
                localStorage.setItem('access_token', accessToken);
                if (newRefreshToken) {
                  localStorage.setItem('refresh_token', newRefreshToken);
                }
                return accessToken;
              })
              .finally(() => {
                isRefreshing = false;
                refreshPromise = null;
              });
          }

          const newAccessToken = await refreshPromise;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed - purge session and redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('auth:logout'));
          }
          return Promise.reject(refreshError);
        }
      } else {
        localStorage.removeItem('access_token');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth:logout'));
        }
      }
    }

    const errorMessage =
      error.response?.data?.message ||
      (error.response?.data?.errors && error.response.data.errors.join(', ')) ||
      error.message ||
      'An unexpected network error occurred';

    return Promise.reject({
      status: error.response?.status,
      message: errorMessage,
      data: error.response?.data,
    });
  }
);

export default api;
