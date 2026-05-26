import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { financialAPI } from '../../api/financial'
import { toast } from 'react-hot-toast'
import { DollarSign, TrendingUp, TrendingDown, Plus } from 'lucide-react'
import Button from '../../components/common/Button'

export default function FinancialManager() {
  const { isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [transactions, setTransactions] = useState([])
  const [loans, setLoans] = useState([])
  const [insurance, setInsurance] = useState([])
  const [budgets, setBudgets] = useState([])
  const [dashboard, setDashboard] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) return
    loadData()
  }, [isAuthenticated, activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'dashboard') {
        const resp = await financialAPI.getDashboard()
        setDashboard(resp.data.data || {})
      } else if (activeTab === 'transactions') {
        const resp = await financialAPI.listTransactions()
        setTransactions(resp.data.data?.transactions || [])
      } else if (activeTab === 'loans') {
        const resp = await financialAPI.listLoans()
        setLoans(resp.data.data?.loans || [])
      } else if (activeTab === 'insurance') {
        const resp = await financialAPI.listInsurance()
        setInsurance(resp.data.data?.policies || [])
      } else if (activeTab === 'budget') {
        const resp = await financialAPI.listBudgets()
        setBudgets(resp.data.data || [])
      }
    } catch (error) {
      console.error('Load error:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: DollarSign },
    { id: 'transactions', label: 'Transactions', icon: TrendingUp },
    { id: 'loans', label: 'Loans', icon: TrendingDown },
    { id: 'insurance', label: 'Insurance', icon: Plus },
    { id: 'budget', label: 'Budget', icon: Plus },
  ]

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="max-w-6xl mx-auto pb-24 lg:pb-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">💰 Financial Manager</h1>
      
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Income (This Month)</p>
            <p className="text-2xl font-bold text-green-600">KSH {(dashboard.income_ksh || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Expenses (This Month)</p>
            <p className="text-2xl font-bold text-red-600">KSH {(dashboard.expenses_ksh || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Net Profit</p>
            <p className="text-2xl font-bold text-gray-900">KSH {(dashboard.net_profit_ksh || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Active Loans</p>
            <p className="text-2xl font-bold text-gray-900">{dashboard.active_loans_count || 0}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Outstanding Debt</p>
            <p className="text-2xl font-bold text-orange-600">KSH {(dashboard.total_outstanding_ksh || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Insurance Policies</p>
            <p className="text-2xl font-bold text-gray-900">{dashboard.active_policies_count || 0}</p>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-bold text-gray-900">Transactions</h2>
            <Button size="sm" leftIcon={<Plus size={14} />}>Add Transaction</Button>
          </div>
          <div className="divide-y divide-gray-100">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No transactions yet</div>
            ) : (
              transactions.map(tx => (
                <div key={tx.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">{tx.description || tx.category}</p>
                    <p className="text-sm text-gray-500">{tx.transaction_date}</p>
                  </div>
                  <p className={`font-bold ${tx.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.transaction_type === 'income' ? '+' : '-'}KSH {tx.amount_ksh.toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'loans' && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-bold text-gray-900">Loans</h2>
            <Button size="sm" leftIcon={<Plus size={14} />}>Add Loan</Button>
          </div>
          <div className="divide-y divide-gray-100">
            {loans.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No loans recorded</div>
            ) : (
              loans.map(loan => (
                <div key={loan.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{loan.lender_name}</p>
                      <p className="text-sm text-gray-500">{loan.lender_type}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${loan.is_overdue ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {loan.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-500">Principal:</span> KSH {loan.principal_ksh.toLocaleString()}</div>
                    <div><span className="text-gray-500">Outstanding:</span> KSH {loan.outstanding_ksh.toLocaleString()}</div>
                    <div><span className="text-gray-500">Repaid:</span> {loan.repayment_percent.toFixed(1)}%</div>
                    <div><span className="text-gray-500">Due:</span> {loan.due_date}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'insurance' && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-bold text-gray-900">Insurance Policies</h2>
            <Button size="sm" leftIcon={<Plus size={14} />}>Add Policy</Button>
          </div>
          <div className="divide-y divide-gray-100">
            {insurance.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No insurance policies</div>
            ) : (
              insurance.map(policy => (
                <div key={policy.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{policy.provider_name}</p>
                      <p className="text-sm text-gray-500">{policy.insurance_type}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${policy.days_to_expiry < 30 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {policy.days_to_expiry} days left
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">Coverage: KSH {(policy.coverage_amount_ksh || 0).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'budget' && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-bold text-gray-900">Season Budgets</h2>
            <Button size="sm" leftIcon={<Plus size={14} />}>Add Budget</Button>
          </div>
          <div className="divide-y divide-gray-100">
            {budgets.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No budgets created</div>
            ) : (
              budgets.map(budget => (
                <div key={budget.id} className="p-4">
                  <p className="font-semibold text-gray-900">{budget.season_name} - {budget.crop_name}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                    <div><span className="text-gray-500">Planned Cost:</span> KSH {budget.planned_total_cost.toLocaleString()}</div>
                    <div><span className="text-gray-500">Expected Profit:</span> KSH {budget.planned_profit.toLocaleString()}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
