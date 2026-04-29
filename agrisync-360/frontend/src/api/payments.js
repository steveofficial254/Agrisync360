import api from "./axios";

export const getPayments = (params = {}) => api.get("/payments", { params });
