import api from "./axios";

export const marketAPI = {
  // Prices
  getPrices: (params = {}) => api.get("/market/prices", { params }),
  getPriceHistory: (params = {}) => api.get("/market/history", { params }),
  
  // Profitability
  getProfitability: (params = {}) => api.get("/market/profitability", { params }),
  
  // Market info
  getMarkets: (params = {}) => api.get("/market/markets", { params }),
  getCrops: () => api.get("/market/crops"),
  
  // All prices (auth required)
  getAllPrices: () => api.get("/market/prices/all"),
};

// Legacy export for backward compatibility
export const getMarket = (params = {}) => api.get("/market", { params });

export default marketAPI;
