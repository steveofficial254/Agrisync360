import API from './axios';
import { apiConfig } from './config';

const mockYieldsAPI = {
  getAll: async (params) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { data: { data: [] } };
  },
  createYield: async (data) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { data: { data: { id: `yield-${Date.now()}`, ...data, created_at: new Date().toISOString() } } };
  },
  getYield: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { data: { data: { id, crop_name: 'maize', yield_kg_per_acre: 20, season: '2024' } } };
  },
  deleteYield: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { data: { success: true } };
  },
};

const api = apiConfig.useMock ? mockYieldsAPI : API;

export const yieldsAPI = {
  getAll: (params) => apiConfig.useMock ? api.getAll(params) : API.get('/yields/', { params }),
  createYield: (data) => apiConfig.useMock ? api.createYield(data) : API.post('/yields/', data),
  getYield: (id) => apiConfig.useMock ? api.getYield(id) : API.get(`/yields/${id}`),
  deleteYield: (id) => apiConfig.useMock ? api.deleteYield(id) : API.delete(`/yields/${id}`),
};
