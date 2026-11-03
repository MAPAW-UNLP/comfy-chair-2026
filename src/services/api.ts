import axios from 'axios';

// ✅ MIN: baseURL robusto con fallback y normalización
const rawBase = import.meta.env.VITE_API_BASE as string | undefined;
let baseURL =
  (rawBase && rawBase.trim()) ||
  (() => {
    const proto = window.location.protocol === 'https:' ? 'https' : 'http';
    const host = window.location.hostname || 'localhost';
    const port = '8000';
    return `${proto}://${host}${port ? `:${port}` : ''}`;
  })();


  
// sin barra final
baseURL = baseURL.replace(/\/+$/, '');

export const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Navigation callback for handling unauthorized access
let navigateToLogin: (accountDisabled: boolean) => void = () => {};

export const setNavigateToLogin = (callback: (accountDisabled: boolean) => void) => {
  navigateToLogin = callback;
};



// Add request interceptor to attach JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');

      // Use TanStack Router navigation if available
      navigateToLogin(error.response?.data?.code === 'account_disabled');
    }
    return Promise.reject(error);
  }
);

//axiosInstance.interceptors.request.use((config) => {
//  const token = localStorage.getItem("access");
//  if (token) {
//    config.headers.Authorization = `Bearer ${token}`;
//  }
//  return config;
//});

export default axiosInstance;
