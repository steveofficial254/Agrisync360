import api from "./axios";

export const getFarmers = (params = {}) => api.get("/farmers", { params });
