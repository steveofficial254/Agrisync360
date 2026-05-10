import axios from "axios";
import api from "./axios";

export const dealerAPI = {
  // Dashboard stats
  getStats: () => api.get('/dealer/stats'),
  
  // Product management
  getProducts: () => api.get('/dealer/products'),
  createProduct: (data) => api.post('/dealer/products', data),
  updateProduct: (id, data) => api.put(`/dealer/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/dealer/products/${id}`),
  
  // Farmer connections
  getConnectedFarmers: () => api.get('/dealer/farmers'),
  connectWithFarmer: (farmerId) => api.post(`/dealer/farmers/${farmerId}/connect`),
  disconnectFarmer: (farmerId) => api.delete(`/dealer/farmers/${farmerId}/disconnect`),
  
  // Broadcast messages
  getBroadcasts: () => api.get('/dealer/broadcasts'),
  createBroadcast: (data) => api.post('/dealer/broadcasts', data),
  deleteBroadcast: (id) => api.delete(`/dealer/broadcasts/${id}`),
  
  // Orders
  getOrders: () => api.get('/dealer/orders'),
  updateOrderStatus: (id, status) => api.patch(`/dealer/orders/${id}/status`, { status }),
  
  // Analytics
  getAnalytics: () => api.get('/dealer/analytics'),
  getSalesReport: (params) => api.get('/dealer/sales-report', { params }),
  
  // Profile management
  getProfile: () => api.get('/dealer/profile'),
  updateProfile: (data) => api.put('/dealer/profile', data),
  
  // Inventory
  getInventory: () => api.get('/dealer/inventory'),
  updateInventory: (id, data) => api.put(`/dealer/inventory/${id}`, data),
  
  // Reviews
  getReviews: () => api.get('/dealer/reviews'),
  respondToReview: (id, response) => api.post(`/dealer/reviews/${id}/respond`, { response }),
  
  // SMS & Alert System APIs
  alerts: {
    // Send product alerts to farmers
    sendProductAlert: (data) => api.post('/alerts/send-product-alert', data),
    
    // Schedule promotional alerts
    schedulePromotion: (data) => api.post('/alerts/schedule-promotion', data),
    
    // Get farmer alert history
    getFarmerHistory: (farmerId) => api.get(`/alerts/farmer/${farmerId}/history`),
    
    // Weather-triggered product alerts
    triggerWeatherProductAlert: (data) => api.post('/alerts/weather-trigger-product', data),
    
    // Get all alerts for dealer
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
    
    // Send broadcast SMS (dealer specific)
    sendBroadcastSMS: (data) => api.post('/dealer/send-broadcast-sms', data),
    
    // Get SMS delivery reports
    getSMSReports: (params) => api.get('/dealer/sms-reports', { params }),
    
    // Schedule promotional SMS
    schedulePromotionalSMS: (data) => api.post('/dealer/schedule-promotional-sms', data)
  }
};
