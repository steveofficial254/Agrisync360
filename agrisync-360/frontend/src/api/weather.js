import API from './axios'
import { apiConfig } from './config'
import { mockWeatherAPI } from './mockApi'

const api = apiConfig.useMock ? mockWeatherAPI : API

export const weatherAPI = {
  getCurrentWeather: (lat, lon) =>
    apiConfig.useMock 
      ? api.getForecast(lat, lon).then(r => ({ data: { data: r.data.data.current } }))
      : API.get('/weather/current', { params: { lat, lon } }),

  getForecast: (lat, lon) =>
    apiConfig.useMock ? api.getForecast(lat, lon) : API.get('/weather/forecast', { params: { lat, lon } }),

  getPlantingWindow: (lat, lon, crop) =>
    apiConfig.useMock 
      ? Promise.resolve({ data: { data: { optimal: true, start_date: '2024-04-15', end_date: '2024-08-15' } } })
      : API.get('/weather/planting-window', { params: { lat, lon, crop } }),

  getDiseaseRisk: (lat, lon, crop) =>
    apiConfig.useMock 
      ? api.getForecast(lat, lon).then(r => ({ data: { data: r.data.data.summary } }))
      : API.get('/weather/disease-risk', { params: { lat, lon, crop } }),

  getSeasonal: (county, season) =>
    apiConfig.useMock 
      ? Promise.resolve({ data: { data: { forecast: 'Above average rainfall expected' } } })
      : API.get('/weather/seasonal', { params: { county, season } }),

  getHistorical: (lat, lon, crop) =>
    apiConfig.useMock 
      ? Promise.resolve({ data: { data: { historical_data: [] } } })
      : API.get('/weather/historical', { params: { lat, lon, crop } }),
}
