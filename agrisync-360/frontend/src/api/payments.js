import API from './axios'
import { apiConfig } from './config'
import { mockPaymentsAPI } from './mockApi'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.DEV
const api = USE_MOCK ? mockPaymentsAPI : API

export const paymentsAPI = {
  getPlans: () =>
    USE_MOCK ? api.getPlans() : API.get('/payments/plans'),

  // payload = { plan: 'basic_monthly', phone: '07XXXXXXXX' }
  subscribe: (payload) =>
    USE_MOCK ? api.subscribe(payload) : API.post('/payments/subscribe', payload),

  upgrade: (plan) =>
    USE_MOCK ? api.subscribe({ plan }) : API.post('/payments/upgrade', { plan }),

  getSubscription: () =>
    USE_MOCK ? api.getSubscription() : API.get('/payments/subscription'),

  getPaymentStatus: (checkoutId) =>
    USE_MOCK ? api.verifyPayment(checkoutId) : API.get(`/payments/status/${checkoutId}`),

  getPaymentHistory: () =>
    USE_MOCK ? Promise.resolve({ data: { data: [] } }) : API.get('/payments/history'),

  // DEV ONLY — simulate M-Pesa callback completing a pending payment
  activateDev: (checkoutRequestId) =>
    USE_MOCK
      ? Promise.resolve({ data: { success: true } })
      : API.post('/payments/activate-dev', { checkout_request_id: checkoutRequestId }),
}
