import API from './axios';

export const greenhouseAPI = {
    createGreenhouse: (data) => API.post('/greenhouse/', data),
};
