import API from './axios'
import { apiConfig } from './config'
import { mockMarketAPI } from './mockApi'

const api = apiConfig.useMock ? mockMarketAPI : API

export const marketAPI = {
  getPrices: (params) =>
    apiConfig.useMock ? api.getPrices(params) : API.get('/market/prices', { params }),

  getAllPrices: () =>
    apiConfig.useMock ? api.getPrices() : API.get('/market/prices/all'),

  getPriceHistory: (params) =>
    apiConfig.useMock ? api.getTrends(params.crop, params.months) : API.get('/market/history', { params }),

  getProfitability: (params) =>
    apiConfig.useMock ? api.calculateProfitability(params) : API.get('/market/profitability', { params }),
}
