/**
 * Mock API Layer for Farmer Dashboard
 * This file provides mock implementations of all API calls
 * to enable development without backend dependencies.
 */

import {
  mockFarmerProfile,
  mockFarms,
  mockCrops,
  mockWeatherData,
  mockMarketPrices,
  mockMarketTrends,
  mockAdvisories,
  mockPlantingCalendar,
  mockSubscription,
  mockPlans,
  mockFinancialDashboard,
  mockTransactions,
  mockLoans,
  mockInsurance,
  mockBudgets,
  mockCalendarEntries,
  mockProfitability
} from '../data/mockFarmerData'

// Simulate network delay for realistic feel
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms))

// Farmers API
export const mockFarmersAPI = {
  getProfile: async () => {
    await delay()
    return { data: { data: mockFarmerProfile } }
  },
  
  updateProfile: async (data) => {
    await delay()
    return { data: { data: { ...mockFarmerProfile, ...data } } }
  },
  
  listFarms: async () => {
    await delay()
    return { data: { data: mockFarms } }
  },
  
  createFarm: async (farmData) => {
    await delay()
    const newFarm = {
      id: `farm-${Date.now()}`,
      ...farmData,
      created_at: new Date().toISOString()
    }
    return { data: { data: newFarm } }
  },
  
  updateFarm: async (farmId, farmData) => {
    await delay()
    return { data: { data: { ...mockFarms.find(f => f.id === farmId), ...farmData } } }
  },
  
  deleteFarm: async (farmId) => {
    await delay()
    return { data: { success: true } }
  },
  
  listCrops: async (farmId) => {
    await delay()
    const farmCrops = farmId 
      ? mockCrops.filter(c => c.farm_id === farmId)
      : mockCrops
    return { data: { data: farmCrops } }
  },
  
  createCrop: async (farmId, cropData) => {
    await delay()
    const newCrop = {
      id: `crop-${Date.now()}`,
      farm_id: farmId,
      farm_name: mockFarms.find(f => f.id === farmId)?.name || 'Unknown Farm',
      ...cropData,
      crop_type: cropData.crop_type || cropData.crop_name, // Ensure crop_type is set
      status: 'growing',
      progress_percent: 0,
      created_at: new Date().toISOString()
    }
    return { data: { data: newCrop } }
  },
  
  updateCrop: async (cropId, cropData) => {
    await delay()
    return { data: { data: { ...mockCrops.find(c => c.id === cropId), ...cropData } } }
  },
  
  deleteCrop: async (cropId) => {
    await delay()
    return { data: { success: true } }
  }
}

// Weather API
export const mockWeatherAPI = {
  getForecast: async (lat, lon, days = 7) => {
    await delay()
    return { 
      data: { 
        success: true, 
        data: {
          ...mockWeatherData,
          forecast: mockWeatherData.forecast.slice(0, days)
        }
      } 
    }
  }
}

// Market API
export const mockMarketAPI = {
  getPrices: async (filters = {}) => {
    await delay()
    let prices = [...mockMarketPrices]
    
    if (filters.crop && filters.crop !== 'all') {
      prices = prices.filter(p => p.crop_name === filters.crop)
    }
    if (filters.county && filters.county !== 'all') {
      prices = prices.filter(p => p.county === filters.county)
    }
    
    return { data: { data: prices } }
  },
  
  getTrends: async (crop, months = 3) => {
    await delay()
    return { 
      data: { 
        data: {
          ...mockMarketTrends,
          crop
        }
      } 
    }
  },
  
  calculateProfitability: async (params) => {
    await delay()
    return { 
      data: { 
        data: {
          ...mockProfitability,
          ...params
        }
      } 
    }
  }
}

// Advisory API
export const mockAdvisoryAPI = {
  getMyCropsAdvisory: async () => {
    await delay()
    return { data: { data: mockAdvisories } }
  },
  
  getAll: async (filters = {}) => {
    await delay()
    let advisories = [...mockAdvisories]
    
    if (filters.crop) {
      advisories = advisories.filter(a => a.crop_name === filters.crop)
    }
    if (filters.type) {
      advisories = advisories.filter(a => a.type === filters.type)
    }
    if (filters.severity) {
      advisories = advisories.filter(a => a.severity === filters.severity)
    }
    
    return { data: { data: advisories } }
  },
  
  getCalendar: async (crop) => {
    await delay()
    // Return the weeks array directly as expected by Advisory component
    return { 
      data: { 
        data: mockPlantingCalendar.weeks || []
      } 
    }
  }
}

// Payments API
export const mockPaymentsAPI = {
  getSubscription: async () => {
    await delay()
    return { data: { data: mockSubscription } }
  },
  
  getPlans: async () => {
    await delay()
    return { data: { data: mockPlans } }
  },
  
  subscribe: async (params) => {
    await delay(1000) // Simulate payment processing
    return { 
      data: { 
        data: {
          checkout_request_id: `ws_CO_${Date.now()}`,
          merchant_request_id: `merchant-${Date.now()}`,
          response_code: '0',
          response_message: 'Success. Request accepted for processing',
          response_description: 'The payment request has been accepted successfully'
        }
      } 
    }
  },
  
  verifyPayment: async (checkoutId) => {
    await delay()
    return { 
      data: { 
        data: {
          checkout_request_id: checkoutId,
          status: 'completed',
          amount: 299,
          phone: params.phone
        }
      } 
    }
  }
}

