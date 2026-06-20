import API from './axios'
import { apiConfig } from './config'
import { mockMarketProAPI } from './mockApi'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.DEV
const marketProApi = USE_MOCK ? mockMarketProAPI : API

export const marketProAPI = {
  // Market data
  getMarketData: () => USE_MOCK ? marketProApi.getMarketData() : API.get('/market/pro/data'),

  // Profitability calculator
  calculateProfitability: (data) => USE_MOCK ? marketProApi.calculateProfitability(data) : API.post('/market/pro/profitability', data),

  // Market intelligence
  getMarketIntelligence: (crop) => USE_MOCK ? marketProApi.getMarketIntelligence(crop) : API.get(`/market/pro/intelligence/${crop}`),

  // Price Alerts
  listAlerts: () => USE_MOCK ? marketProApi.getPriceAlerts() : API.get('/market/alerts'),
  createAlert: (data) => USE_MOCK ? marketProApi.createPriceAlert(data) : API.post('/market/alerts', data),
  updateAlert: (id, data) => API.put(`/market/alerts/${id}`, data),
  deleteAlert: (id) => API.delete(`/market/alerts/${id}`),

  // Buyer Directory (public)
  listBuyers: (params) => API.get('/market/buyers', { params }),
  getBuyer: (id) => API.get(`/market/buyers/${id}`),
}
