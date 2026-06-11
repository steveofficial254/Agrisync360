import API from './axios';

export const aiAPI = {
  chat: (message) => API.post('/ai/chat', { message }),
  getConversations: () => API.get('/ai/conversations'),
  createConversation: (title) => API.post('/ai/conversations', { title }),
  getConversation: (id) => API.get(`/ai/conversations/${id}`),
  sendToConversation: (id, message) =>
    API.post(`/ai/conversations/${id}/messages`, { message }),
};
