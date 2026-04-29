import api from "./axios";

export const getWeather = (params = {}) => api.get("/weather", { params });