// Financial API
export const mockFinancialAPI = {
  getDashboard: async (period) => {
    await delay()
    return { 
      data: { 
        data: {
          ...mockFinancialDashboard,
          period: period || mockFinancialDashboard.period
        }
      } 
    }
  },
  
  listTransactions: async (filters = {}) => {
    await delay()
    let transactions = [...mockTransactions]
    
    if (filters.type) {
      transactions = transactions.filter(t => t.transaction_type === filters.type)
    }
    if (filters.category) {
      transactions = transactions.filter(t => t.category === filters.category)
    }
    
    return { data: { data: { transactions } } }
  },
  
  createTransaction: async (transactionData) => {
    await delay()
    const newTransaction = {
      id: `tx-${Date.now()}`,
      ...transactionData,
      created_at: new Date().toISOString()
    }
    return { data: { data: newTransaction } }
  },
  
  listLoans: async () => {
    await delay()
    return { data: { data: { loans: mockLoans } } }
  },
  
  createLoan: async (loanData) => {
    await delay()
    const newLoan = {
      id: `loan-${Date.now()}`,
      ...loanData,
      status: 'pending',
      repayment_percent: 0,
      created_at: new Date().toISOString()
    }
    return { data: { data: newLoan } }
  },
  
  listInsurance: async () => {
    await delay()
    return { data: { data: { policies: mockInsurance } } }
  },
  
  createInsurance: async (policyData) => {
    await delay()
    const newPolicy = {
      id: `ins-${Date.now()}`,
      ...policyData,
      status: 'active',
      created_at: new Date().toISOString()
    }
    return { data: { data: newPolicy } }
  },
  
  listBudgets: async () => {
    await delay()
    return { data: { data: mockBudgets } }
  },
  
  createBudget: async (budgetData) => {
    await delay()
    const newBudget = {
      id: `budget-${Date.now()}`,
      ...budgetData,
      status: 'planned',
      created_at: new Date().toISOString()
    }
    return { data: { data: newBudget } }
  }
}

// Farm Intel API (Planting Calendar)
export const mockFarmIntelAPI = {
  getCalendar: async (filters = {}) => {
    await delay()
    let entries = [...mockCalendarEntries]
    
    if (filters.crop) {
      entries = entries.filter(e => e.crop_name === filters.crop)
    }
    if (filters.status) {
      entries = entries.filter(e => e.status === filters.status)
    }
    
    // Return with entries key as expected by PlantingCalendar component
    return { data: { data: { entries } } }
  },
  
  createCalendarEntry: async (entryData) => {
    await delay()
    const newEntry = {
      id: `cal-${Date.now()}`,
      ...entryData,
      crop_type: entryData.crop_type || entryData.crop_name, // Ensure crop_type is set
      status: 'planned',
      created_at: new Date().toISOString()
    }
    return { data: { data: newEntry } }
  },
  
  updateCalendarEntry: async (entryId, entryData) => {
    await delay()
    return { 
      data: { 
        data: { 
          ...mockCalendarEntries.find(e => e.id === entryId), 
          ...entryData 
        } 
      } 
    }
  },
  
  deleteCalendarEntry: async (entryId) => {
    await delay()
    return { data: { success: true } }
  }
}

// Auth API
export const mockAuthAPI = {
  login: async (credentials) => {
    await delay()
    // Simulate different users based on email or phone
    const email = credentials.email || ''
    const phone = credentials.phone || ''
    const identifier = email || phone || ''
    let user

    // Check for role based on email or phone patterns
    if (identifier.includes('admin') || identifier.includes('777000001') || identifier.includes('0777000001')) {
      user = {
        id: 'admin-001',
        email: 'admin@agrisync.com',
        phone: '0777000001',
        role: 'admin',
        name: 'Admin User'
      }
    } else if (identifier.includes('dealer') || identifier.includes('agro') || identifier.includes('777000002') || identifier.includes('0777000002')) {
      user = {
        id: 'dealer-001',
        email: 'dealer@agrisync.com',
        phone: '0777000002',
        role: 'agro_dealer',
        name: 'Agro Dealer',
        business_name: 'Green Agro Supplies'
      }
    } else if (identifier.includes('ngo') || identifier.includes('777000003') || identifier.includes('0777000003')) {
      user = {
        id: 'ngo-001',
        email: 'ngo@agrisync.com',
        phone: '0777000003',
        role: 'ngo_partner',
        name: 'NGO Partner',
        organization: 'Agricultural Development NGO'
      }
    } else {
      // Default to farmer
      user = mockFarmerProfile
    }

    return {
      data: {
        success: true,
        data: {
          user,
          access_token: 'mock-jwt-token-' + Date.now(),
          refresh_token: 'mock-refresh-token-' + Date.now()
        }
      }
    }
  },

  register: async (userData) => {
    await delay()
    return {
      data: {
        success: true,
        data: {
          user: {
            ...mockFarmerProfile,
            ...userData,
            id: `user-${Date.now()}`
          },
          access_token: 'mock-jwt-token-' + Date.now(),
          refresh_token: 'mock-refresh-token-' + Date.now()
        }
      }
    }
  },

  logout: async () => {
    await delay()
    return { data: { success: true } }
  },

  verifyOTP: async (data) => {
    await delay()
    return { data: { success: true } }
  },

  forgotPassword: async (data) => {
    await delay()
    return { data: { success: true } }
  },

  verifyResetOTP: async (data) => {
    await delay()
    return { data: { success: true } }
  },

  resetPassword: async (data) => {
    await delay()
    return { data: { success: true } }
  },

  resendOTP: async (data) => {
    await delay()
    return { data: { success: true } }
  },

  changePassword: async (passwordData) => {
    await delay()
    return { data: { success: true } }
  }
}

