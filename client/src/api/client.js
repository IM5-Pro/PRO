import axios from 'axios';
import { getCookie, setCookie, removeCookie } from '../utils/cookies';

const AUTH_COOKIE = 'authToken';
const REFRESH_COOKIE = 'refreshToken';
const USER_COOKIE = 'user';
const PUNCH_COOKIES = ['isPunchedIn', 'punchInTime', 'hasPunchedInToday', 'punchDayKey', 'dailyWorkingHours'];
const AUTH_EXEMPT_401_PATHS = [
  '/auth/login',
  '/auth/register-superadmin',
  '/auth/forgot-username',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/complete-initial-password',
];

const clearSessionCookies = () => {
  removeCookie(AUTH_COOKIE);
  removeCookie(REFRESH_COOKIE);
  removeCookie(USER_COOKIE);
  PUNCH_COOKIES.forEach((name) => removeCookie(name));
};

const redirectToLoginWithCurrentPath = () => {
  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const redirect = encodeURIComponent(currentPath || '/');
  window.location.replace(`/login?redirect=${redirect}`);
};

const isAuthExemptRequest = (url = '') => {
  const normalizedUrl = String(url || '');
  return AUTH_EXEMPT_401_PATHS.some((path) => normalizedUrl.includes(path));
};

const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:7888/api',
});

API.interceptors.request.use(
  (config) => {
    const token = getCookie(AUTH_COOKIE);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const requestUrl = error?.config?.url || '';
    const isAuthExempt = isAuthExemptRequest(requestUrl);

    // 403 can be a valid permission denial for logged-in users.
    // Any non-auth 401 means the user session is no longer valid.
    if (status === 401 && !isAuthExempt) {
      const refreshToken = getCookie(REFRESH_COOKIE);
      if (refreshToken && !requestUrl.includes('/refresh-token')) {
        try {
          const refreshResponse = await axios.post(
            `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:7888/api'}/auth/refresh-token`,
            { refreshToken }
          );

          const refreshed = refreshResponse?.data?.data;
          if (refreshed?.accessToken) {
            setCookie(AUTH_COOKIE, refreshed.accessToken, 8 * 60 * 60); // 8h as in AuthContext
            if (refreshed?.refreshToken) {
              setCookie(REFRESH_COOKIE, refreshed.refreshToken, 7 * 24 * 60 * 60);
            }
            // retry original request with new access token
            const originalConfig = error.config;
            originalConfig.headers = originalConfig.headers || {};
            originalConfig.headers.Authorization = `Bearer ${refreshed.accessToken}`;
            return axios(originalConfig);
          }
        } catch (refreshError) {
          // refresh failed, continue to logout below
        }
      }

      clearSessionCookies();
      if (!window.location.pathname.startsWith('/login')) {
        redirectToLoginWithCurrentPath();
      }
    }

    return Promise.reject(error);
  }
);

export default API;
