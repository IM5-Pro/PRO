import axios from 'axios';
import { getCookie, removeCookie } from '../utils/cookies';

const AUTH_COOKIE = 'authToken';
const REFRESH_COOKIE = 'refreshToken';
const USER_COOKIE = 'user';
const PUNCH_COOKIES = ['isPunchedIn', 'punchInTime', 'hasPunchedInToday', 'dailyWorkingHours'];

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
  (error) => {
    const status = error?.response?.status;
    const hasAuthHeader = Boolean(error?.config?.headers?.Authorization);

    // 403 can be a valid permission denial for logged-in users.
    // Only 401 should force logout + redirect.
    if (status === 401 && hasAuthHeader) {
      clearSessionCookies();
      if (!window.location.pathname.startsWith('/login')) {
        redirectToLoginWithCurrentPath();
      }
    }

    return Promise.reject(error);
  }
);

export default API;