// Admin API
export const mockAdminAPI = {
  // Dashboard stats
  getStats: async () => {
    await delay()
    return {
      data: {
        success: true,
        data: {
          farmers: {
            total: 1250,
            active: 980,
            change: 12.5
          },
          farms: {
            total: 2100,
            change: 8.3
          },
          crops: {
            total: 4500,
            change: 15.2
          },
          subscriptions: {
            active: 650,
            change: 15.5,
            revenue_this_month_ksh: 450000
          },
          sms: {
            sent_today: 1250,
            change: 22.1
          }
        }
      }
    }
  },

  // Revenue data
  getRevenue: async () => {
    await delay()
    return {
      data: {
        success: true,
        data: {
          monthly: [
            { month: 'Jan', revenue: 320000 },
            { month: 'Feb', revenue: 380000 },
            { month: 'Mar', revenue: 410000 },
            { month: 'Apr', revenue: 390000 },
            { month: 'May', revenue: 450000 },
            { month: 'Jun', revenue: 480000 }
          ],
          by_plan: {
            basic: 150000,
            standard: 200000,
            premium: 130000
          }
        }
      }
    }
  },

  // Top counties
  getTopCounties: async () => {
    await delay()
    return {
      data: {
        success: true,
        data: [
          { county: 'Nakuru', farmers: 245, revenue: 85000 },
          { county: 'Kiambu', farmers: 198, revenue: 72000 },
          { county: 'Meru', farmers: 176, revenue: 68000 },
          { county: 'Bungoma', farmers: 154, revenue: 55000 },
          { county: 'Kisii', farmers: 142, revenue: 48000 }
        ]
      }
    }
  },

  // Top crops
  getTopCrops: async () => {
    await delay()
    return {
      data: {
        success: true,
        data: [
          { crop: 'Maize', count: 680, percentage: 35 },
          { crop: 'Beans', count: 420, percentage: 22 },
          { crop: 'Potatoes', count: 380, percentage: 18 },
          { crop: 'Tomatoes', count: 290, percentage: 15 },
          { crop: 'Kale', count: 180, percentage: 10 }
        ]
      }
    }
  },

  // Recent farmers
  getRecentFarmers: async () => {
    await delay()
    return {
      data: {
        success: true,
        data: [
          {
            id: 'farmer-001',
            name: 'John Kamau',
            email: 'john@example.com',
            phone: '0722123456',
            county: 'Nakuru',
            farms: 2,
            crops: 5,
            joined_date: '2024-06-10',
            status: 'active'
          },
          {
            id: 'farmer-002',
            name: 'Mary Wanjiku',
            email: 'mary@example.com',
            phone: '0733123456',
            county: 'Kiambu',
            farms: 1,
            crops: 3,
            joined_date: '2024-06-09',
            status: 'active'
          },
          {
            id: 'farmer-003',
            name: 'Peter Ochieng',
            email: 'peter@example.com',
            phone: '0744123456',
            county: 'Kisumu',
            farms: 3,
            crops: 7,
            joined_date: '2024-06-08',
            status: 'pending'
          }
        ]
      }
    }
  },

  // System health
  getSystemHealth: async () => {
    await delay()
    return {
      data: {
        success: true,
        data: {
          api_status: 'healthy',
          database_status: 'healthy',
          cache_status: 'healthy',
          uptime: '99.9%',
          response_time: '120ms',
          error_rate: '0.1%'
        }
      }
    }
  },

  // Send bulk alert
  sendBulkAlert: async (data) => {
    await delay()
    return { data: { success: true, message: 'Alert sent successfully' } }
  },

  // Farmer management
  getFarmers: async (params) => {
    await delay()
    return {
      data: {
        success: true,
        data: {
          farmers: [
            {
              id: 'farmer-001',
              name: 'John Kamau',
              email: 'john@example.com',
              phone: '0722123456',
              county: 'Nakuru',
              sub_county: 'Nakuru West',
              farms: 2,
              crops: 5,
              subscription: 'premium',
              status: 'active',
              joined_date: '2024-01-15'
            },
            {
              id: 'farmer-002',
              name: 'Mary Wanjiku',
              email: 'mary@example.com',
              phone: '0733123456',
              county: 'Kiambu',
              sub_county: 'Kiambu East',
              farms: 1,
              crops: 3,
              subscription: 'standard',
              status: 'active',
              joined_date: '2024-02-20'
            },
            {
              id: 'farmer-003',
              name: 'Peter Ochieng',
              email: 'peter@example.com',
              phone: '0744123456',
              county: 'Kisumu',
              sub_county: 'Kisumu Central',
              farms: 3,
              crops: 7,
              subscription: 'basic',
              status: 'pending',
              joined_date: '2024-03-10'
            }
          ],
          total: 3,
          page: 1,
          per_page: 20
        }
      }
    }
  },

  getFarmerDetails: async (id) => {
    await delay()
    return {
      data: {
        success: true,
        data: {
          id,
          name: 'John Kamau',
          email: 'john@example.com',
          phone: '0722123456',
          county: 'Nakuru',
          sub_county: 'Nakuru West',
          farms: [
            { id: 'farm-001', name: 'Main Farm', size_acres: 5, crops: ['maize', 'beans'] },
            { id: 'farm-002', name: 'Secondary Farm', size_acres: 3, crops: ['potatoes'] }
          ],
          subscription: 'premium',
          status: 'active',
          joined_date: '2024-01-15'
        }
      }
    }
  },

  sendBulkSMS: async (data) => {
    await delay()
    return { data: { success: true, message: 'SMS sent successfully' } }
  },

  exportFarmers: async (params) => {
    await delay()
    return { data: { success: true, message: 'Export initiated' } }
  },

  // User management
  updateUserStatus: async (id, status) => {
    await delay()
    return { data: { success: true, message: 'User status updated' } }
  },

  deleteUser: async (id) => {
    await delay()
    return { data: { success: true, message: 'User deleted' } }
  },

  // Analytics
  getAnalytics: async (params) => {
    await delay()
    return {
      data: {
        success: true,
        data: {
          user_growth: [
            { month: 'Jan', users: 100 },
            { month: 'Feb', users: 150 },
            { month: 'Mar', users: 220 },
            { month: 'Apr', users: 310 },
            { month: 'May', users: 420 },
            { month: 'Jun', users: 550 }
          ],
          revenue_by_county: [
            { county: 'Nakuru', revenue: 85000 },
            { county: 'Kiambu', revenue: 72000 },
            { county: 'Meru', revenue: 68000 }
          ]
        }
      }
    }
  },

  getReports: async (params) => {
    await delay()
    return {
      data: {
        success: true,
        data: []
      }
    }
  },

  // Settings
  getSettings: async () => {
    await delay()
    return {
      data: {
        success: true,
        data: {
          site_name: 'AgriSync 360',
          maintenance_mode: false,
          max_farms_per_farmer: 10,
          subscription_plans: ['basic', 'standard', 'premium']
        }
      }
    }
  },

  updateSettings: async (data) => {
    await delay()
    return { data: { success: true, message: 'Settings updated' } }
  },

  // Notifications
  getNotifications: async () => {
    await delay()
    return {
      data: {
        success: true,
        data: []
      }
    }
  },

  markNotificationRead: async (id) => {
    await delay()
    return { data: { success: true } }
  },

  // Audit logs
  getAuditLogs: async (params) => {
    await delay()
    return {
      data: {
        success: true,
        data: []
      }
    }
  },

  // Alerts
  alerts: {
    sendBulk: async (data) => {
      await delay()
      return { data: { success: true, message: 'Bulk alert sent' } }
    },
    schedule: async (data) => {
      await delay()
      return { data: { success: true, message: 'Alert scheduled' } }
    },
    getFarmerHistory: async (farmerId) => {
      await delay()
      return { data: { success: true, data: [] } }
    },
    triggerWeatherAlert: async (data) => {
      await delay()
      return { data: { success: true, message: 'Weather alert triggered' } }
    },
    getAll: async (params) => {
      await delay()
      return { data: { success: true, data: [] } }
    },
    getById: async (id) => {
      await delay()
      return { data: { success: true, data: {} } }
    },
    updateStatus: async (id, status) => {
      await delay()
      return { data: { success: true } }
    },
    delete: async (id) => {
      await delay()
      return { data: { success: true } }
    },
    getTriggers: async () => {
      await delay()
      return { data: { success: true, data: [] } }
    },
    configureTrigger: async (type, config) => {
      await delay()
      return { data: { success: true } }
    },
    getStats: async (params) => {
      await delay()
      return { data: { success: true, data: {} } }
    }
  }
}

