import API from './axios'

export const financialAPI = {
  // Transactions
  listTransactions: (params) => API.get('/financial/transactions', { params }),
  addTransaction: (data) => API.post('/financial/transactions', data),
  getPLReport: (params) => API.get('/financial/pl-report', { params }),
  getDashboard: () => API.get('/financial/dashboard'),

  // Loans
  listLoans: () => API.get('/financial/loans'),
  addLoan: (data) => API.post('/financial/loans', data),
  addLoanRepayment: (id, data) => API.post(`/financial/loans/${id}/repayment`, data),

  // Insurance
  listInsurance: () => API.get('/financial/insurance'),
  addInsurance: (data) => API.post('/financial/insurance', data),

  // Budget
  listBudgets: () => API.get('/financial/budgets'),
  addBudget: (data) => API.post('/financial/budgets', data),
}
