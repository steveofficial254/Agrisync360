import axios from "axios";
import api from "./axios";
import { apiConfig } from './config';
import { mockAdminAPI } from './mockApi';

// Force mock mode for development
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.DEV;

console.log('[Admin API] Mock mode:', USE_MOCK, 'DEV mode:', import.meta.env.DEV);

const adminApi = USE_MOCK ? mockAdminAPI : api;

export const adminAPI = {
  // Dashboard stats
  getStats: () => USE_MOCK ? adminApi.getStats() : api.get('/admin/stats'),

  // Revenue data
  getRevenue: () => USE_MOCK ? adminApi.getRevenue() : api.get('/admin/revenue'),

  // Top counties
  getTopCounties: () => USE_MOCK ? adminApi.getTopCounties() : api.get('/admin/top-counties'),

  // Top crops
  getTopCrops: () => USE_MOCK ? adminApi.getTopCrops() : api.get('/admin/top-crops'),

  // Recent farmers
  getRecentFarmers: () => USE_MOCK ? adminApi.getRecentFarmers() : api.get('/admin/recent-farmers'),

  // System health
  getSystemHealth: () => USE_MOCK ? adminApi.getSystemHealth() : api.get('/admin/system-health'),

  // Send bulk alert
  sendBulkAlert: (data) => USE_MOCK ? adminApi.sendBulkAlert(data) : api.post('/admin/send-bulk-alert', data),

  // SMS & Alert System APIs
  alerts: {
    // Send bulk alerts (admin only)
    sendBulk: (data) => USE_MOCK ? adminApi.alerts.sendBulk(data) : api.post('/alerts/send-bulk', data),

    // Schedule alerts
    schedule: (data) => USE_MOCK ? adminApi.alerts.schedule(data) : api.post('/alerts/schedule', data),

    // Get farmer alert history
    getFarmerHistory: (farmerId) => USE_MOCK ? adminApi.alerts.getFarmerHistory(farmerId) : api.get(`/alerts/farmer/${farmerId}/history`),

    // Weather-triggered alerts (Celery auto-trigger)
    triggerWeatherAlert: (data) => USE_MOCK ? adminApi.alerts.triggerWeatherAlert(data) : api.post('/alerts/weather-trigger', data),

    // Get all alerts
    getAll: (params) => USE_MOCK ? adminApi.alerts.getAll(params) : api.get('/alerts', { params }),

    // Get alert by ID
    getById: (id) => USE_MOCK ? adminApi.alerts.getById(id) : api.get(`/alerts/${id}`),

    // Update alert status
    updateStatus: (id, status) => USE_MOCK ? adminApi.alerts.updateStatus(id, status) : api.patch(`/alerts/${id}/status`, { status }),

    // Delete alert
    delete: (id) => USE_MOCK ? adminApi.alerts.delete(id) : api.delete(`/alerts/${id}`),

    // Get automated alert triggers
    getTriggers: () => USE_MOCK ? adminApi.alerts.getTriggers() : api.get('/alerts/triggers'),

    // Configure automated triggers
    configureTrigger: (type, config) => USE_MOCK ? adminApi.alerts.configureTrigger(type, config) : api.post(`/alerts/triggers/${type}`, config),

    // Get alert statistics
    getStats: (params) => USE_MOCK ? adminApi.alerts.getStats(params) : api.get('/alerts/stats', { params })
  },

  // Farmer management
  getFarmers: (params) => USE_MOCK ? adminApi.getFarmers(params) : api.get('/admin/farmers', { params }),
  getFarmerDetails: (id) => USE_MOCK ? adminApi.getFarmerDetails(id) : api.get(`/admin/farmers/${id}`),
  sendBulkSMS: (data) => USE_MOCK ? adminApi.sendBulkSMS(data) : api.post('/admin/send-bulk-sms', data),
  exportFarmers: (params) => USE_MOCK ? adminApi.exportFarmers(params) : api.get('/admin/farmers/export', {
    params,
    responseType: 'blob'
  }),

  // User management
  updateUserStatus: (id, status) => USE_MOCK ? adminApi.updateUserStatus(id, status) : api.patch(`/admin/users/${id}/status`, { status }),
  deleteUser: (id) => USE_MOCK ? adminApi.deleteUser(id) : api.delete(`/admin/users/${id}`),

  // Analytics
  getAnalytics: (params) => USE_MOCK ? adminApi.getAnalytics(params) : api.get('/admin/analytics', { params }),
  getReports: (params) => USE_MOCK ? adminApi.getReports(params) : api.get('/admin/reports', { params }),

  // Settings
  getSettings: () => USE_MOCK ? adminApi.getSettings() : api.get('/admin/settings'),
  updateSettings: (data) => USE_MOCK ? adminApi.updateSettings(data) : api.put('/admin/settings', data),

  // Notifications
  getNotifications: () => USE_MOCK ? adminApi.getNotifications() : api.get('/admin/notifications'),
  markNotificationRead: (id) => USE_MOCK ? adminApi.markNotificationRead(id) : api.patch(`/admin/notifications/${id}/read`),

  // Audit logs
  getAuditLogs: (params) => USE_MOCK ? adminApi.getAuditLogs(params) : api.get('/admin/audit-logs', { params })
};
