import api from "./axios";

export const farmersAPI = {
  // Profile endpoints
  getProfile: () => api.get("/farmers/profile"),
  createProfile: (data) => api.post("/farmers/profile", data),
  updateProfile: (data) => api.put("/farmers/profile", data),

  // Farm endpoints
  listFarms: () => api.get("/farms/"),
  createFarm: (data) => api.post("/farms/", data),
  getFarm: (farmId) => api.get(`/farms/${farmId}`),
  updateFarm: (farmId, data) => api.put(`/farms/${farmId}`, data),
  deleteFarm: (farmId) => api.delete(`/farms/${farmId}`),
  setPrimaryFarm: (farmId) => api.post(`/farms/${farmId}/set-primary`),

  // Crop endpoints
  listCrops: (farmId) => api.get(`/farms/${farmId}/crops`),
  addCrop: (farmId, data) => api.post(`/farms/${farmId}/crops`, data),
  updateCrop: (farmId, cropId, data) => api.put(`/farms/${farmId}/crops/${cropId}`, data),
  deleteCrop: (farmId, cropId) => api.delete(`/farms/${farmId}/crops/${cropId}`),
  
  // SMS & Alert System APIs
  alerts: {
    // Get farmer's alert history
    getHistory: (params) => api.get('/alerts/farmer/history', { params }),
    
    // Get alert by ID
    getById: (id) => api.get(`/alerts/farmer/${id}`),
    
    // Mark alert as read
    markAsRead: (id) => api.patch(`/alerts/farmer/${id}/read`),
    
    // Get alert preferences
    getPreferences: () => api.get('/alerts/farmer/preferences'),
    
    // Update alert preferences
    updatePreferences: (preferences) => api.put('/alerts/farmer/preferences', preferences),
    
    // Get alert statistics
    getStats: () => api.get('/alerts/farmer/stats'),
    
    // Subscribe to alert types
    subscribe: (types) => api.post('/alerts/farmer/subscribe', { types }),
    
    // Unsubscribe from alert types
    unsubscribe: (types) => api.post('/alerts/farmer/unsubscribe', { types }),
    
    // Get delivery reports
    getDeliveryReports: (params) => api.get('/alerts/farmer/delivery-reports', { params })
  }
};

export default farmersAPI;
