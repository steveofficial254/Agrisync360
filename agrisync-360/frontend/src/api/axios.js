import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000",
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        try {
          const res = await axios.post((import.meta.env.VITE_API_BASE_URL || "/api") + "/auth/refresh", {}, { headers: { Authorization: `Bearer ${refresh}` } });
          localStorage.setItem("access_token", res.data.data.access_token);
          original.headers.Authorization = `Bearer ${res.data.data.access_token}`;
          return api(original);
        } catch {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject({
      success: false,
      message: error.response?.data?.message || "Request failed",
      error: error.response?.data?.error || error.message,
      status: error.response?.status,
    });
  }
);

export default api;
