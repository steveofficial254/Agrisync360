import API from './axios'
import { apiConfig } from './config'
import { mockAdvisoryAPI } from './mockApi'

const api = apiConfig.useMock ? mockAdvisoryAPI : API

export const advisoryAPI = {
  getCropAdvisory: (cropName, params) =>
    apiConfig.useMock 
      ? api.getAll({ crop: cropName, ...params })
      : API.get(`/advisory/crop/${cropName}`, { params }),

  getPlantingCalendar: (cropName, params) =>
    apiConfig.useMock 
      ? api.getCalendar(cropName)
      : API.get(`/advisory/calendar/${cropName}`, { params }),

  getMyCropsAdvisory: () =>
    apiConfig.useMock ? api.getMyCropsAdvisory() : API.get('/advisory/my-crops'),

  getNutritionAdvisory: (cropName, params) =>
    apiConfig.useMock 
      ? api.getAll({ crop: cropName, type: 'nutrition', ...params })
      : API.get(`/advisory/nutrition/${cropName}`, { params }),

  getNutrition: (cropName, params) =>
    apiConfig.useMock 
      ? api.getAll({ crop: cropName, type: 'nutrition', ...params })
      : API.get(`/advisory/nutrition/${cropName}`, { params }),

  getPestAdvisory: (cropName, params) =>
    apiConfig.useMock 
      ? api.getAll({ crop: cropName, type: 'pest', ...params })
      : API.get(`/advisory/pests/${cropName}`, { params }),

  getPests: (cropName, params) =>
    apiConfig.useMock 
      ? api.getAll({ crop: cropName, type: 'pest', ...params })
      : API.get(`/advisory/pests/${cropName}`, { params }),

  getHarvestAdvisory: (cropName, params) =>
    apiConfig.useMock 
      ? api.getAll({ crop: cropName, type: 'harvest', ...params })
      : API.get(`/advisory/crop/${cropName}`, { params: { ...params, advisory_type: 'harvest' } }),

  getHarvest: (cropName, params) =>
    apiConfig.useMock 
      ? api.getAll({ crop: cropName, type: 'harvest', ...params })
      : API.get(`/advisory/crop/${cropName}`, { params: { ...params, advisory_type: 'harvest' } }),

  getCalendar: (cropName, params) =>
    apiConfig.useMock 
      ? api.getCalendar(cropName)
      : API.get(`/advisory/calendar/${cropName}`, { params }),

  getAll: (params) =>
    apiConfig.useMock ? api.getAll(params) : API.get('/advisory/', { params }),
}
