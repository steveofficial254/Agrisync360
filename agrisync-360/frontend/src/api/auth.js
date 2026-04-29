import api from "./axios";

export const getAuth = (params = {}) => api.get("/auth", { params });
