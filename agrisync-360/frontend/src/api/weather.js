import API from './axios'

export const weatherAPI = {
  getCurrentWeather: (lat, lon) =>
    API.get('/weather/current', {
      params: { lat, lon }
    }),

  getForecast: (lat, lon) =>
    API.get('/weather/forecast', {
      params: { lat, lon }
    }),

  getPlantingWindow: (lat, lon, crop) =>
    API.get('/weather/planting-window', {
      params: { lat, lon, crop }
    }),

  getDiseaseRisk: (lat, lon, crop) =>
    API.get('/weather/disease-risk', {
      params: { lat, lon, crop }
    }),

  getSeasonal: (county, season) =>
    API.get('/weather/seasonal', {
      params: { county, season }
    }),

  getHistorical: (lat, lon, crop) =>
    API.get('/weather/historical', {
      params: { lat, lon, crop }
    }),
}
