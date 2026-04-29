import api from "./axios";

export const getMarket = (params = {}) => api.get("/market", { params });
