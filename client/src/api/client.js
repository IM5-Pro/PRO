import axios from 'axios';
import { showToast } from '../utils/toast';

const PUNCH_COOKIES = ['isPunchedIn', 'punchInTime', 'hasPunchedInToday', 'punchDayKey', 'dailyWorkingHours'];
const AUTH_EXEMPT_401_PATHS = [
  '/auth/login',
  '/auth/register-superadmin',
  '/auth/forgot-username',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/complete-initial-password',
  '/auth/refresh-token',
];

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:7888/api';

const clearPunchCookies = () => {
  PUNCH_COOKIES.forEach((name) => {
    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Strict`;
  });
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
  baseURL: API_BASE,
  withCredentials: true,
});

const TOAST_ENABLED_METHODS = new Set(['post', 'put', 'patch', 'delete']);

const isToastEligibleRequest = (config = {}) => {
  const method = String(config.method || '').toLowerCase();
  if (!TOAST_ENABLED_METHODS.has(method)) {
    return false;
  }

  if (config.skipGlobalToast) {
    return false;
  }

  const requestUrl = String(config.url || '');
  if (isAuthExemptRequest(requestUrl)) {
    return false;
  }

  return true;
};

const getSuccessToastMessage = (response) => {
  const responseMessage = response?.data?.message || response?.data?.data?.message;
  if (responseMessage) {
    return responseMessage;
  }

  const method = String(response?.config?.method || '').toLowerCase();
  if (method === 'delete') {
    return 'Deleted successfully';
  }

  if (method === 'post') {
    return 'Created successfully';
  }

  return 'Updated successfully';
};

const getErrorToastMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    'Unable to save changes'
  );
};

let refreshPromise = null;

const refreshSession = async () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE}/auth/refresh-token`, {}, { withCredentials: true })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

API.interceptors.response.use(
  (response) => {
    if (isToastEligibleRequest(response?.config)) {
      showToast(getSuccessToastMessage(response), 'success');
    }
    return response;
  },
  async (error) => {
    const status = error?.response?.status;
    const requestUrl = error?.config?.url || '';
    const isAuthExempt = isAuthExemptRequest(requestUrl);
    const originalConfig = error?.config;

    if (status === 401 && !isAuthExempt && originalConfig && !originalConfig._retry) {
      originalConfig._retry = true;

      try {
        await refreshSession();
        return API(originalConfig);
      } catch (_refreshError) {
        clearPunchCookies();
        if (
          !originalConfig.skipAuthRedirect &&
          !window.location.pathname.startsWith('/login')
        ) {
          redirectToLoginWithCurrentPath();
        }
      }
    }

    if (isToastEligibleRequest(originalConfig)) {
      showToast(getErrorToastMessage(error), 'error');
    }

    return Promise.reject(error);
  },
);

export default API;
