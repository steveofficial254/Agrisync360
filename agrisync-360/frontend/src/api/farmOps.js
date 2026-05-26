import API from './axios';

export const farmOpsAPI = {
    createFarmOp: (data) => API.post('/farm-ops/', data),
    createInventoryItem: (data) => API.post('/inventory/', data),
    createBatch: (data) => API.post('/batches/', data),
};
