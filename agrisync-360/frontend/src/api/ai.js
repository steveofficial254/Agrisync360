import API from './axios';

export const aiAPI = {
    chat: (message) => API.post('/ai/chat', { message }),
};
