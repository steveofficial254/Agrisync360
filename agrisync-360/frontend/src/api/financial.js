import API from './axios'
import { apiConfig } from './config'
import { mockFinancialAPI } from './mockApi'

const api = apiConfig.useMock ? mockFinancialAPI : API

export const financialAPI = {
  // Transactions
  listTransactions: (params) =>
    apiConfig.useMock ? api.listTransactions(params) : API.get('/financial/transactions', { params }),
  addTransaction: (data) =>
    apiConfig.useMock ? api.createTransaction(data) : API.post('/financial/transactions', data),
  getPLReport: (params) =>
    apiConfig.useMock ? Promise.resolve({ data: { data: { income: 0, expenses: 0, profit: 0 } } }) : API.get('/financial/pl-report', { params }),
  getDashboard: () =>
    apiConfig.useMock ? api.getDashboard() : API.get('/financial/dashboard'),

  // Loans
  listLoans: () =>
    apiConfig.useMock ? api.listLoans() : API.get('/financial/loans'),
  addLoan: (data) =>
    apiConfig.useMock ? api.createLoan(data) : API.post('/financial/loans', data),
  addLoanRepayment: (id, data) =>
    apiConfig.useMock ? Promise.resolve({ data: { success: true } }) : API.post(`/financial/loans/${id}/repayment`, data),

  // Insurance
  listInsurance: () =>
    apiConfig.useMock ? api.listInsurance() : API.get('/financial/insurance'),
  addInsurance: (data) =>
    apiConfig.useMock ? api.createInsurance(data) : API.post('/financial/insurance', data),

  // Budget
  listBudgets: () =>
    apiConfig.useMock ? api.listBudgets() : API.get('/financial/budgets'),
  addBudget: (data) =>
    apiConfig.useMock ? api.createBudget(data) : API.post('/financial/budgets', data),
}