// Dealer API
export const mockDealerAPI = {
  // Dashboard stats
  getStats: async () => {
    await delay()
    return {
      data: {
        success: true,
        data: {
          total_products: 150,
          active_products: 120,
          connected_farmers: 450,
          pending_orders: 25,
          revenue_this_month: 280000,
          revenue_growth: 18.5,
          total_orders: 1250,
          average_rating: 4.5
        }
      }
    }
  },

  // Product management
  getProducts: async () => {
    await delay()
    return {
      data: {
        success: true,
        data: [
          { id: 'prod-001', name: 'Maize Seeds H614', category: 'seeds', price: 4500, stock: 500, unit: 'bag' },
          { id: 'prod-002', name: 'NPK Fertilizer', category: 'fertilizer', price: 3200, stock: 300, unit: 'bag' },
          { id: 'prod-003', name: 'DAP Fertilizer', category: 'fertilizer', price: 3800, stock: 250, unit: 'bag' },
          { id: 'prod-004', name: 'Bean Seeds', category: 'seeds', price: 2800, stock: 400, unit: 'bag' },
          { id: 'prod-005', name: 'Pesticide', category: 'pesticide', price: 1500, stock: 200, unit: 'liter' }
        ]
      }
    }
  },

  createProduct: async (data) => {
    await delay()
    return { data: { success: true, message: 'Product created successfully' } }
  },

  updateProduct: async (id, data) => {
    await delay()
    return { data: { success: true, message: 'Product updated successfully' } }
  },

  deleteProduct: async (id) => {
    await delay()
    return { data: { success: true, message: 'Product deleted successfully' } }
  },

  // Farmer connections
  getConnectedFarmers: async () => {
    await delay()
    return {
      data: {
        success: true,
        data: [
          { id: 'farmer-001', name: 'John Kamau', phone: '0722123456', county: 'Nakuru', connected_date: '2024-01-15' },
          { id: 'farmer-002', name: 'Mary Wanjiku', phone: '0733123456', county: 'Kiambu', connected_date: '2024-02-20' },
          { id: 'farmer-003', name: 'Peter Ochieng', phone: '0744123456', county: 'Kisumu', connected_date: '2024-03-10' }
        ]
      }
    }
  },

  connectWithFarmer: async (farmerId) => {
    await delay()
    return { data: { success: true, message: 'Farmer connected successfully' } }
  },

  disconnectFarmer: async (farmerId) => {
    await delay()
    return { data: { success: true, message: 'Farmer disconnected successfully' } }
  },

  // Broadcast messages
  getBroadcasts: async () => {
    await delay()
    return {
      data: {
        success: true,
        data: [
          { id: 'broadcast-001', message: 'New maize seeds available!', sent_date: '2024-06-10', recipients: 150 },
          { id: 'broadcast-002', message: 'Fertilizer discount this week', sent_date: '2024-06-08', recipients: 200 }
        ]
      }
    }
  },

  createBroadcast: async (data) => {
    await delay()
    return { data: { success: true, message: 'Broadcast created successfully' } }
  },

  deleteBroadcast: async (id) => {
    await delay()
    return { data: { success: true, message: 'Broadcast deleted successfully' } }
  },

  // Orders
  getOrders: async () => {
    await delay()
    return {
      data: {
        success: true,
        data: [
          { id: 'order-001', farmer: 'John Kamau', products: 'Maize Seeds', amount: 45000, status: 'pending', date: '2024-06-15' },
          { id: 'order-002', farmer: 'Mary Wanjiku', products: 'NPK Fertilizer', amount: 32000, status: 'completed', date: '2024-06-14' },
          { id: 'order-003', farmer: 'Peter Ochieng', products: 'Bean Seeds', amount: 28000, status: 'pending', date: '2024-06-13' }
        ]
      }
    }
  },

  updateOrderStatus: async (id, status) => {
    await delay()
    return { data: { success: true, message: 'Order status updated' } }
  },

  // Analytics
  getAnalytics: async () => {
    await delay()
    return {
      data: {
        success: true,
        data: {
          sales_by_month: [
            { month: 'Jan', sales: 180000 },
            { month: 'Feb', sales: 220000 },
            { month: 'Mar', sales: 250000 },
            { month: 'Apr', sales: 230000 },
            { month: 'May', sales: 280000 },
            { month: 'Jun', sales: 310000 }
          ],
          top_products: [
            { product: 'Maize Seeds', sales: 45000, units: 10 },
            { product: 'NPK Fertilizer', sales: 38000, units: 12 },
            { product: 'Bean Seeds', sales: 28000, units: 10 }
          ]
        }
      }
    }
  },

  getSalesReport: async (params) => {
    await delay()
    return {
      data: {
        success: true,
        data: []
      }
    }
  },

  // Profile management
  getProfile: async () => {
    await delay()
    return {
      data: {
        success: true,
        data: {
          id: 'dealer-001',
          name: 'Green Agro Supplies',
          email: 'dealer@agrisync.com',
          phone: '+254700000002',
          business_name: 'Green Agro Supplies',
          location: 'Nakuru',
          description: 'Quality agricultural inputs for farmers'
        }
      }
    }
  },

  updateProfile: async (data) => {
    await delay()
    return { data: { success: true, message: 'Profile updated successfully' } }
  },

  // Inventory
  getInventory: async () => {
    await delay()
    return {
      data: {
        success: true,
        data: [
          { id: 'inv-001', product: 'Maize Seeds', quantity: 500, unit: 'bag', reorder_level: 100 },
          { id: 'inv-002', product: 'NPK Fertilizer', quantity: 300, unit: 'bag', reorder_level: 50 },
          { id: 'inv-003', product: 'DAP Fertilizer', quantity: 250, unit: 'bag', reorder_level: 50 }
        ]
      }
    }
  },

  updateInventory: async (id, data) => {
    await delay()
    return { data: { success: true, message: 'Inventory updated successfully' } }
  },

  // Reviews
  getReviews: async () => {
    await delay()
    return {
      data: {
        success: true,
        data: [
          { id: 'review-001', farmer: 'John Kamau', rating: 5, comment: 'Great products!', date: '2024-06-10' },
          { id: 'review-002', farmer: 'Mary Wanjiku', rating: 4, comment: 'Good quality seeds', date: '2024-06-08' }
        ]
      }
    }
  },

  respondToReview: async (id, response) => {
    await delay()
    return { data: { success: true, message: 'Response sent successfully' } }
  },

  // Alerts
  alerts: {
    sendProductAlert: async (data) => {
      await delay()
      return { data: { success: true, message: 'Product alert sent' } }
    },
    schedulePromotion: async (data) => {
      await delay()
      return { data: { success: true, message: 'Promotion scheduled' } }
    },
    getFarmerHistory: async (farmerId) => {
      await delay()
      return { data: { success: true, data: [] } }
    },
    triggerWeatherProductAlert: async (data) => {
      await delay()
      return { data: { success: true, message: 'Weather product alert triggered' } }
    },
    getAll: async (params) => {
      await delay()
      return { data: { success: true, data: [] } }
    },
    getById: async (id) => {
      await delay()
      return { data: { success: true, data: {} } }
    },
    updateStatus: async (id, status) => {
      await delay()
      return { data: { success: true } }
    },
    delete: async (id) => {
      await delay()
      return { data: { success: true } }
    },
    getTriggers: async () => {
      await delay()
      return { data: { success: true, data: [] } }
    },
    configureTrigger: async (type, config) => {
      await delay()
      return { data: { success: true } }
    },
    getStats: async (params) => {
      await delay()
      return { data: { success: true, data: {} } }
    },
    sendBroadcastSMS: async (data) => {
      await delay()
      return { data: { success: true, message: 'Broadcast SMS sent' } }
    },
    getSMSReports: async (params) => {
      await delay()
      return { data: { success: true, data: [] } }
    },
    schedulePromotionalSMS: async (data) => {
      await delay()
      return { data: { success: true, message: 'Promotional SMS scheduled' } }
    }
  }
}

