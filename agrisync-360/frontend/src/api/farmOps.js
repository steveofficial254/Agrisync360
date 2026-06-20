import API from './axios';
import { apiConfig } from './config';

const mockFarmOpsAPI = {
  // Farm Operations
  getFarmOps: async (params) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { data: { data: [] } };
  },
  createFarmOp: async (data) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { data: { data: { id: `op-${Date.now()}`, ...data, created_at: new Date().toISOString() } } };
  },
  deleteFarmOp: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { data: { success: true } };
  },

  // Inventory
  getInventory: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { data: { data: [] } };
  },
  createInventoryItem: async (data) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { data: { data: { id: `inv-${Date.now()}`, ...data, created_at: new Date().toISOString() } } };
  },
  updateInventoryItem: async (id, data) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { data: { data: { id, ...data, updated_at: new Date().toISOString() } } };
  },
  deleteInventoryItem: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { data: { success: true } };
  },

  // Batches
  getBatches: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { data: { data: [] } };
  },
  createBatch: async (data) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { data: { data: { id: `batch-${Date.now()}`, ...data, created_at: new Date().toISOString() } } };
  },
  deleteBatch: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { data: { success: true } };
  },

  // Compliance
  getCompliance: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { data: { data: [] } };
  },
  createCompliance: async (data) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { data: { data: { id: `comp-${Date.now()}`, ...data, created_at: new Date().toISOString() } } };
  },
  deleteCompliance: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { data: { success: true } };
  },
};

const api = apiConfig.useMock ? mockFarmOpsAPI : API;

export const farmOpsAPI = {
  // Farm Operations
  getFarmOps: (params) => apiConfig.useMock ? api.getFarmOps(params) : API.get('/farm-ops/', { params }),
  createFarmOp: (data) => apiConfig.useMock ? api.createFarmOp(data) : API.post('/farm-ops/', data),
  deleteFarmOp: (id) => apiConfig.useMock ? api.deleteFarmOp(id) : API.delete(`/farm-ops/${id}`),

  // Inventory
  getInventory: () => apiConfig.useMock ? api.getInventory() : API.get('/inventory/'),
  createInventoryItem: (data) => apiConfig.useMock ? api.createInventoryItem(data) : API.post('/inventory/', data),
  updateInventoryItem: (id, data) => apiConfig.useMock ? api.updateInventoryItem(id, data) : API.put(`/inventory/${id}`, data),
  deleteInventoryItem: (id) => apiConfig.useMock ? api.deleteInventoryItem(id) : API.delete(`/inventory/${id}`),

  // Batches
  getBatches: () => apiConfig.useMock ? api.getBatches() : API.get('/batches/'),
  createBatch: (data) => apiConfig.useMock ? api.createBatch(data) : API.post('/batches/', data),
  deleteBatch: (id) => apiConfig.useMock ? api.deleteBatch(id) : API.delete(`/batches/${id}`),

  // Compliance
  getCompliance: () => apiConfig.useMock ? api.getCompliance() : API.get('/compliance/'),
  createCompliance: (data) => apiConfig.useMock ? api.createCompliance(data) : API.post('/compliance/', data),
  deleteCompliance: (id) => apiConfig.useMock ? api.deleteCompliance(id) : API.delete(`/compliance/${id}`),
};
