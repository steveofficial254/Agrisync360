import API from './axios';

export const farmOpsAPI = {
  // Farm Operations
  getFarmOps: (params) => API.get('/farm-ops/', { params }),
  createFarmOp: (data) => API.post('/farm-ops/', data),
  deleteFarmOp: (id) => API.delete(`/farm-ops/${id}`),

  // Inventory
  getInventory: () => API.get('/inventory/'),
  createInventoryItem: (data) => API.post('/inventory/', data),
  updateInventoryItem: (id, data) => API.put(`/inventory/${id}`, data),
  deleteInventoryItem: (id) => API.delete(`/inventory/${id}`),

  // Batches
  getBatches: () => API.get('/batches/'),
  createBatch: (data) => API.post('/batches/', data),
  deleteBatch: (id) => API.delete(`/batches/${id}`),

  // Compliance
  getCompliance: () => API.get('/compliance/'),
  createCompliance: (data) => API.post('/compliance/', data),
  deleteCompliance: (id) => API.delete(`/compliance/${id}`),
};
