import API from './axios'

export const marketProAPI = {
  // Price Alerts
  listAlerts: () => API.get('/market/alerts'),
  createAlert: (data) => API.post('/market/alerts', data),
  updateAlert: (id, data) => API.put(`/market/alerts/${id}`, data),
  deleteAlert: (id) => API.delete(`/market/alerts/${id}`),

  // Buyer Directory (public)
  listBuyers: (params) => API.get('/market/buyers', { params }),
  getBuyer: (id) => API.get(`/market/buyers/${id}`),
}
