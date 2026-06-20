import API from './axios'
import { apiConfig } from './config'
import { mockFarmersAPI } from './mockApi'

// Use mock API if configured, otherwise use real API
const api = apiConfig.useMock ? mockFarmersAPI : API

export const farmersAPI = {
  // Profile endpoints
  getProfile: () =>
    apiConfig.useMock ? api.getProfile() : API.get('/farmers/profile'),

  createProfile: (data) =>
    apiConfig.useMock ? api.createProfile(data) : API.post('/farmers/profile', data),

  updateProfile: (data) =>
    apiConfig.useMock ? api.updateProfile(data) : API.put('/farmers/profile', data),

  // Farm endpoints
  listFarms: () =>
    apiConfig.useMock ? api.listFarms() : API.get('/farms/'),

  createFarm: (data) =>
    apiConfig.useMock ? api.createFarm(data) : API.post('/farms/', data),

  getFarm: (farmId) =>
    apiConfig.useMock ? api.getFarm?.(farmId) : API.get(`/farms/${farmId}`),

  updateFarm: (farmId, data) =>
    apiConfig.useMock ? api.updateFarm(farmId, data) : API.put(`/farms/${farmId}`, data),

  deleteFarm: (farmId) =>
    apiConfig.useMock ? api.deleteFarm(farmId) : API.delete(`/farms/${farmId}`),

  setPrimaryFarm: (farmId) =>
    apiConfig.useMock ? Promise.resolve({ data: { success: true } }) : API.post(`/farms/${farmId}/set-primary`),

  // Crop endpoints
  listCrops: (farmId) =>
    apiConfig.useMock ? api.listCrops(farmId) : API.get(`/farms/${farmId}/crops`),

  addCrop: (farmId, data) =>
    apiConfig.useMock ? api.createCrop(farmId, data) : API.post(`/farms/${farmId}/crops`, data),

  updateCrop: (farmId, cropId, data) =>
    apiConfig.useMock ? api.updateCrop(cropId, data) : API.put(`/farms/${farmId}/crops/${cropId}`, data),

  deleteCrop: (farmId, cropId) =>
    apiConfig.useMock ? api.deleteCrop(cropId) : API.delete(`/farms/${farmId}/crops/${cropId}`),
}
