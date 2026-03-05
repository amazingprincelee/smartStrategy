import axios from "axios";

export const authAPI = axios.create({
   baseURL: import.meta.env.VITE_API_URL        // production
 //  baseURL: import.meta.env.VITE_LOCAL_API_URL    // local dev
});

// Request interceptor — attach Bearer token from localStorage
authAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle expired / invalid tokens (401)
authAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is expired, revoked, or user deleted — clear the stale session
      const hadToken = !!localStorage.getItem("token");
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user");

      // Only redirect to login if we actually had a token (avoid redirect loops
      // on pages that legitimately call protected endpoints when unauthenticated)
      if (hadToken && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);