// NGO API
export const mockNGOAPI = {
  // Dashboard data
  getDashboard: async () => {
    await delay()
    return {
      data: {
        success: true,
        data: {
          impact: {
            registered_count: 2100,
            registered_target: 5000,
            score: 85,
            counties_covered: 12,
            crops_covered: 8
          },
          total_farmers: 2500,
          active_batches: 15,
          trainings_completed: 45,
          sms_sent_this_month: 15000,
          budget_utilization: 72
        }
      }
    }
  },

  getStats: async () => {
    await delay()
    return {
      data: {
        success: true,
        data: {
          active_farmers: 2100,
          advisories_delivered: 15000,
          trainings_completed: 37,
          trainings_conducted: 45,
          registered_this_month: 150,
          sms_delivery_rate: 98.5
        }
      }
    }
  },

  // Farmer management
  getFarmers: async (params) => {
    await delay()
    return {
      data: {
        success: true,
        data: [
          { id: 'farmer-001', name: 'John Kamau', phone: '0722123456', county: 'Nakuru', farms_count: 2, subscription: 'pro', joined_at: '2024-01-15' },
          { id: 'farmer-002', name: 'Mary Wanjiku', phone: '0733123456', county: 'Kiambu', farms_count: 3, subscription: 'basic', joined_at: '2024-02-20' },
          { id: 'farmer-003', name: 'Peter Ochieng', phone: '0744123456', county: 'Kisumu', farms_count: 1, subscription: 'free', joined_at: '2024-03-10' }
        ]
      }
    }
  },

  registerFarmer: async (data) => {
    await delay()
    return { data: { success: true, message: 'Farmer registered successfully' } }
  },

  updateFarmer: async (id, data) => {
    await delay()
    return { data: { success: true, message: 'Farmer updated successfully' } }
  },

  exportFarmersCSV: async () => {
    await delay()
    return {
      data: {
        success: true,
        data: {
          url: 'data:text/csv;charset=utf-8,Name,Phone,County,Farms,Subscription,Joined\nJohn Kamau,0722123456,Nakuru,2,pro,2024-01-15\nMary Wanjiku,0733123456,Kiambu,3,basic,2024-02-20\nPeter Ochieng,0744123456,Kisumu,1,free,2024-03-10',
          filename: 'farmers_export.csv'
        }
      }
    }
  },

  // Batch management
  getBatches: async () => {
    await delay()
    return {
      data: {
        success: true,
        data: [
          { id: 'batch-001', batch_name: 'Maize Farmers Nakuru', county: 'Nakuru', farmer_count: 150, created_at: '2024-01-01', status: 'active', processed: 120 },
          { id: 'batch-002', batch_name: 'Bean Farmers Kiambu', county: 'Kiambu', farmer_count: 120, created_at: '2024-02-01', status: 'active', processed: 95 },
          { id: 'batch-003', batch_name: 'Vegetable Farmers Kisumu', county: 'Kisumu', farmer_count: 80, created_at: '2024-03-01', status: 'completed', processed: 80 }
        ]
      }
    }
  },

  createBatch: async (data) => {
    await delay()
    const newBatch = {
      id: `batch-${Date.now()}`,
      batch_name: data.batch_name,
      county: data.county,
      farmer_count: data.farmers?.length || 0,
      created_at: new Date().toISOString().split('T')[0],
      status: 'active',
      processed: 0
    }
    return { data: { success: true, message: 'Batch created successfully', data: newBatch } }
  },

  updateBatch: async (id, data) => {
    await delay()
    return { data: { success: true, message: 'Batch updated successfully' } }
  },

  deleteBatch: async (id) => {
    await delay()
    return { data: { success: true, message: 'Batch deleted successfully', data: { id } } }
  },

  getBatchDetails: async (id) => {
    await delay()
    return {
      data: {
        success: true,
        data: {
          id,
          name: 'Maize Farmers Nakuru',
          farmers_count: 150,
          start_date: '2024-01-01',
          status: 'active',
          trainings_completed: 5,
          sms_sent: 2500
        }
      }
    }
  },

  getBatchStatus: async (id) => {
    await delay()
    return {
      data: {
        success: true,
        data: {
          id,
          status: 'processing',
          processed: 120,
          total: 150,
          percentage: 80
        }
      }
    }
  },

  // SMS campaigns
  sendBulkSMS: async (data) => {
    await delay()
    return { data: { success: true, message: 'SMS sent successfully' } }
  },

  sendAdvisorySMS: async (data) => {
    await delay()
    return { data: { success: true, message: 'Advisory SMS sent successfully' } }
  },

  getSMSHistory: async () => {
    await delay()
    return {
      data: {
        success: true,
        data: [
          { id: 'sms-001', message: 'Weather alert', recipients: 150, sent_date: '2024-06-10', status: 'delivered' },
          { id: 'sms-002', message: 'Training reminder', recipients: 120, sent_date: '2024-06-08', status: 'delivered' }
        ]
      }
    }
  },

  getSMSStats: async () => {
    await delay()
    return {
      data: {
        success: true,
        data: {
          sent_today: 520,
          sent_this_month: 15000,
          delivery_rate: 98.5,
          failed: 225
        }
      }
    }
  },

  // Market data
  getMarketPrices: async () => {
    await delay()
    return {
      data: {
        success: true,
        data: [
          { crop: 'Maize', price: 4500, unit: '90kg bag', change: 5.2 },
          { crop: 'Beans', price: 6800, unit: '90kg bag', change: -2.1 },
          { crop: 'Potatoes', price: 3200, unit: '50kg bag', change: 3.8 }
        ]
      }
    }
  },

  getMarketTrends: async () => {
    await delay()
    return {
      data: {
        success: true,
        data: {
          monthly: [
            { month: 'Jan', price: 4200 },
            { month: 'Feb', price: 4350 },
            { month: 'Mar', price: 4400 },
            { month: 'Apr', price: 4500 },
            { month: 'May', price: 4450 },
            { month: 'Jun', price: 4500 }
          ]
        }
      }
    }
  },

  // Training management
  getTrainings: async () => {
    await delay()
    return {
      data: {
        success: true,
        data: [
          { id: 'training-001', title: 'Maize Farming Best Practices', date: '2024-06-20', attendees: 45, status: 'upcoming' },
          { id: 'training-002', title: 'Pest Management', date: '2024-06-15', attendees: 38, status: 'completed' },
          { id: 'training-003', title: 'Soil Health', date: '2024-06-25', attendees: 50, status: 'upcoming' }
        ]
      }
    }
  },

  createTraining: async (data) => {
    await delay()
    return { data: { success: true, message: 'Training created successfully' } }
  },

  updateTraining: async (id, data) => {
    await delay()
    return { data: { success: true, message: 'Training updated successfully' } }
  },

  deleteTraining: async (id) => {
    await delay()
    return { data: { success: true, message: 'Training deleted successfully' } }
  },

  // Reports
  getImpactReport: async (params) => {
    await delay()
    return {
      data: {
        success: true,
        data: {}
      }
    }
  },

  getFarmerReport: async (params) => {
    await delay()
    return {
      data: {
        success: true,
        data: []
      }
    }
  },

  getBatchReport: async (params) => {
    await delay()
    return {
      data: {
        success: true,
        data: []
      }
    }
  },

  // Analytics
  getAnalytics: async () => {
    await delay()
    return {
      data: {
        success: true,
        data: {
          farmer_growth: [
            { month: 'Jan', count: 200 },
            { month: 'Feb', count: 350 },
            { month: 'Mar', count: 500 },
            { month: 'Apr', count: 680 },
            { month: 'May', count: 850 },
            { month: 'Jun', count: 1050 }
          ],
          training_completion: 85,
          sms_engagement: 92
        }
      }
    }
  },

  getFarmerAnalytics: async () => {
    await delay()
    return {
      data: {
        success: true,
        data: {}
      }
    }
  },

  getCropAnalytics: async () => {
    await delay()
    return {
      data: {
        success: true,
        data: {}
      }
    }
  },

  getCountyAnalytics: async () => {
    await delay()
    return {
      data: {
        success: true,
        data: {}
      }
    }
  },

  // Profile management
  getProfile: async () => {
    await delay()
    return {
      data: {
        success: true,
        data: {
          id: 'ngo-001',
          name: 'Agricultural Development NGO',
          email: 'ngo@agrisync.com',
          phone: '+254700000003',
          organization: 'Agricultural Development NGO',
          location: 'Nairobi',
          description: 'Empowering farmers through education and resources'
        }
      }
    }
  },

  updateProfile: async (data) => {
    await delay()
    return { data: { success: true, message: 'Profile updated successfully' } }
  },

  // Settings
  getSettings: async () => {
    await delay()
    return {
      data: {
        success: true,
        data: {
          sms_enabled: true,
          auto_scheduling: true,
          notification_preferences: ['email', 'sms']
        }
      }
    }
  },

  updateSettings: async (data) => {
    await delay()
    return { data: { success: true, message: 'Settings updated successfully' } }
  },

  // Notifications
  getNotifications: async () => {
    await delay()
    return {
      data: {
        success: true,
        data: []
      }
    }
  },

  markNotificationRead: async (id) => {
    await delay()
    return { data: { success: true } }
  },

  // Alerts
  alerts: {
    sendBulk: async (data) => {
      await delay()
      return { data: { success: true, message: 'Bulk alert sent' } }
    },
    schedule: async (data) => {
      await delay()
      return { data: { success: true, message: 'Alert scheduled' } }
    },
    getFarmerHistory: async (farmerId) => {
      await delay()
      return { data: { success: true, data: [] } }
    },
    triggerWeatherAlert: async (data) => {
      await delay()
      return { data: { success: true, message: 'Weather alert triggered' } }
    },
    getAll: async (params) => {
      await delay()
      return { data: { success: true, data: [] } }
    },
    getById: async (id) => {
      await delay()
      return { data: { success: true, data: {} } }
    },
    updateStatus: async (id, status) => {
      await delay()
      return { data: { success: true } }
    },
    delete: async (id) => {
      await delay()
      return { data: { success: true } }
    },
    getTriggers: async () => {
      await delay()
      return { data: { success: true, data: [] } }
    },
    configureTrigger: async (type, config) => {
      await delay()
      return { data: { success: true } }
    },
    getStats: async (params) => {
      await delay()
      return { data: { success: true, data: {} } }
    },
    sendAdvisorySMS: async (data) => {
      await delay()
      return { data: { success: true, message: 'Advisory SMS sent' } }
    },
    getSMSReports: async (params) => {
      await delay()
      return { data: { success: true, data: [] } }
    },
    scheduleWeeklyAdvisory: async (data) => {
      await delay()
      return { data: { success: true, message: 'Weekly advisory scheduled' } }
    }
  }
}

