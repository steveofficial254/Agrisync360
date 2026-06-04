import API from './axios'

export const advisoryAPI = {
  getCropAdvisory: (cropName, params) =>
    API.get(`/advisory/crop/${cropName}`, { params }),

  getPlantingCalendar: (cropName, params) =>
    API.get(`/advisory/calendar/${cropName}`, { params }),

  getMyCropsAdvisory: () =>
    API.get('/advisory/my-crops'),

  getNutritionAdvisory: (cropName, params) =>
    API.get(`/advisory/nutrition/${cropName}`, { params }),

  getNutrition: (cropName, params) =>
    API.get(`/advisory/nutrition/${cropName}`, { params }),

  getPestAdvisory: (cropName, params) =>
    API.get(`/advisory/pests/${cropName}`, { params }),

  getPests: (cropName, params) =>
    API.get(`/advisory/pests/${cropName}`, { params }),

  getHarvestAdvisory: (cropName, params) =>
    API.get(`/advisory/crop/${cropName}`, { 
      params: { ...params, advisory_type: 'harvest' } 
    }),

  getHarvest: (cropName, params) =>
    API.get(`/advisory/crop/${cropName}`, { 
      params: { ...params, advisory_type: 'harvest' } 
    }),

  getCalendar: (cropName, params) =>
    API.get(`/advisory/calendar/${cropName}`, { params }),

  getAll: (params) =>
    API.get('/advisory/', { params }),
}
