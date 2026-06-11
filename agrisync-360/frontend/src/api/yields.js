import API from './axios';

export const yieldsAPI = {
  getAll: (params) => API.get('/yields/', { params }),
  createYield: (data) => API.post('/yields/', data),
  getYield: (id) => API.get(`/yields/${id}`),
  deleteYield: (id) => API.delete(`/yields/${id}`),
};