// Greenhouse API
export const mockGreenhouseAPI = {
  // Dashboard
  getDashboard: async () => {
    await delay()
    return {
      data: {
        success: true,
        data: {
          total_greenhouses: 8,
          active_greenhouses: 6,
          total_capacity: 5000,
          current_utilization: 3800,
          avg_temperature: 24.5,
          avg_humidity: 65
        }
      }
    }
  },

  // Greenhouse management
  getGreenhouses: async () => {
    await delay()
    return {
      data: {
        success: true,
        data: [
          { id: 'gh-001', name: 'Greenhouse A', capacity: 500, current_crops: 'Tomatoes', status: 'active', temperature: 25, humidity: 65 },
          { id: 'gh-002', name: 'Greenhouse B', capacity: 400, current_crops: 'Peppers', status: 'active', temperature: 24, humidity: 68 },
          { id: 'gh-003', name: 'Greenhouse C', capacity: 600, current_crops: 'Cucumbers', status: 'maintenance', temperature: 23, humidity: 62 }
        ]
      }
    }
  },

  createGreenhouse: async (data) => {
    await delay()
    return { data: { success: true, message: 'Greenhouse created successfully' } }
  },

  updateGreenhouse: async (id, data) => {
    await delay()
    return { data: { success: true, message: 'Greenhouse updated successfully' } }
  },

  deleteGreenhouse: async (id) => {
    await delay()
    return { data: { success: true, message: 'Greenhouse deleted successfully' } }
  },

  // Environmental controls
  getEnvironmentalData: async (greenhouseId) => {
    await delay()
    return {
      data: {
        success: true,
        data: {
          temperature: 25,
          humidity: 65,
          co2_level: 450,
          light_level: 85,
          soil_moisture: 72
        }
      }
    }
  },

  updateEnvironmentalControls: async (greenhouseId, data) => {
    await delay()
    return { data: { success: true, message: 'Controls updated successfully' } }
  },

  // Crop management
  getCrops: async (greenhouseId) => {
    await delay()
    return {
      data: {
        success: true,
        data: [
          { id: 'crop-001', name: 'Tomatoes', variety: 'Roma', planting_date: '2024-03-01', expected_harvest: '2024-06-15', status: 'growing' }
        ]
      }
    }
  },

  addCrop: async (greenhouseId, data) => {
    await delay()
    return { data: { success: true, message: 'Crop added successfully' } }
  },

  // Irrigation
  getIrrigationSchedule: async (greenhouseId) => {
    await delay()
    return {
      data: {
        success: true,
        data: [
          { id: 'irrigation-001', time: '06:00', duration: 30, status: 'scheduled' },
          { id: 'irrigation-002', time: '18:00', duration: 25, status: 'scheduled' }
        ]
      }
    }
  },

  updateIrrigationSchedule: async (greenhouseId, data) => {
    await delay()
    return { data: { success: true, message: 'Irrigation schedule updated' } }
  },

  // Analytics
  getAnalytics: async (params) => {
    await delay()
    return {
      data: {
        success: true,
        data: {
          yield_by_greenhouse: [
            { greenhouse: 'Greenhouse A', yield: 4500 },
            { greenhouse: 'Greenhouse B', yield: 3800 },
            { greenhouse: 'Greenhouse C', yield: 5200 }
          ],
          resource_usage: {
            water: 85,
            electricity: 72,
            fertilizer: 68
          }
        }
      }
    }
  }
}

