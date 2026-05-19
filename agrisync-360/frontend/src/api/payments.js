import API from './axios'

export const paymentsAPI = {
  getPlans: () =>
    API.get('/payments/plans'),

  // payload = { plan: 'basic_monthly', phone: '07XXXXXXXX' }
  subscribe: (payload) =>
    API.post('/payments/subscribe', payload),

  upgrade: (plan) =>
    API.post('/payments/upgrade', { plan }),

  getSubscription: () =>
    API.get('/payments/subscription'),

  getPaymentStatus: (checkoutId) =>
    API.get(`/payments/status/${checkoutId}`),

  getPaymentHistory: () =>
    API.get('/payments/history'),

  // DEV ONLY — simulate M-Pesa callback completing a pending payment
  activateDev: (checkoutRequestId) =>
    API.post('/payments/activate-dev', { checkout_request_id: checkoutRequestId }),
}
