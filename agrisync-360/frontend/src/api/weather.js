import api from "./axios";

export const weatherAPI = {
  getForecast: (lat, lon) => api.get("/weather/forecast", { params: { lat, lon } }),
  getPlantingWindow: (lat, lon) => api.get("/weather/planting-window", { params: { lat, lon } }),
  getDiseaseRisk: (lat, lon) => api.get("/weather/disease-risk", { params: { lat, lon } }),
  getSeasonal: (lat, lon) => api.get("/weather/seasonal", { params: { lat, lon } }),
  getHistorical: (lat, lon, months = 3) => api.get("/weather/historical", { 
    params: { lat, lon, months } 
  }),
};

export default weatherAPI;