// MarketPro API
export const mockMarketProAPI = {
  // Market data
  getMarketData: async () => {
    await delay()
    return {
      data: {
        success: true,
        data: {
          prices: [
            { crop: 'Maize', price: 4500, unit: '90kg bag', market: 'Nairobi', change: 5.2, trend: 'up' },
            { crop: 'Beans', price: 6800, unit: '90kg bag', market: 'Mombasa', change: -2.1, trend: 'down' },
            { crop: 'Potatoes', price: 3200, unit: '50kg bag', market: 'Kisumu', change: 3.8, trend: 'up' }
          ],
          trends: {
            maize: { current: 4500, forecast: 4800, confidence: 85 },
            beans: { current: 6800, forecast: 7200, confidence: 78 }
          }
        }
      }
    }
  },

  // Profitability calculator
  calculateProfitability: async (data) => {
    await delay()
    return {
      data: {
        success: true,
        data: {
          estimated_revenue: 45000,
          estimated_costs: 28000,
          estimated_profit: 17000,
          profit_margin: 37.8,
          risk_level: 'low'
        }
      }
    }
  },

  // Market intelligence
  getMarketIntelligence: async (crop) => {
    await delay()
    return {
      data: {
        success: true,
        data: {
          demand: 'high',
          supply: 'moderate',
          price_forecast: 'stable',
          recommendations: ['Increase planting', 'Consider storage options']
        }
      }
    }
  },

  // Price alerts
  createPriceAlert: async (data) => {
    await delay()
    return { data: { success: true, message: 'Price alert created' } }
  },

  getPriceAlerts: async () => {
    await delay()
    return {
      data: {
        success: true,
        data: []
      }
    }
  }
}

