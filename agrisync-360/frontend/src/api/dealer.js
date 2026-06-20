import axios from "axios";
import api from "./axios";
import { apiConfig } from './config';
import { mockDealerAPI } from './mockApi';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.DEV;
const dealerApi = USE_MOCK ? mockDealerAPI : api;

export const dealerAPI = {
  // Dashboard stats
  getStats: () => USE_MOCK ? dealerApi.getStats() : api.get('/dealer/stats'),

  // Product management
  getProducts: () => USE_MOCK ? dealerApi.getProducts() : api.get('/dealer/products'),
  createProduct: (data) => USE_MOCK ? dealerApi.createProduct(data) : api.post('/dealer/products', data),
  updateProduct: (id, data) => USE_MOCK ? dealerApi.updateProduct(id, data) : api.put(`/dealer/products/${id}`, data),
  deleteProduct: (id) => USE_MOCK ? dealerApi.deleteProduct(id) : api.delete(`/dealer/products/${id}`),

  // Farmer connections
  getConnectedFarmers: () => USE_MOCK ? dealerApi.getConnectedFarmers() : api.get('/dealer/farmers'),
  getFarmers: () => USE_MOCK ? dealerApi.getConnectedFarmers() : api.get('/dealer/farmers'), // Alias for getConnectedFarmers
  connectWithFarmer: (farmerId) => USE_MOCK ? dealerApi.connectWithFarmer(farmerId) : api.post(`/dealer/farmers/${farmerId}/connect`),
  disconnectFarmer: (farmerId) => USE_MOCK ? dealerApi.disconnectFarmer(farmerId) : api.delete(`/dealer/farmers/${farmerId}/disconnect`),

  // Broadcast messages
  getBroadcasts: () => USE_MOCK ? dealerApi.getBroadcasts() : api.get('/dealer/broadcasts'),
  createBroadcast: (data) => USE_MOCK ? dealerApi.createBroadcast(data) : api.post('/dealer/broadcasts', data),
  deleteBroadcast: (id) => USE_MOCK ? dealerApi.deleteBroadcast(id) : api.delete(`/dealer/broadcasts/${id}`),

  // Orders
  getOrders: () => USE_MOCK ? dealerApi.getOrders() : api.get('/dealer/orders'),
  updateOrderStatus: (id, status) => USE_MOCK ? dealerApi.updateOrderStatus(id, status) : api.patch(`/dealer/orders/${id}/status`, { status }),

  // Analytics
  getAnalytics: () => USE_MOCK ? dealerApi.getAnalytics() : api.get('/dealer/analytics'),
  getSalesReport: (params) => USE_MOCK ? dealerApi.getSalesReport(params) : api.get('/dealer/sales-report', { params }),

  // Profile management
  getProfile: () => USE_MOCK ? dealerApi.getProfile() : api.get('/dealer/profile'),
  updateProfile: (data) => USE_MOCK ? dealerApi.updateProfile(data) : api.put('/dealer/profile', data),

  // Inventory
  getInventory: () => USE_MOCK ? dealerApi.getInventory() : api.get('/dealer/inventory'),
  updateInventory: (id, data) => USE_MOCK ? dealerApi.updateInventory(id, data) : api.put(`/dealer/inventory/${id}`, data),

  // Reviews
  getReviews: () => USE_MOCK ? dealerApi.getReviews() : api.get('/dealer/reviews'),
  respondToReview: (id, response) => USE_MOCK ? dealerApi.respondToReview(id, response) : api.post(`/dealer/reviews/${id}/respond`, { response }),

  // SMS & Alert System APIs
  alerts: {
    // Send product alerts to farmers
    sendProductAlert: (data) => USE_MOCK ? dealerApi.alerts.sendProductAlert(data) : api.post('/alerts/send-product-alert', data),

    // Schedule promotional alerts
    schedulePromotion: (data) => USE_MOCK ? dealerApi.alerts.schedulePromotion(data) : api.post('/alerts/schedule-promotion', data),

    // Get farmer alert history
    getFarmerHistory: (farmerId) => USE_MOCK ? dealerApi.alerts.getFarmerHistory(farmerId) : api.get(`/alerts/farmer/${farmerId}/history`),

    // Weather-triggered product alerts
    triggerWeatherProductAlert: (data) => USE_MOCK ? dealerApi.alerts.triggerWeatherProductAlert(data) : api.post('/alerts/weather-trigger-product', data),

    // Get all alerts for dealer
    getAll: (params) => USE_MOCK ? dealerApi.alerts.getAll(params) : api.get('/alerts', { params }),

    // Get alert by ID
    getById: (id) => USE_MOCK ? dealerApi.alerts.getById(id) : api.get(`/alerts/${id}`),

    // Update alert status
    updateStatus: (id, status) => USE_MOCK ? dealerApi.alerts.updateStatus(id, status) : api.patch(`/alerts/${id}/status`, { status }),

    // Delete alert
    delete: (id) => USE_MOCK ? dealerApi.alerts.delete(id) : api.delete(`/alerts/${id}`),

    // Get automated alert triggers
    getTriggers: () => USE_MOCK ? dealerApi.alerts.getTriggers() : api.get('/alerts/triggers'),

    // Configure automated triggers
    configureTrigger: (type, config) => USE_MOCK ? dealerApi.alerts.configureTrigger(type, config) : api.post(`/alerts/triggers/${type}`, config),

    // Get alert statistics
    getStats: (params) => USE_MOCK ? dealerApi.alerts.getStats(params) : api.get('/alerts/stats', { params }),

    // Send broadcast SMS (dealer specific)
    sendBroadcastSMS: (data) => USE_MOCK ? dealerApi.alerts.sendBroadcastSMS(data) : api.post('/dealer/send-broadcast-sms', data),

    // Get SMS delivery reports
    getSMSReports: (params) => USE_MOCK ? dealerApi.alerts.getSMSReports(params) : api.get('/dealer/sms-reports', { params }),

    // Schedule promotional SMS
    schedulePromotionalSMS: (data) => USE_MOCK ? dealerApi.alerts.schedulePromotionalSMS(data) : api.post('/dealer/schedule-promotional-sms', data)
  }
};
