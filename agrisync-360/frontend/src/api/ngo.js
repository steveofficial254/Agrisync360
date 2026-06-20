import axios from "axios";
import api from "./axios";
import { apiConfig } from './config';
import { mockNGOAPI } from './mockApi';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.DEV;
const ngoApi = USE_MOCK ? mockNGOAPI : api;

export const ngoAPI = {
  // Dashboard data
  getDashboard: () => USE_MOCK ? ngoApi.getDashboard() : api.get('/ngo/dashboard'),
  getStats: () => USE_MOCK ? ngoApi.getStats() : api.get('/ngo/stats'),

  // Farmer management
  getFarmers: (params) => USE_MOCK ? ngoApi.getFarmers(params) : api.get('/ngo/farmers', { params }),
  registerFarmer: (data) => USE_MOCK ? ngoApi.registerFarmer(data) : api.post('/ngo/farmers', data),
  updateFarmer: (id, data) => USE_MOCK ? ngoApi.updateFarmer(id, data) : api.put(`/ngo/farmers/${id}`, data),
  exportFarmersCSV: () => USE_MOCK ? ngoApi.exportFarmersCSV() : api.get('/ngo/farmers/export'),

  // Batch management
  getBatches: () => USE_MOCK ? ngoApi.getBatches() : api.get('/ngo/batches'),
  createBatch: (data) => USE_MOCK ? ngoApi.createBatch(data) : api.post('/ngo/batches', data),
  updateBatch: (id, data) => USE_MOCK ? ngoApi.updateBatch(id, data) : api.put(`/ngo/batches/${id}`, data),
  deleteBatch: (id) => USE_MOCK ? ngoApi.deleteBatch(id) : api.delete(`/ngo/batches/${id}`),
  getBatchDetails: (id) => USE_MOCK ? ngoApi.getBatchDetails(id) : api.get(`/ngo/batches/${id}`),
  getBatchStatus: (id) => USE_MOCK ? ngoApi.getBatchStatus(id) : api.get(`/ngo/batches/${id}/status`),

  // SMS campaigns
  sendBulkSMS: (data) => USE_MOCK ? ngoApi.sendBulkSMS(data) : api.post('/ngo/send-bulk-sms', data),
  sendAdvisorySMS: (data) => USE_MOCK ? ngoApi.sendAdvisorySMS(data) : api.post('/ngo/send-advisory-sms', data),
  getSMSHistory: () => USE_MOCK ? ngoApi.getSMSHistory() : api.get('/ngo/sms-history'),
  getSMSStats: () => USE_MOCK ? ngoApi.getSMSStats() : api.get('/ngo/sms-stats'),

  // Market data
  getMarketPrices: () => USE_MOCK ? ngoApi.getMarketPrices() : api.get('/ngo/market-prices'),
  getMarketTrends: () => USE_MOCK ? ngoApi.getMarketTrends() : api.get('/ngo/market-trends'),

  // Training management
  getTrainings: () => USE_MOCK ? ngoApi.getTrainings() : api.get('/ngo/trainings'),
  createTraining: (data) => USE_MOCK ? ngoApi.createTraining(data) : api.post('/ngo/trainings', data),
  updateTraining: (id, data) => USE_MOCK ? ngoApi.updateTraining(id, data) : api.put(`/ngo/trainings/${id}`, data),
  deleteTraining: (id) => USE_MOCK ? ngoApi.deleteTraining(id) : api.delete(`/ngo/trainings/${id}`),

  // Reports
  getImpactReport: (params) => USE_MOCK ? ngoApi.getImpactReport(params) : api.get('/ngo/impact-report', { params }),
  getFarmerReport: (params) => USE_MOCK ? ngoApi.getFarmerReport(params) : api.get('/ngo/farmer-report', { params }),
  getBatchReport: (params) => USE_MOCK ? ngoApi.getBatchReport(params) : api.get('/ngo/batch-report', { params }),

  // Analytics
  getAnalytics: () => USE_MOCK ? ngoApi.getAnalytics() : api.get('/ngo/analytics'),
  getFarmerAnalytics: () => USE_MOCK ? ngoApi.getFarmerAnalytics() : api.get('/ngo/farmer-analytics'),
  getCropAnalytics: () => USE_MOCK ? ngoApi.getCropAnalytics() : api.get('/ngo/crop-analytics'),
  getCountyAnalytics: () => USE_MOCK ? ngoApi.getCountyAnalytics() : api.get('/ngo/county-analytics'),

  // Profile management
  getProfile: () => USE_MOCK ? ngoApi.getProfile() : api.get('/ngo/profile'),
  updateProfile: (data) => USE_MOCK ? ngoApi.updateProfile(data) : api.put('/ngo/profile', data),

  // Settings
  getSettings: () => USE_MOCK ? ngoApi.getSettings() : api.get('/ngo/settings'),
  updateSettings: (data) => USE_MOCK ? ngoApi.updateSettings(data) : api.put('/ngo/settings', data),

  // Notifications
  getNotifications: () => USE_MOCK ? ngoApi.getNotifications() : api.get('/ngo/notifications'),
  markNotificationRead: (id) => USE_MOCK ? ngoApi.markNotificationRead(id) : api.patch(`/ngo/notifications/${id}/read`),

  // SMS & Alert System APIs
  alerts: {
    // Send bulk alerts (NGO specific)
    sendBulk: (data) => USE_MOCK ? ngoApi.alerts.sendBulk(data) : api.post('/alerts/send-bulk', data),

    // Schedule alerts
    schedule: (data) => USE_MOCK ? ngoApi.alerts.schedule(data) : api.post('/alerts/schedule', data),

    // Get farmer alert history
    getFarmerHistory: (farmerId) => USE_MOCK ? ngoApi.alerts.getFarmerHistory(farmerId) : api.get(`/alerts/farmer/${farmerId}/history`),

    // Weather-triggered alerts (Celery auto-trigger)
    triggerWeatherAlert: (data) => USE_MOCK ? ngoApi.alerts.triggerWeatherAlert(data) : api.post('/alerts/weather-trigger', data),

    // Get all alerts for NGO batches
    getAll: (params) => USE_MOCK ? ngoApi.alerts.getAll(params) : api.get('/alerts', { params }),

    // Get alert by ID
    getById: (id) => USE_MOCK ? ngoApi.alerts.getById(id) : api.get(`/alerts/${id}`),

    // Update alert status
    updateStatus: (id, status) => USE_MOCK ? ngoApi.alerts.updateStatus(id, status) : api.patch(`/alerts/${id}/status`, { status }),

    // Delete alert
    delete: (id) => USE_MOCK ? ngoApi.alerts.delete(id) : api.delete(`/alerts/${id}`),

    // Get automated alert triggers
    getTriggers: () => USE_MOCK ? ngoApi.alerts.getTriggers() : api.get('/alerts/triggers'),

    // Configure automated triggers
    configureTrigger: (type, config) => USE_MOCK ? ngoApi.alerts.configureTrigger(type, config) : api.post(`/alerts/triggers/${type}`, config),

    // Get alert statistics
    getStats: (params) => USE_MOCK ? ngoApi.alerts.getStats(params) : api.get('/alerts/stats', { params }),

    // Send advisory SMS (NGO specific)
    sendAdvisorySMS: (data) => USE_MOCK ? ngoApi.alerts.sendAdvisorySMS(data) : api.post('/ngo/send-advisory-sms', data),

    // Get SMS delivery reports
    getSMSReports: (params) => USE_MOCK ? ngoApi.alerts.getSMSReports(params) : api.get('/ngo/sms-reports', { params }),

    // Schedule weekly advisories
    scheduleWeeklyAdvisory: (data) => USE_MOCK ? ngoApi.alerts.scheduleWeeklyAdvisory(data) : api.post('/ngo/schedule-weekly-advisory', data)
  }
};
