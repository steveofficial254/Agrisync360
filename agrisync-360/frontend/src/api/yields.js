import API from './axios';

export const yieldsAPI = {
    createYield: (data) => API.post('/yields/', data),
};
