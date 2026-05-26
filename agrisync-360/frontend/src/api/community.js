import API from './axios';

export const communityAPI = {
    createPost: (data) => API.post('/community/posts', data),
    getPosts: () => API.get('/community/posts'),
};
