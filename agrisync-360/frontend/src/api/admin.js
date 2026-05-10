import axios from "axios";
import api from "./axios";

export const adminAPI = {
  // Dashboard stats
  getStats: () => api.get('/admin/stats'),
  
  // Revenue data
  getRevenue: () => api.get('/admin/revenue'),
  
  // Top counties
  getTopCounties: () => api.get('/admin/top-counties'),
  
  // Top crops
  getTopCrops: () => api.get('/admin/top-crops'),
  
  // Recent farmers
  getRecentFarmers: () => api.get('/admin/recent-farmers'),
  
  // System health
  getSystemHealth: () => api.get('/admin/system-health'),
  
  // Send bulk alert
  sendBulkAlert: (data) => api.post('/admin/send-bulk-alert', data),
  
  // SMS & Alert System APIs
  alerts: {
    // Send bulk alerts (admin only)
    sendBulk: (data) => api.post('/alerts/send-bulk', data),
    
    // Schedule alerts
    schedule: (data) => api.post('/alerts/schedule', data),
    
    // Get farmer alert history
    getFarmerHistory: (farmerId) => api.get(`/alerts/farmer/${farmerId}/history`),
    
    // Weather-triggered alerts (Celery auto-trigger)
    triggerWeatherAlert: (data) => api.post('/alerts/weather-trigger', data),
    
    // Get all alerts
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
    getStats: (params) => api.get('/alerts/stats', { params })
  },
  
  // Farmer management
  getFarmers: (params) => api.get('/admin/farmers', { params }),
  getFarmerDetails: (id) => api.get(`/admin/farmers/${id}`),
  sendBulkSMS: (data) => api.post('/admin/send-bulk-sms', data),
  exportFarmers: (params) => api.get('/admin/farmers/export', { 
    params,
    responseType: 'blob'
  }),
  
  // User management
  updateUserStatus: (id, status) => api.patch(`/admin/users/${id}/status`, { status }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  
  // Analytics
  getAnalytics: (params) => api.get('/admin/analytics', { params }),
  getReports: (params) => api.get('/admin/reports', { params }),
  
  // Settings
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),
  
  // Notifications
  getNotifications: () => api.get('/admin/notifications'),
  markNotificationRead: (id) => api.patch(`/admin/notifications/${id}/read`),
  
  // Audit logs
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params })
};
