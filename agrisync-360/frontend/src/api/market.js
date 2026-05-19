import API from './axios'

export const marketAPI = {
  getPrices: (params) =>
    API.get('/market/prices', { params }),

  getAllPrices: () =>
    API.get('/market/prices/all'),

  getPriceHistory: (params) =>
    API.get('/market/history', { params }),

  getProfitability: (params) =>
    API.get('/market/profitability', { params }),
}
