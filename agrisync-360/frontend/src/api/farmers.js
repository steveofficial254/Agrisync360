import API from './axios'

export const farmersAPI = {
  // Profile endpoints
  getProfile: () =>
    API.get('/farmers/profile'),

  createProfile: (data) =>
    API.post('/farmers/profile', data),

  updateProfile: (data) =>
    API.put('/farmers/profile', data),

  // Farm endpoints
  listFarms: () =>
    API.get('/farms/'),

  createFarm: (data) =>
    API.post('/farms/', data),

  getFarm: (farmId) =>
    API.get(`/farms/${farmId}`),

  updateFarm: (farmId, data) =>
    API.put(`/farms/${farmId}`, data),

  deleteFarm: (farmId) =>
    API.delete(`/farms/${farmId}`),

  setPrimaryFarm: (farmId) =>
    API.post(`/farms/${farmId}/set-primary`),

  // Crop endpoints
  listCrops: (farmId) =>
    API.get(`/farms/${farmId}/crops`),

  addCrop: (farmId, data) =>
    API.post(`/farms/${farmId}/crops`, data),

  updateCrop: (farmId, cropId, data) =>
    API.put(`/farms/${farmId}/crops/${cropId}`, data),

  deleteCrop: (farmId, cropId) =>
    API.delete(`/farms/${farmId}/crops/${cropId}`),
}
