import api from "./axios";

export const getAdvisory = (params = {}) => api.get("/advisory", { params });
