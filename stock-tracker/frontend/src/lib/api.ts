import axios, { type AxiosRequestConfig } from 'axios';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, 
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

interface RetryableConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

const NO_REFRESH_RETRY_PATHS = [
  '/auth/login',
  '/auth/signup',
  '/auth/google',
  '/auth/refresh',
  '/auth/logout',
  '/auth/forgot-password',
  '/auth/reset-password',
];

const AUTH_SCREENS = ['/login', '/signup', '/forgot-password', '/reset-password'];

let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = (): Promise<string | null> => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true })
      .then((res) => {
        const newToken: string | null = res.data?.token ?? null;
        setAccessToken(newToken);
        return newToken;
      })
      .catch(() => {
        setAccessToken(null);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config as RetryableConfig | undefined;

    const isAuthRequest = NO_REFRESH_RETRY_PATHS.some((path) =>
      originalRequest?.url?.includes(path),
    );

    if (
      error.response?.status === 401 &&
      !isAuthRequest &&
      originalRequest &&
      !originalRequest._retry &&
      typeof window !== 'undefined'
    ) {
      originalRequest._retry = true;

      const newToken = await refreshAccessToken();
      if (newToken) {
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${newToken}`,
        };
        return api(originalRequest);
      }

      const onAuthScreen = AUTH_SCREENS.some((path) =>
        window.location.pathname.startsWith(path),
      );
      if (!onAuthScreen) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

export default api;
