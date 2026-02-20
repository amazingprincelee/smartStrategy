import axios from "axios";

export const authAPI = axios.create({
  baseURL: import.meta.env.VITE_LOCAL_API_URL || import.meta.env.VITE_API_URL
});

// Add request interceptor to automatically include token in headers
authAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);