// Notifications API
export const mockNotificationsAPI = {
  getNotifications: async (filters = {}) => {
    await delay()
    const mockNotifications = [
      {
        id: 'notif-001',
        type: 'advisory',
        title: 'Maize Fall Armyworm Alert',
        message: 'Fall armyworm detected in your region. Monitor crops regularly.',
        is_read: false,
        created_at: '2024-06-10T08:00:00Z'
      },
      {
        id: 'notif-002',
        type: 'weather',
        title: 'Rain Expected',
        message: 'Rain expected in the next 2 days. Plan your activities accordingly.',
        is_read: false,
        created_at: '2024-06-09T14:00:00Z'
      },
      {
        id: 'notif-003',
        type: 'market',
        title: 'Price Alert: Maize',
        message: 'Maize prices increased by 5.2% in Nakuru market.',
        is_read: true,
        created_at: '2024-06-08T10:00:00Z'
      }
    ]
    
    let notifications = [...mockNotifications]
    
    if (filters.unread_only) {
      notifications = notifications.filter(n => !n.is_read)
    }
    if (filters.type) {
      notifications = notifications.filter(n => n.type === filters.type)
    }
    
    return { data: { data: notifications } }
  },
  
  markAsRead: async (notificationId) => {
    await delay()
    return { data: { success: true } }
  },
  
  markAllAsRead: async () => {
    await delay()
    return { data: { success: true } }
  }
}

// AI Assistant API
export const mockAIAPI = {
  chat: async (message, context = {}) => {
    await delay(1500) // Simulate AI processing time
    const responses = {
      'fertilizer': 'At flowering stage, maize requires additional potassium (K) to support grain filling. Apply potassium-rich fertilizer such as MOP (Muriate of Potash) at 50kg/ha. Also ensure adequate irrigation as water stress during flowering can significantly reduce yield.',
      'pest': 'For pest control, consider integrated pest management (IPM) approaches. Start with biological control methods like introducing natural enemies, use resistant varieties, and only use chemical pesticides as a last resort following recommended dosage.',
      'disease': 'Disease prevention starts with good agricultural practices: crop rotation, proper spacing, balanced fertilization, and using certified disease-free seeds. For existing diseases, identify the specific pathogen and apply targeted fungicides.',
      'default': 'Based on your query, I recommend consulting with local agricultural extension officers for the most accurate and region-specific advice. You can also check the advisory section for detailed guidance on your specific crops.'
    }
    
    let response = responses.default
    if (message.toLowerCase().includes('fertilizer')) {
      response = responses.fertilizer
    } else if (message.toLowerCase().includes('pest')) {
      response = responses.pest
    } else if (message.toLowerCase().includes('disease')) {
      response = responses.disease
    }
    
    return { 
      data: { 
        data: {
          response,
          sources: [
            'Kenya Agricultural and Livestock Research Organization',
            'International Maize and Wheat Improvement Center'
          ]
        }
      } 
    }
  }
}

// Export all mock APIs
export const mockAPI = {
  farmers: mockFarmersAPI,
  weather: mockWeatherAPI,
  market: mockMarketAPI,
  advisory: mockAdvisoryAPI,
  payments: mockPaymentsAPI,
  financial: mockFinancialAPI,
  farmIntel: mockFarmIntelAPI,
  auth: mockAuthAPI,
  admin: mockAdminAPI,
  dealer: mockDealerAPI,
  ngo: mockNGOAPI,
  greenhouse: mockGreenhouseAPI,
  marketPro: mockMarketProAPI,
  notifications: mockNotificationsAPI,
  ai: mockAIAPI
}
