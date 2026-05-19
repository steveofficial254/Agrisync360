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

  getPestAdvisory: (cropName, params) =>
    API.get(`/advisory/pests/${cropName}`, { params }),

  getHarvestAdvisory: (cropName, params) =>
    API.get(`/advisory/crop/${cropName}`, { 
      params: { ...params, advisory_type: 'harvest' } 
    }),

  getAll: (params) =>
    API.get('/advisory/', { params }),
}
