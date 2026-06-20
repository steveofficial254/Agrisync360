import API from './axios';
import { apiConfig } from './config';
import { mockGreenhouseAPI } from './mockApi';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.DEV;
const greenhouseApi = USE_MOCK ? mockGreenhouseAPI : API;

export const greenhouseAPI = {
  // Dashboard
  getDashboard: () => USE_MOCK ? greenhouseApi.getDashboard() : API.get('/greenhouse/dashboard'),

  // Greenhouse management
  getGreenhouses: () => USE_MOCK ? greenhouseApi.getGreenhouses() : API.get('/greenhouse'),
  createGreenhouse: (data) => USE_MOCK ? greenhouseApi.createGreenhouse(data) : API.post('/greenhouse/', data),
  updateGreenhouse: (id, data) => USE_MOCK ? greenhouseApi.updateGreenhouse(id, data) : API.put(`/greenhouse/${id}`, data),
  deleteGreenhouse: (id) => USE_MOCK ? greenhouseApi.deleteGreenhouse(id) : API.delete(`/greenhouse/${id}`),

  // Environmental controls
  getEnvironmentalData: (greenhouseId) => USE_MOCK ? greenhouseApi.getEnvironmentalData(greenhouseId) : API.get(`/greenhouse/${greenhouseId}/environment`),
  updateEnvironmentalControls: (greenhouseId, data) => USE_MOCK ? greenhouseApi.updateEnvironmentalControls(greenhouseId, data) : API.put(`/greenhouse/${greenhouseId}/environment`, data),

  // Crop management
  getCrops: (greenhouseId) => USE_MOCK ? greenhouseApi.getCrops(greenhouseId) : API.get(`/greenhouse/${greenhouseId}/crops`),
  addCrop: (greenhouseId, data) => USE_MOCK ? greenhouseApi.addCrop(greenhouseId, data) : API.post(`/greenhouse/${greenhouseId}/crops`, data),

  // Irrigation
  getIrrigationSchedule: (greenhouseId) => USE_MOCK ? greenhouseApi.getIrrigationSchedule(greenhouseId) : API.get(`/greenhouse/${greenhouseId}/irrigation`),
  updateIrrigationSchedule: (greenhouseId, data) => USE_MOCK ? greenhouseApi.updateIrrigationSchedule(greenhouseId, data) : API.put(`/greenhouse/${greenhouseId}/irrigation`, data),

  // Analytics
  getAnalytics: (params) => USE_MOCK ? greenhouseApi.getAnalytics(params) : API.get('/greenhouse/analytics', { params })
};
