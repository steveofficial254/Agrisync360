import API from './axios';
import { apiConfig } from './config';

const mockCommunityAPI = {
  createPost: async (data) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { data: { data: { id: `post-${Date.now()}`, ...data, created_at: new Date().toISOString() } } };
  },
  getPosts: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { data: { data: [] } };
  },
};

const api = apiConfig.useMock ? mockCommunityAPI : API;

export const communityAPI = {
    createPost: (data) => apiConfig.useMock ? api.createPost(data) : API.post('/community/posts', data),
    getPosts: () => apiConfig.useMock ? api.getPosts() : API.get('/community/posts'),
};
