import api from "./axios";

export const paymentsAPI = {
  getPlans: () => api.get("/payments/plans"),
  getSubscription: () => api.get("/payments/subscription"),
  subscribe: (data) => api.post("/payments/subscribe", data),
  upgrade: (data) => api.post("/payments/upgrade", data),
  getPaymentStatus: (checkoutId) => api.get(`/payments/status/${checkoutId}`),
  getPaymentHistory: (params = {}) => api.get("/payments/history", { params }),
};

export default paymentsAPI;
