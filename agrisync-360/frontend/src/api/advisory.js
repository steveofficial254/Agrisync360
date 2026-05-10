import api from "./axios";

export const advisoryAPI = {
  // General advisories
  getAll: (params = {}) => api.get("/advisory", { params }),
  getCropAdvisory: (crop, params = {}) => api.get(`/advisory/crop/${crop}`, { params }),
  getNutritionAdvisory: (crop, params = {}) => api.get(`/advisory/nutrition/${crop}`, { params }),
  getPestAdvisory: (crop, params = {}) => api.get(`/advisory/pest/${crop}`, { params }),
  getHarvestAdvisory: (crop, params = {}) => api.get(`/advisory/harvest/${crop}`, { params }),
  
  // Planting calendar
  getPlantingCalendar: (crop, params = {}) => api.get(`/advisory/calendar/${crop}`, { params }),
  
  // My crops advisories
  getMyCropsAdvisory: () => api.get("/advisory/my-crops"),
  
  // Search
  search: (query, params = {}) => api.get("/advisory/search", { 
    params: { q: query, ...params } 
  }),
};

// Legacy export for backward compatibility
export const getAdvisory = (params = {}) => api.get("/advisory", { params });

export default advisoryAPI;
