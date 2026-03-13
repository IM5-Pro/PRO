import axios from 'axios';
import { getCookie } from '../utils/cookies';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:7888/api',
});

API.interceptors.request.use(
  (config) => {
    const token = getCookie('authToken') || localStorage.getItem('authToken') || localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default API;
