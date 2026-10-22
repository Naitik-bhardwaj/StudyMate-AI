import axios from "axios";

const configuredUrl = import.meta.env.VITE_API_URL?.trim();
const baseURL = configuredUrl
  ? (configuredUrl.endsWith("/api") ? configuredUrl : `${configuredUrl.replace(/\/$/, "")}/api`)
  : "/api";

const api = axios.create({
  baseURL,
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const getApiErrorMessage = (error, fallback = "Something went wrong. Please try again.") => {
  if (error?.code === "ECONNABORTED") return "The request took too long. Check that the backend and AI service are running.";
  if (!error?.response) return "Cannot reach the backend. Make sure the backend is running on port 5000.";
  return error.response.data?.message || fallback;
};

export default api;
