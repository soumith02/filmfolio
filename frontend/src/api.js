import axios from "axios";

// The base URL of our backend
const API_BASE = "http://127.0.0.1:8000";

// Create an axios instance
const api = axios.create({
    baseURL: "https://filmfolio-production.up.railway.app",
});

// Automatically attach the JWT token to every request if we have one
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;