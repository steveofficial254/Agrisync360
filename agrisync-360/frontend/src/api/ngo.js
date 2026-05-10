import axios from "axios";
import api from "./axios";

export const ngoAPI = {
  // Dashboard data
  getDashboard: () => api.get('/ngo/dashboard'),
  getStats: () => api.get('/ngo/stats'),
  
  // Farmer management
  getFarmers: (params) => api.get('/ngo/farmers', { params }),
  registerFarmer: (data) => api.post('/ngo/farmers', data),
  updateFarmer: (id, data) => api.put(`/ngo/farmers/${id}`, data),
  
  // Batch management
  getBatches: () => api.get('/ngo/batches'),
  createBatch: (data) => api.post('/ngo/batches', data),
  updateBatch: (id, data) => api.put(`/ngo/batches/${id}`, data),
  deleteBatch: (id) => api.delete(`/ngo/batches/${id}`),
  getBatchDetails: (id) => api.get(`/ngo/batches/${id}`),
  
  // SMS campaigns
  sendBulkSMS: (data) => api.post('/ngo/send-bulk-sms', data),
  getSMSHistory: () => api.get('/ngo/sms-history'),
  getSMSStats: () => api.get('/ngo/sms-stats'),
  
  // Market data
  getMarketPrices: () => api.get('/ngo/market-prices'),
  getMarketTrends: () => api.get('/ngo/market-trends'),
  
  // Training management
  getTrainings: () => api.get('/ngo/trainings'),
  createTraining: (data) => api.post('/ngo/trainings', data),
  updateTraining: (id, data) => api.put(`/ngo/trainings/${id}`, data),
  deleteTraining: (id) => api.delete(`/ngo/trainings/${id}`),
  
  // Reports
  getImpactReport: (params) => api.get('/ngo/impact-report', { params }),
  getFarmerReport: (params) => api.get('/ngo/farmer-report', { params }),
  getBatchReport: (params) => api.get('/ngo/batch-report', { params }),
  
  // Analytics
  getAnalytics: () => api.get('/ngo/analytics'),
  getFarmerAnalytics: () => api.get('/ngo/farmer-analytics'),
  getCropAnalytics: () => api.get('/ngo/crop-analytics'),
  getCountyAnalytics: () => api.get('/ngo/county-analytics'),
  
  // Profile management
  getProfile: () => api.get('/ngo/profile'),
  updateProfile: (data) => api.put('/ngo/profile', data),
  
  // Settings
  getSettings: () => api.get('/ngo/settings'),
  updateSettings: (data) => api.put('/ngo/settings', data),
  
  // Notifications
  getNotifications: () => api.get('/ngo/notifications'),
  markNotificationRead: (id) => api.patch(`/ngo/notifications/${id}/read`),
  
  // SMS & Alert System APIs
  alerts: {
    // Send bulk alerts (NGO specific)
    sendBulk: (data) => api.post('/alerts/send-bulk', data),
    
    // Schedule alerts
    schedule: (data) => api.post('/alerts/schedule', data),
    
    // Get farmer alert history
    getFarmerHistory: (farmerId) => api.get(`/alerts/farmer/${farmerId}/history`),
    
    // Weather-triggered alerts (Celery auto-trigger)
    triggerWeatherAlert: (data) => api.post('/alerts/weather-trigger', data),
    
    // Get all alerts for NGO batches
    getAll: (params) => api.get('/alerts', { params }),
    
    // Get alert by ID
    getById: (id) => api.get(`/alerts/${id}`),
    
    // Update alert status
    updateStatus: (id, status) => api.patch(`/alerts/${id}/status`, { status }),
    
    // Delete alert
    delete: (id) => api.delete(`/alerts/${id}`),
    
    // Get automated alert triggers
    getTriggers: () => api.get('/alerts/triggers'),
    
    // Configure automated triggers
    configureTrigger: (type, config) => api.post(`/alerts/triggers/${type}`, config),
    
    // Get alert statistics
    getStats: (params) => api.get('/alerts/stats', { params }),
    
    // Send advisory SMS (NGO specific)
    sendAdvisorySMS: (data) => api.post('/ngo/send-advisory-sms', data),
    
    // Get SMS delivery reports
    getSMSReports: (params) => api.get('/ngo/sms-reports', { params }),
    
    // Schedule weekly advisories
    scheduleWeeklyAdvisory: (data) => api.post('/ngo/schedule-weekly-advisory', data)
  }
};
