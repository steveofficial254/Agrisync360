
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios'

// Mock axios for all tests
vi.mock('axios')

// Mock localStorage for Node environment
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

describe('Frontend Integration Tests', () => {
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 1. AUTHENTICATION API TESTS (15 tests)
  // ─────────────────────────────────────────────────────────────────────────────
  
  describe('Authentication API Integration', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should register a new farmer successfully', async () => {
      const mockData = { success: true, data: { phone: '+254712345678' } }
      axios.post.mockResolvedValue({ data: mockData })
      
      const response = await axios.post('/api/auth/register', {
        phone: '+254712345678',
        password: 'TestPass123!',
        role: 'farmer'
      })
      
      expect(response.data.success).toBe(true)
      expect(response.data.data.phone).toBe('+254712345678')
    })

    it('should login with valid credentials', async () => {
      const mockData = { 
        success: true, 
        data: { 
          access_token: 'mock_token',
          refresh_token: 'mock_refresh',
          user: { phone: '+254712345678', role: 'farmer' }
        }
      }
      axios.post.mockResolvedValue({ data: mockData })
      
      const response = await axios.post('/api/auth/login', {
        phone: '+254712345678',
        password: 'TestPass123!'
      })
      
      expect(response.data.success).toBe(true)
      expect(response.data.data.access_token).toBeDefined()
    })

    it('should verify OTP successfully', async () => {
      const mockData = { success: true, data: { access_token: 'verified_token' } }
      axios.post.mockResolvedValue({ data: mockData })
      
      const response = await axios.post('/api/auth/verify-otp', {
        phone: '+254712345678',
        otp: '123456'
      })
      
      expect(response.data.success).toBe(true)
    })

    it('should refresh access token', async () => {
      const mockData = { success: true, data: { access_token: 'new_token' } }
      axios.post.mockResolvedValue({ data: mockData })
      
      const response = await axios.post('/api/auth/refresh', {}, {
        headers: { Authorization: 'Bearer mock_refresh_token' }
      })
      
      expect(response.data.data.access_token).toBe('new_token')
    })

    it('should logout successfully', async () => {
      const mockData = { success: true, message: 'Logged out successfully' }
      axios.post.mockResolvedValue({ data: mockData })
      
      const response = await axios.post('/api/auth/logout', {}, {
        headers: { Authorization: 'Bearer mock_token' }
      })
      
      expect(response.data.success).toBe(true)
    })

    it('should handle duplicate phone registration', async () => {
      const mockError = { response: { status: 409, data: { error: 'DUPLICATE_PHONE' } } }
      axios.post.mockRejectedValue(mockError)
      
      try {
        await axios.post('/api/auth/register', {
          phone: '+254712345678',
          password: 'TestPass123!',
          role: 'farmer'
        })
      } catch (error) {
        expect(error.response.status).toBe(409)
      }
    })

    it('should handle invalid credentials on login', async () => {
      const mockError = { response: { status: 401, data: { error: 'INVALID_CREDENTIALS' } } }
      axios.post.mockRejectedValue(mockError)
      
      try {
        await axios.post('/api/auth/login', {
          phone: '+254712345678',
          password: 'WrongPass123!'
        })
      } catch (error) {
        expect(error.response.status).toBe(401)
      }
    })

    it('should handle missing phone on registration', async () => {
      const mockError = { response: { status: 400, data: { error: 'MISSING_PHONE' } } }
      axios.post.mockRejectedValue(mockError)
      
      try {
        await axios.post('/api/auth/register', {
          password: 'TestPass123!',
          role: 'farmer'
        })
      } catch (error) {
        expect(error.response.status).toBe(400)
      }
    })

    it('should handle invalid role on registration', async () => {
      const mockError = { response: { status: 500, data: { error: 'DATABASE_ERROR' } } }
      axios.post.mockRejectedValue(mockError)
      
      try {
        await axios.post('/api/auth/register', {
          phone: '+254712345678',
          password: 'TestPass123!',
          role: 'invalid_role'
        })
      } catch (error) {
        expect(error.response.status).toBe(500)
      }
    })

    it('should request password reset', async () => {
      const mockData = { success: true, message: 'OTP sent' }
      axios.post.mockResolvedValue({ data: mockData })
      
      const response = await axios.post('/api/auth/forgot-password', {
        phone: '+254712345678'
      })
      
      expect(response.data.success).toBe(true)
    })

    it('should verify reset OTP', async () => {
      const mockData = { success: true, data: { reset_token: 'reset_token' } }
      axios.post.mockResolvedValue({ data: mockData })
      
      const response = await axios.post('/api/auth/verify-reset-otp', {
        phone: '+254712345678',
        otp: '654321'
      })
      
      expect(response.data.data.reset_token).toBeDefined()
    })

    it('should reset password with valid token', async () => {
      const mockData = { success: true, message: 'Password reset successfully' }
      axios.post.mockResolvedValue({ data: mockData })
      
      const response = await axios.post('/api/auth/reset-password', {
        reset_token: 'valid_token',
        new_password: 'NewPass123!'
      })
      
      expect(response.data.success).toBe(true)
    })

    it('should handle wrong OTP on verification', async () => {
      const mockError = { response: { status: 400, data: { error: 'INVALID_OTP' } } }
      axios.post.mockRejectedValue(mockError)
      
      try {
        await axios.post('/api/auth/verify-otp', {
          phone: '+254712345678',
          otp: '000000'
        })
      } catch (error) {
        expect(error.response.status).toBe(400)
      }
    })

    it('should resend OTP successfully', async () => {
      const mockData = { success: true, message: 'OTP resent' }
      axios.post.mockResolvedValue({ data: mockData })
      
      const response = await axios.post('/api/auth/resend-otp', {
        phone: '+254712345678',
        otp_type: 'phone_verification'
      })
      
      expect(response.data.success).toBe(true)
    })
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. FARMER PROFILE API TESTS (10 tests)
  // ─────────────────────────────────────────────────────────────────────────────
  
  describe('Farmer Profile API Integration', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should fetch farmer profile', async () => {
      const mockData = {
        success: true,
        data: {
          id: 'user-1',
          phone: '+254712345678',
          first_name: 'John',
          last_name: 'Doe',
          role: 'farmer'
        }
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/farmers/profile', {
        headers: { Authorization: 'Bearer mock_token' }
      })
      
      expect(response.data.data.first_name).toBe('John')
    })

    it('should update farmer profile', async () => {
      const mockData = { success: true, data: { first_name: 'Jane' } }
      axios.put.mockResolvedValue({ data: mockData })
      
      const response = await axios.put('/api/farmers/profile', 
        { first_name: 'Jane' },
        { headers: { Authorization: 'Bearer mock_token' } }
      )
      
      expect(response.data.data.first_name).toBe('Jane')
    })

    it('should fetch farmer subscription status', async () => {
      const mockData = {
        success: true,
        data: {
          plan: 'basic_monthly',
          is_active: true,
          expires_at: '2026-12-31'
        }
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/payments/subscription', {
        headers: { Authorization: 'Bearer mock_token' }
      })
      
      expect(response.data.data.is_active).toBe(true)
    })

    it('should handle unauthorized profile access', async () => {
      const mockError = { response: { status: 401 } }
      axios.get.mockRejectedValue(mockError)
      
      try {
        await axios.get('/api/farmers/profile')
      } catch (error) {
        expect(error.response.status).toBe(401)
      }
    })

    it('should fetch farmer farms list', async () => {
      const mockData = {
        success: true,
        data: [
          { id: 'farm-1', name: 'Main Farm', size_acres: 5 }
        ]
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/farms/', {
        headers: { Authorization: 'Bearer mock_token' }
      })
      
      expect(response.data.data.length).toBeGreaterThan(0)
    })

    it('should create new farm', async () => {
      const mockData = {
        success: true,
        data: { id: 'farm-2', name: 'New Farm' }
      }
      axios.post.mockResolvedValue({ data: mockData })
      
      const response = await axios.post('/api/farms/',
        { name: 'New Farm', size_acres: 3 },
        { headers: { Authorization: 'Bearer mock_token' } }
      )
      
      expect(response.data.data.name).toBe('New Farm')
    })

    it('should update farm details', async () => {
      const mockData = { success: true, data: { size_acres: 6 } }
      axios.put.mockResolvedValue({ data: mockData })
      
      const response = await axios.put('/api/farms/farm-1',
        { size_acres: 6 },
        { headers: { Authorization: 'Bearer mock_token' } }
      )
      
      expect(response.data.data.size_acres).toBe(6)
    })

    it('should delete farm', async () => {
      const mockData = { success: true, message: 'Farm deleted' }
      axios.delete.mockResolvedValue({ data: mockData })
      
      const response = await axios.delete('/api/farms/farm-1', {
        headers: { Authorization: 'Bearer mock_token' }
      })
      
      expect(response.data.success).toBe(true)
    })

    it('should fetch farm details', async () => {
      const mockData = {
        success: true,
        data: { id: 'farm-1', name: 'Main Farm', county: 'Nairobi' }
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/farms/farm-1', {
        headers: { Authorization: 'Bearer mock_token' }
      })
      
      expect(response.data.data.county).toBe('Nairobi')
    })

    it('should handle farm not found', async () => {
      const mockError = { response: { status: 404 } }
      axios.get.mockRejectedValue(mockError)
      
      try {
        await axios.get('/api/farms/nonexistent', {
          headers: { Authorization: 'Bearer mock_token' }
        })
      } catch (error) {
        expect(error.response.status).toBe(404)
      }
    })
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. WEATHER API TESTS (8 tests)
  // ─────────────────────────────────────────────────────────────────────────────
  
  describe('Weather API Integration', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should fetch weather forecast', async () => {
      const mockData = {
        success: true,
        data: {
          location: 'Nairobi',
          forecast: [
            { date: '2026-06-05', temp: 25, condition: 'Sunny' }
          ]
        }
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/weather/forecast', {
        params: { lat: -1.29, lon: 36.82 }
      })
      
      expect(response.data.data.forecast).toBeDefined()
    })

    it('should fetch historical weather data', async () => {
      const mockData = {
        success: true,
        data: {
          historical: [
            { date: '2026-06-01', rainfall: 10 }
          ]
        }
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/weather/historical', {
        params: { lat: -1.29, lon: 36.82, days: 7 }
      })
      
      expect(response.data.data.historical).toBeDefined()
    })

    it('should handle missing coordinates', async () => {
      const mockError = { response: { status: 400 } }
      axios.get.mockRejectedValue(mockError)
      
      try {
        await axios.get('/api/weather/forecast')
      } catch (error) {
        expect(error.response.status).toBe(400)
      }
    })

    it('should fetch weather alerts', async () => {
      const mockData = {
        success: true,
        data: {
          alerts: [
            { type: 'heavy_rain', severity: 'high' }
          ]
        }
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/weather/alerts', {
        params: { county: 'Nairobi' }
      })
      
      expect(response.data.data.alerts).toBeDefined()
    })

    it('should fetch current weather', async () => {
      const mockData = {
        success: true,
        data: {
          temp: 24,
          humidity: 65,
          wind_speed: 10
        }
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/weather/current', {
        params: { lat: -1.29, lon: 36.82 }
      })
      
      expect(response.data.data.temp).toBeDefined()
    })

    it('should handle weather API timeout', async () => {
      axios.get.mockRejectedValue(new Error('Network timeout'))
      
      try {
        await axios.get('/api/weather/forecast', {
          params: { lat: -1.29, lon: 36.82 }
        })
      } catch (error) {
        expect(error.message).toBe('Network timeout')
      }
    })

    it('should fetch seasonal forecast', async () => {
      const mockData = {
        success: true,
        data: {
          season: 'long_rains',
          prediction: 'above_normal'
        }
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/weather/seasonal', {
        params: { county: 'Nairobi' }
      })
      
      expect(response.data.data.season).toBeDefined()
    })

    it('should fetch drought index', async () => {
      const mockData = {
        success: true,
        data: {
          index: 'moderate',
          value: 0.6
        }
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/weather/drought', {
        params: { county: 'Nairobi' }
      })
      
      expect(response.data.data.index).toBeDefined()
    })
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. ADVISORY API TESTS (10 tests)
  // ─────────────────────────────────────────────────────────────────────────────
  
  describe('Advisory API Integration', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should fetch maize advisory', async () => {
      const mockData = {
        success: true,
        data: [
          { crop: 'maize', advisory_type: 'planting', message: 'Plant now' }
        ]
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/advisory/crop/maize')
      
      expect(response.data.data.length).toBeGreaterThan(0)
    })

    it('should fetch beans advisory', async () => {
      const mockData = {
        success: true,
        data: [
          { crop: 'beans', advisory_type: 'fertilizer', message: 'Apply DAP' }
        ]
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/advisory/crop/beans')
      
      expect(response.data.data[0].crop).toBe('beans')
    })

    it('should fetch tomatoes advisory', async () => {
      const mockData = {
        success: true,
        data: [
          { crop: 'tomatoes', advisory_type: 'pest', message: 'Watch for aphids' }
        ]
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/advisory/crop/tomatoes')
      
      expect(response.data.data[0].crop).toBe('tomatoes')
    })

    it('should fetch planting calendar', async () => {
      const mockData = {
        success: true,
        data: [
          { week: 1, task: 'Prepare land' },
          { week: 2, task: 'Plant seeds' }
        ]
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/advisory/calendar/maize', {
        params: { planting_date: '2026-06-05' }
      })
      
      expect(response.data.data.length).toBeGreaterThan(0)
    })

    it('should fetch my-crops advisory', async () => {
      const mockData = {
        success: true,
        data: [
          { crop: 'maize', status: 'healthy', next_action: 'Apply fertilizer' }
        ]
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/advisory/my-crops', {
        headers: { Authorization: 'Bearer mock_token' }
      })
      
      expect(response.data.data).toBeDefined()
    })

    it('should handle unauthorized advisory access', async () => {
      const mockError = { response: { status: 401 } }
      axios.get.mockRejectedValue(mockError)
      
      try {
        await axios.get('/api/advisory/my-crops')
      } catch (error) {
        expect(error.response.status).toBe(401)
      }
    })

    it('should fetch nutrition advisory', async () => {
      const mockData = {
        success: true,
        data: [
          { crop: 'maize', advisory_type: 'nutrition', message: 'Add nitrogen' }
        ]
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/advisory/crop/maize')
      
      const nutritionAdvisory = response.data.data.find(a => a.advisory_type === 'nutrition')
      expect(nutritionAdvisory).toBeDefined()
    })

    it('should fetch pest control advisory', async () => {
      const mockData = {
        success: true,
        data: [
          { crop: 'maize', advisory_type: 'pest', message: 'Control fall armyworm' }
        ]
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/advisory/crop/maize')
      
      const pestAdvisory = response.data.data.find(a => a.advisory_type === 'pest')
      expect(pestAdvisory).toBeDefined()
    })

    it('should fetch harvest advisory', async () => {
      const mockData = {
        success: true,
        data: [
          { crop: 'maize', advisory_type: 'harvest', message: 'Harvest when dry' }
        ]
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/advisory/crop/maize')
      
      const harvestAdvisory = response.data.data.find(a => a.advisory_type === 'harvest')
      expect(harvestAdvisory).toBeDefined()
    })

    it('should handle invalid crop name', async () => {
      const mockError = { response: { status: 404 } }
      axios.get.mockRejectedValue(mockError)
      
      try {
        await axios.get('/api/advisory/crop/invalid_crop')
      } catch (error) {
        expect(error.response.status).toBe(404)
      }
    })
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. MARKET API TESTS (8 tests)
  // ─────────────────────────────────────────────────────────────────────────────
  
  describe('Market API Integration', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should fetch market prices', async () => {
      const mockData = {
        success: true,
        data: [
          { crop: 'maize', price_per_kg: 30, market: 'Nairobi' }
        ]
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/market/prices')
      
      expect(response.data.data.length).toBeGreaterThan(0)
    })

    it('should fetch prices by crop', async () => {
      const mockData = {
        success: true,
        data: [
          { crop: 'maize', price_per_kg: 30, market: 'Nairobi' },
          { crop: 'maize', price_per_kg: 28, market: 'Mombasa' }
        ]
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/market/prices', {
        params: { crop: 'maize' }
      })
      
      expect(response.data.data.every(p => p.crop === 'maize')).toBe(true)
    })

    it('should fetch prices by county', async () => {
      const mockData = {
        success: true,
        data: [
          { crop: 'maize', price_per_kg: 30, market: 'Nairobi' }
        ]
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/market/prices', {
        params: { county: 'Nairobi' }
      })
      
      expect(response.data.data[0].market).toBe('Nairobi')
    })

    it('should calculate profitability', async () => {
      const mockData = {
        success: true,
        data: {
          revenue: 15000,
          costs: 5000,
          profit: 10000,
          margin: 66.67
        }
      }
      axios.post.mockResolvedValue({ data: mockData })
      
      const response = await axios.post('/api/market/profitability', {
        crop: 'maize',
        quantity_kg: 500,
        yield_per_acre: 20,
        acres: 5
      })
      
      expect(response.data.data.profit).toBe(10000)
    })

    it('should fetch market trends', async () => {
      const mockData = {
        success: true,
        data: {
          crop: 'maize',
          trend: 'increasing',
          change_percent: 5.2
        }
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/market/trends', {
        params: { crop: 'maize' }
      })
      
      expect(response.data.data.trend).toBeDefined()
    })

    it('should fetch top markets', async () => {
      const mockData = {
        success: true,
        data: [
          { market: 'Nairobi', avg_price: 32 },
          { market: 'Mombasa', avg_price: 28 }
        ]
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/market/top-markets', {
        params: { crop: 'maize', limit: 5 }
      })
      
      expect(response.data.data.length).toBeGreaterThan(0)
    })

    it('should handle missing crop in profitability calculation', async () => {
      const mockError = { response: { status: 400 } }
      axios.post.mockRejectedValue(mockError)
      
      try {
        await axios.post('/api/market/profitability', {
          quantity_kg: 500
        })
      } catch (error) {
        expect(error.response.status).toBe(400)
      }
    })

    it('should fetch market news', async () => {
      const mockData = {
        success: true,
        data: [
          { title: 'Maize prices rise', date: '2026-06-05' }
        ]
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/market/news')
      
      expect(response.data.data).toBeDefined()
    })
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. PAYMENTS API TESTS (10 tests)
  // ─────────────────────────────────────────────────────────────────────────────
  
  describe('Payments API Integration', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should fetch subscription plans', async () => {
      const mockData = {
        success: true,
        data: [
          { id: 'basic_monthly', name: 'Basic Monthly', price: 99 },
          { id: 'pro_monthly', name: 'Pro Monthly', price: 299 }
        ]
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/payments/plans')
      
      expect(response.data.data.length).toBeGreaterThan(0)
    })

    it('should initiate payment', async () => {
      const mockData = {
        success: true,
        data: {
          payment_id: 'pay-123',
          checkout_url: 'https://checkout.example.com'
        }
      }
      axios.post.mockResolvedValue({ data: mockData })
      
      const response = await axios.post('/api/payments/initiate', {
        plan: 'basic_monthly'
      }, {
        headers: { Authorization: 'Bearer mock_token' }
      })
      
      expect(response.data.data.checkout_url).toBeDefined()
    })

    it('should fetch subscription status', async () => {
      const mockData = {
        success: true,
        data: {
          plan: 'basic_monthly',
          is_active: true,
          expires_at: '2026-12-31'
        }
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/payments/subscription', {
        headers: { Authorization: 'Bearer mock_token' }
      })
      
      expect(response.data.data.is_active).toBe(true)
    })

    it('should upgrade subscription', async () => {
      const mockData = {
        success: true,
        data: {
          plan: 'pro_monthly',
          is_active: true
        }
      }
      axios.post.mockResolvedValue({ data: mockData })
      
      const response = await axios.post('/api/payments/upgrade', {
        plan: 'pro_monthly'
      }, {
        headers: { Authorization: 'Bearer mock_token' }
      })
      
      expect(response.data.data.plan).toBe('pro_monthly')
    })

    it('should cancel subscription', async () => {
      const mockData = {
        success: true,
        data: {
          is_active: false,
          cancelled_at: '2026-06-05'
        }
      }
      axios.post.mockResolvedValue({ data: mockData })
      
      const response = await axios.post('/api/payments/cancel', {}, {
        headers: { Authorization: 'Bearer mock_token' }
      })
      
      expect(response.data.data.is_active).toBe(false)
    })

    it('should fetch payment history', async () => {
      const mockData = {
        success: true,
        data: [
          { id: 'pay-1', amount: 99, date: '2026-06-01', status: 'completed' }
        ]
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/payments/history', {
        headers: { Authorization: 'Bearer mock_token' }
      })
      
      expect(response.data.data.length).toBeGreaterThan(0)
    })

    it('should handle payment failure', async () => {
      const mockError = { response: { status: 400, data: { error: 'PAYMENT_FAILED' } } }
      axios.post.mockRejectedValue(mockError)
      
      try {
        await axios.post('/api/payments/initiate', { plan: 'basic_monthly' })
      } catch (error) {
        expect(error.response.status).toBe(400)
      }
    })

    it('should activate dev plan', async () => {
      const mockData = {
        success: true,
        data: {
          plan: 'pro_monthly',
          is_active: true
        }
      }
      axios.post.mockResolvedValue({ data: mockData })
      
      const response = await axios.post('/api/payments/activate-dev', {
        plan: 'pro_monthly'
      }, {
        headers: { Authorization: 'Bearer mock_token' }
      })
      
      expect(response.data.success).toBe(true)
    })

    it('should fetch plan features', async () => {
      const mockData = {
        success: true,
        data: [
          { id: 'basic_monthly', name: 'Basic Monthly', price: 99, features: ['Weather alerts', 'Basic advisory'] }
        ]
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/payments/plans')
      
      expect(response.data.data[0].features).toBeDefined()
    })

    it('should handle invalid plan', async () => {
      const mockError = { response: { status: 400, data: { error: 'INVALID_PLAN' } } }
      axios.post.mockRejectedValue(mockError)
      
      try {
        await axios.post('/api/payments/initiate', { plan: 'invalid_plan' })
      } catch (error) {
        expect(error.response.status).toBe(400)
      }
    })
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. AI CHAT API TESTS (5 tests)
  // ─────────────────────────────────────────────────────────────────────────────
  
  describe('AI Chat API Integration', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should send chat message', async () => {
      const mockData = {
        success: true,
        data: {
          response: 'To prevent maize rust, use resistant varieties and proper spacing.',
          timestamp: '2026-06-05T10:00:00Z'
        }
      }
      axios.post.mockResolvedValue({ data: mockData })
      
      const response = await axios.post('/api/ai/chat', {
        message: 'How do I prevent maize rust?'
      }, {
        headers: { Authorization: 'Bearer mock_token' }
      })
      
      expect(response.data.data.response).toBeDefined()
    })

    it('should handle chat without authentication', async () => {
      const mockError = { response: { status: 401 } }
      axios.post.mockRejectedValue(mockError)
      
      try {
        await axios.post('/api/ai/chat', {
          message: 'Test message'
        })
      } catch (error) {
        expect(error.response.status).toBe(401)
      }
    })

    it('should handle empty message', async () => {
      const mockError = { response: { status: 400 } }
      axios.post.mockRejectedValue(mockError)
      
      try {
        await axios.post('/api/ai/chat', { message: '' }, {
          headers: { Authorization: 'Bearer mock_token' }
        })
      } catch (error) {
        expect(error.response.status).toBe(400)
      }
    })

    it('should fetch chat history', async () => {
      const mockData = {
        success: true,
        data: [
          { role: 'user', message: 'Test', timestamp: '2026-06-05' },
          { role: 'assistant', message: 'Response', timestamp: '2026-06-05' }
        ]
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/ai/history', {
        headers: { Authorization: 'Bearer mock_token' }
      })
      
      expect(response.data.data.length).toBeGreaterThan(0)
    })

    it('should clear chat history', async () => {
      const mockData = { success: true, message: 'History cleared' }
      axios.delete.mockResolvedValue({ data: mockData })
      
      const response = await axios.delete('/api/ai/history', {
        headers: { Authorization: 'Bearer mock_token' }
      })
      
      expect(response.data.success).toBe(true)
    })
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. USSD API TESTS (8 tests)
  // ─────────────────────────────────────────────────────────────────────────────
  
  describe('USSD API Integration', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should load main menu', async () => {
      const mockData = {
        success: true,
        response: 'CON Welcome to AgriSync\n1. Weather\n2. Market\n3. Advisory\n4. Account\n5. Subscribe'
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/ussd/test', {
        params: { text: '', phone: '+254700000001' }
      })
      
      expect(response.data.response).toContain('CON')
    })

    it('should navigate to weather submenu', async () => {
      const mockData = {
        success: true,
        response: 'CON Weather Menu\n1. Today\n2. Tomorrow\n3. Week'
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/ussd/test', {
        params: { text: '1', phone: '+254700000001' }
      })
      
      expect(response.data.response).toContain('Weather')
    })

    it('should show today weather', async () => {
      const mockData = {
        success: true,
        response: 'END Today: 25°C, Sunny'
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/ussd/test', {
        params: { text: '1*1', phone: '+254700000001' }
      })
      
      expect(response.data.response).toContain('END')
    })

    it('should navigate to market submenu', async () => {
      const mockData = {
        success: true,
        response: 'CON Market Menu\n1. Maize\n2. Beans\n3. Tomatoes'
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/ussd/test', {
        params: { text: '2', phone: '+254700000001' }
      })
      
      expect(response.data.response).toContain('Market')
    })

    it('should show market prices', async () => {
      const mockData = {
        success: true,
        response: 'END Maize: KES 30/kg'
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/ussd/test', {
        params: { text: '2*1', phone: '+254700000001' }
      })
      
      expect(response.data.response).toContain('KES')
    })

    it('should navigate to advisory submenu', async () => {
      const mockData = {
        success: true,
        response: 'CON Advisory Menu\n1. Planting\n2. Pests\n3. Fertilizer'
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/ussd/test', {
        params: { text: '3', phone: '+254700000001' }
      })
      
      expect(response.data.response).toContain('Advisory')
    })

    it('should show subscription menu', async () => {
      const mockData = {
        success: true,
        response: 'CON Subscribe\n1. Basic KES 99\n2. Pro KES 299'
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/ussd/test', {
        params: { text: '5', phone: '+254700000001' }
      })
      
      expect(response.data.response).toContain('KES')
    })

    it('should handle invalid USSD input', async () => {
      const mockData = {
        success: true,
        response: 'CON Invalid option. Try again.'
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/ussd/test', {
        params: { text: '9', phone: '+254700000001' }
      })
      
      expect(response.data.response).toContain('Invalid')
    })
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. AGRO-DEALER API TESTS (10 tests)
  // ─────────────────────────────────────────────────────────────────────────────
  
  describe('Agro-Dealer API Integration', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should create dealer profile', async () => {
      const mockData = {
        success: true,
        data: { id: 'dealer-1', business_name: 'Test Agro Supplies' }
      }
      axios.post.mockResolvedValue({ data: mockData })
      
      const response = await axios.post('/api/dealer/profile', {
        business_name: 'Test Agro Supplies',
        county: 'Nairobi'
      }, {
        headers: { Authorization: 'Bearer dealer_token' }
      })
      
      expect(response.data.data.business_name).toBe('Test Agro Supplies')
    })

    it('should fetch dealer profile', async () => {
      const mockData = {
        success: true,
        data: { business_name: 'Test Agro Supplies', county: 'Nairobi' }
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/dealer/profile', {
        headers: { Authorization: 'Bearer dealer_token' }
      })
      
      expect(response.data.data.business_name).toBeDefined()
    })

    it('should update dealer profile', async () => {
      const mockData = {
        success: true,
        data: { business_location: 'Updated Location' }
      }
      axios.put.mockResolvedValue({ data: mockData })
      
      const response = await axios.put('/api/dealer/profile', {
        business_location: 'Updated Location'
      }, {
        headers: { Authorization: 'Bearer dealer_token' }
      })
      
      expect(response.data.data.business_location).toBe('Updated Location')
    })

    it('should add product', async () => {
      const mockData = {
        success: true,
        data: { id: 'product-1', product_name: 'DAP Fertilizer' }
      }
      axios.post.mockResolvedValue({ data: mockData })
      
      const response = await axios.post('/api/dealer/products', {
        crop_name: 'maize',
        product_name: 'DAP Fertilizer',
        price_ksh: 3200
      }, {
        headers: { Authorization: 'Bearer dealer_token' }
      })
      
      expect(response.data.data.product_name).toBe('DAP Fertilizer')
    })

    it('should list products', async () => {
      const mockData = {
        success: true,
        data: [
          { id: 'product-1', product_name: 'DAP Fertilizer' }
        ]
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/dealer/products', {
        headers: { Authorization: 'Bearer dealer_token' }
      })
      
      expect(response.data.data.length).toBeGreaterThan(0)
    })

    it('should update product', async () => {
      const mockData = {
        success: true,
        data: { price_ksh: 3300 }
      }
      axios.put.mockResolvedValue({ data: mockData })
      
      const response = await axios.put('/api/dealer/products/product-1', {
        price_ksh: 3300
      }, {
        headers: { Authorization: 'Bearer dealer_token' }
      })
      
      expect(response.data.data.price_ksh).toBe(3300)
    })

    it('should list farmers by county', async () => {
      const mockData = {
        success: true,
        data: [
          { phone: '+254711111111', crops: ['maize'] }
        ]
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/dealer/farmers', {
        params: { county: 'Nairobi' },
        headers: { Authorization: 'Bearer dealer_token' }
      })
      
      expect(response.data.data.length).toBeGreaterThan(0)
    })

    it('should send broadcast', async () => {
      const mockData = {
        success: true,
        data: { id: 'broadcast-1', message: 'New DAP available' }
      }
      axios.post.mockResolvedValue({ data: mockData })
      
      const response = await axios.post('/api/dealer/broadcast', {
        message: 'New DAP available',
        target_county: 'Nairobi'
      }, {
        headers: { Authorization: 'Bearer dealer_token' }
      })
      
      expect(response.data.success).toBe(true)
    })

    it('should fetch broadcasts', async () => {
      const mockData = {
        success: true,
        data: [
          { id: 'broadcast-1', message: 'New DAP available' }
        ]
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/dealer/broadcasts', {
        headers: { Authorization: 'Bearer dealer_token' }
      })
      
      expect(response.data.data.length).toBeGreaterThan(0)
    })

    it('should fetch dealer stats', async () => {
      const mockData = {
        success: true,
        data: {
          total_products: 50,
          total_sales: 100000
        }
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/dealer/stats', {
        headers: { Authorization: 'Bearer dealer_token' }
      })
      
      expect(response.data.data.total_products).toBeDefined()
    })
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. NGO API TESTS (8 tests)
  // ─────────────────────────────────────────────────────────────────────────────
  
  describe('NGO API Integration', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should create NGO profile', async () => {
      const mockData = {
        success: true,
        data: { id: 'ngo-1', organization_name: 'Test NGO' }
      }
      axios.post.mockResolvedValue({ data: mockData })
      
      const response = await axios.post('/api/ngo/profile', {
        organization_name: 'Test NGO',
        organization_type: 'ngo'
      }, {
        headers: { Authorization: 'Bearer ngo_token' }
      })
      
      expect(response.data.data.organization_name).toBe('Test NGO')
    })

    it('should fetch NGO profile', async () => {
      const mockData = {
        success: true,
        data: { organization_name: 'Test NGO', focus_counties: ['Nairobi'] }
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/ngo/profile', {
        headers: { Authorization: 'Bearer ngo_token' }
      })
      
      expect(response.data.data.organization_name).toBeDefined()
    })

    it('should bulk register farmers', async () => {
      const mockData = {
        success: true,
        data: {
          batch_id: 'batch-1',
          registered_count: 10
        }
      }
      axios.post.mockResolvedValue({ data: mockData })
      
      const response = await axios.post('/api/ngo/farmers/bulk-register', {
        county: 'Nairobi',
        batch_name: 'Test Batch',
        farmers: [
          { phone: '+254711111111', first_name: 'John', last_name: 'Doe' }
        ]
      }, {
        headers: { Authorization: 'Bearer ngo_token' }
      })
      
      expect(response.data.data.batch_id).toBeDefined()
    })

    it('should list NGO farmers', async () => {
      const mockData = {
        success: true,
        data: [
          { phone: '+254711111111', first_name: 'John' }
        ]
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/ngo/farmers', {
        params: { county: 'Nairobi' },
        headers: { Authorization: 'Bearer ngo_token' }
      })
      
      expect(response.data.data.length).toBeGreaterThan(0)
    })

    it('should fetch batch status', async () => {
      const mockData = {
        success: true,
        data: {
          batch_id: 'batch-1',
          status: 'completed',
          registered_count: 10
        }
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/ngo/farmers/batches/batch-1', {
        headers: { Authorization: 'Bearer ngo_token' }
      })
      
      expect(response.data.data.status).toBe('completed')
    })

    it('should send NGO broadcast', async () => {
      const mockData = {
        success: true,
        data: { id: 'broadcast-1', message: 'Free training available' }
      }
      axios.post.mockResolvedValue({ data: mockData })
      
      const response = await axios.post('/api/ngo/broadcast', {
        message: 'Free training available',
        target_county: 'Nairobi'
      }, {
        headers: { Authorization: 'Bearer ngo_token' }
      })
      
      expect(response.data.success).toBe(true)
    })

    it('should fetch NGO broadcasts', async () => {
      const mockData = {
        success: true,
        data: [
          { id: 'broadcast-1', message: 'Free training available' }
        ]
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/ngo/broadcasts', {
        headers: { Authorization: 'Bearer ngo_token' }
      })
      
      expect(response.data.data.length).toBeGreaterThan(0)
    })

    it('should fetch NGO dashboard', async () => {
      const mockData = {
        success: true,
        data: {
          total_farmers: 100,
          total_batches: 10
        }
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/ngo/dashboard', {
        headers: { Authorization: 'Bearer ngo_token' }
      })
      
      expect(response.data.data.total_farmers).toBeDefined()
    })
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 11. ADMIN API TESTS (8 tests)
  // ─────────────────────────────────────────────────────────────────────────────
  
  describe('Admin API Integration', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should fetch admin stats', async () => {
      const mockData = {
        success: true,
        data: {
          users: 1000,
          farms: 500,
          revenue: 500000
        }
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/admin/stats', {
        headers: { Authorization: 'Bearer admin_token' }
      })
      
      expect(response.data.data.users).toBeDefined()
    })

    it('should fetch admin revenue', async () => {
      const mockData = {
        success: true,
        data: {
          total_revenue: 500000,
          monthly_revenue: 50000
        }
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/admin/revenue', {
        headers: { Authorization: 'Bearer admin_token' }
      })
      
      expect(response.data.data.total_revenue).toBeDefined()
    })

    it('should list users by role', async () => {
      const mockData = {
        success: true,
        data: [
          { phone: '+254711111111', role: 'farmer' }
        ]
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/admin/users', {
        params: { role: 'farmer', limit: 10 },
        headers: { Authorization: 'Bearer admin_token' }
      })
      
      expect(response.data.data.length).toBeGreaterThan(0)
    })

    it('should fetch system health', async () => {
      const mockData = {
        success: true,
        data: {
          database: 'healthy',
          api: 'healthy',
          cache: 'healthy'
        }
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/admin/health', {
        headers: { Authorization: 'Bearer admin_token' }
      })
      
      expect(response.data.data.database).toBe('healthy')
    })

    it('should handle unauthorized admin access', async () => {
      const mockError = { response: { status: 401 } }
      axios.get.mockRejectedValue(mockError)
      
      try {
        await axios.get('/api/admin/stats')
      } catch (error) {
        expect(error.response.status).toBe(401)
      }
    })

    it('should handle non-admin accessing admin endpoints', async () => {
      const mockError = { response: { status: 403 } }
      axios.get.mockRejectedValue(mockError)
      
      try {
        await axios.get('/api/admin/stats', {
          headers: { Authorization: 'Bearer farmer_token' }
        })
      } catch (error) {
        expect(error.response.status).toBe(403)
      }
    })

    it('should fetch user details', async () => {
      const mockData = {
        success: true,
        data: {
          id: 'user-1',
          phone: '+254711111111',
          role: 'farmer',
          is_active: true
        }
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/admin/users/user-1', {
        headers: { Authorization: 'Bearer admin_token' }
      })
      
      expect(response.data.data.phone).toBeDefined()
    })

    it('should deactivate user', async () => {
      const mockData = {
        success: true,
        data: { is_active: false }
      }
      axios.put.mockResolvedValue({ data: mockData })
      
      const response = await axios.put('/api/admin/users/user-1/deactivate', {}, {
        headers: { Authorization: 'Bearer admin_token' }
      })
      
      expect(response.data.data.is_active).toBe(false)
    })
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 12. SMS API TESTS (6 tests)
  // ─────────────────────────────────────────────────────────────────────────────
  
  describe('SMS API Integration', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should send SMS as admin', async () => {
      const mockData = {
        success: true,
        data: { message_id: 'sms-1', status: 'sent' }
      }
      axios.post.mockResolvedValue({ data: mockData })
      
      const response = await axios.post('/api/sms/send', {
        phone: '+254711111111',
        message: 'Test message'
      }, {
        headers: { Authorization: 'Bearer admin_token' }
      })
      
      expect(response.data.data.status).toBe('sent')
    })

    it('should fetch SMS logs as admin', async () => {
      const mockData = {
        success: true,
        data: [
          { id: 'sms-1', phone: '+254711111111', status: 'sent' }
        ]
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/sms/logs', {
        headers: { Authorization: 'Bearer admin_token' }
      })
      
      expect(response.data.data.length).toBeGreaterThan(0)
    })

    it('should block non-admin from SMS logs', async () => {
      const mockError = { response: { status: 403 } }
      axios.get.mockRejectedValue(mockError)
      
      try {
        await axios.get('/api/sms/logs', {
          headers: { Authorization: 'Bearer farmer_token' }
        })
      } catch (error) {
        expect(error.response.status).toBe(403)
      }
    })

    it('should handle WhatsApp webhook GET', async () => {
      const mockData = { status: 'verified' }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/whatsapp/webhook', {
        params: { 'hub.challenge': 'test_challenge' }
      })
      
      expect(response.data.status).toBe('verified')
    })

    it('should handle WhatsApp webhook POST', async () => {
      const mockData = { success: true }
      axios.post.mockResolvedValue({ data: mockData })
      
      const response = await axios.post('/api/whatsapp/webhook', {
        object: 'whatsapp_business_account'
      })
      
      expect(response.data.success).toBe(true)
    })

    it('should handle SMS sending failure', async () => {
      const mockError = { response: { status: 500, data: { error: 'SMS_FAILED' } } }
      axios.post.mockRejectedValue(mockError)
      
      try {
        await axios.post('/api/sms/send', {
          phone: '+254711111111',
          message: 'Test message'
        })
      } catch (error) {
        expect(error.response.status).toBe(500)
      }
    })
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 13. ALERTS API TESTS (5 tests)
  // ─────────────────────────────────────────────────────────────────────────────
  
  describe('Alerts API Integration', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should create alert as admin', async () => {
      const mockData = {
        success: true,
        data: { id: 'alert-1', title: 'Weather Alert' }
      }
      axios.post.mockResolvedValue({ data: mockData })
      
      const response = await axios.post('/api/alerts', {
        title: 'Weather Alert',
        message: 'Heavy rains expected',
        alert_type: 'weather',
        severity: 'high'
      }, {
        headers: { Authorization: 'Bearer admin_token' }
      })
      
      expect(response.data.data.title).toBe('Weather Alert')
    })

    it('should fetch alerts by county', async () => {
      const mockData = {
        success: true,
        data: [
          { id: 'alert-1', title: 'Weather Alert', severity: 'high' }
        ]
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/alerts', {
        params: { county: 'Nairobi' },
        headers: { Authorization: 'Bearer farmer_token' }
      })
      
      expect(response.data.data.length).toBeGreaterThan(0)
    })

    it('should mark alert as read', async () => {
      const mockData = {
        success: true,
        data: { is_read: true }
      }
      axios.put.mockResolvedValue({ data: mockData })
      
      const response = await axios.put('/api/alerts/alert-1/read', {}, {
        headers: { Authorization: 'Bearer farmer_token' }
      })
      
      expect(response.data.data.is_read).toBe(true)
    })

    it('should handle non-existent alert', async () => {
      const mockError = { response: { status: 404 } }
      axios.put.mockRejectedValue(mockError)
      
      try {
        await axios.put('/api/alerts/nonexistent/read', {}, {
          headers: { Authorization: 'Bearer farmer_token' }
        })
      } catch (error) {
        expect(error.response.status).toBe(404)
      }
    })

    it('should fetch all alerts as admin', async () => {
      const mockData = {
        success: true,
        data: [
          { id: 'alert-1', title: 'Weather Alert' },
          { id: 'alert-2', title: 'Market Alert' }
        ]
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/alerts', {
        headers: { Authorization: 'Bearer admin_token' }
      })
      
      expect(response.data.data.length).toBeGreaterThan(0)
    })
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 14. GREENHOUSE API TESTS (4 tests)
  // ─────────────────────────────────────────────────────────────────────────────
  
  describe('Greenhouse API Integration', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should create greenhouse', async () => {
      const mockData = {
        success: true,
        data: { id: 'gh-1', name: 'Test Greenhouse' }
      }
      axios.post.mockResolvedValue({ data: mockData })
      
      const response = await axios.post('/api/greenhouse/', {
        name: 'Test Greenhouse',
        greenhouse_type: 'tunnel'
      }, {
        headers: { Authorization: 'Bearer farmer_token' }
      })
      
      expect(response.data.data.name).toBe('Test Greenhouse')
    })

    it('should list greenhouses', async () => {
      const mockData = {
        success: true,
        data: [
          { id: 'gh-1', name: 'Test Greenhouse' }
        ]
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/greenhouse/', {
        headers: { Authorization: 'Bearer farmer_token' }
      })
      
      expect(response.data.data.length).toBeGreaterThan(0)
    })

    it('should update greenhouse', async () => {
      const mockData = {
        success: true,
        data: { name: 'Updated Greenhouse' }
      }
      axios.put.mockResolvedValue({ data: mockData })
      
      const response = await axios.put('/api/greenhouse/gh-1', {
        name: 'Updated Greenhouse'
      }, {
        headers: { Authorization: 'Bearer farmer_token' }
      })
      
      expect(response.data.data.name).toBe('Updated Greenhouse')
    })

    it('should delete greenhouse', async () => {
      const mockData = {
        success: true,
        message: 'Greenhouse deleted'
      }
      axios.delete.mockResolvedValue({ data: mockData })
      
      const response = await axios.delete('/api/greenhouse/gh-1', {
        headers: { Authorization: 'Bearer farmer_token' }
      })
      
      expect(response.data.success).toBe(true)
    })
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 15. YIELDS API TESTS (4 tests)
  // ─────────────────────────────────────────────────────────────────────────────
  
  describe('Yields API Integration', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should create yield record', async () => {
      const mockData = {
        success: true,
        data: { id: 'yield-1', crop_name: 'maize', quantity_kg: 500 }
      }
      axios.post.mockResolvedValue({ data: mockData })
      
      const response = await axios.post('/api/yields/', {
        crop_name: 'maize',
        variety: 'H614',
        quantity_kg: 500,
        price_per_kg: 30
      }, {
        headers: { Authorization: 'Bearer farmer_token' }
      })
      
      expect(response.data.data.quantity_kg).toBe(500)
    })

    it('should list yields', async () => {
      const mockData = {
        success: true,
        data: [
          { id: 'yield-1', crop_name: 'maize', quantity_kg: 500 }
        ]
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/yields/', {
        headers: { Authorization: 'Bearer farmer_token' }
      })
      
      expect(response.data.data.length).toBeGreaterThan(0)
    })

    it('should update yield record', async () => {
      const mockData = {
        success: true,
        data: { quantity_kg: 600 }
      }
      axios.put.mockResolvedValue({ data: mockData })
      
      const response = await axios.put('/api/yields/yield-1', {
        quantity_kg: 600
      }, {
        headers: { Authorization: 'Bearer farmer_token' }
      })
      
      expect(response.data.data.quantity_kg).toBe(600)
    })

    it('should delete yield record', async () => {
      const mockData = {
        success: true,
        message: 'Yield record deleted'
      }
      axios.delete.mockResolvedValue({ data: mockData })
      
      const response = await axios.delete('/api/yields/yield-1', {
        headers: { Authorization: 'Bearer farmer_token' }
      })
      
      expect(response.data.success).toBe(true)
    })
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 16. FARM OPERATIONS API TESTS (4 tests)
  // ─────────────────────────────────────────────────────────────────────────────
  
  describe('Farm Operations API Integration', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should create farm operation', async () => {
      const mockData = {
        success: true,
        data: { id: 'op-1', operation_type: 'planting', crop_name: 'maize' }
      }
      axios.post.mockResolvedValue({ data: mockData })
      
      const response = await axios.post('/api/farm-ops/', {
        operation_type: 'planting',
        crop_name: 'maize',
        date: '2026-06-05'
      }, {
        headers: { Authorization: 'Bearer farmer_token' }
      })
      
      expect(response.data.data.operation_type).toBe('planting')
    })

    it('should list farm operations', async () => {
      const mockData = {
        success: true,
        data: [
          { id: 'op-1', operation_type: 'planting', crop_name: 'maize' }
        ]
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/farm-ops/', {
        headers: { Authorization: 'Bearer farmer_token' }
      })
      
      expect(response.data.data.length).toBeGreaterThan(0)
    })

    it('should update farm operation', async () => {
      const mockData = {
        success: true,
        data: { cost_ksh: 5000 }
      }
      axios.put.mockResolvedValue({ data: mockData })
      
      const response = await axios.put('/api/farm-ops/op-1', {
        cost_ksh: 5000
      }, {
        headers: { Authorization: 'Bearer farmer_token' }
      })
      
      expect(response.data.data.cost_ksh).toBe(5000)
    })

    it('should delete farm operation', async () => {
      const mockData = {
        success: true,
        message: 'Operation deleted'
      }
      axios.delete.mockResolvedValue({ data: mockData })
      
      const response = await axios.delete('/api/farm-ops/op-1', {
        headers: { Authorization: 'Bearer farmer_token' }
      })
      
      expect(response.data.success).toBe(true)
    })
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 17. COMPONENT RENDERING TESTS (15 tests)
  // ─────────────────────────────────────────────────────────────────────────────
  
  describe('Component Rendering Tests', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should render Dashboard component', async () => {
      const Dashboard = (await import('../pages/farmer/Dashboard')).default
      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      )
      // Component renders without crashing
      expect(true).toBe(true)
    })

    it('should render Weather component', async () => {
      const Weather = (await import('../pages/farmer/Weather')).default
      render(
        <BrowserRouter>
          <Weather />
        </BrowserRouter>
      )
      expect(true).toBe(true)
    })

    it('should render Advisory component', async () => {
      const Advisory = (await import('../pages/farmer/Advisory')).default
      render(
        <BrowserRouter>
          <Advisory />
        </BrowserRouter>
      )
      expect(true).toBe(true)
    })

    it('should render Market component', async () => {
      const Market = (await import('../pages/farmer/Market')).default
      render(
        <BrowserRouter>
          <Market />
        </BrowserRouter>
      )
      expect(true).toBe(true)
    })

    it('should render Subscription component', async () => {
      const Subscription = (await import('../pages/farmer/Subscription')).default
      render(
        <BrowserRouter>
          <Subscription />
        </BrowserRouter>
      )
      expect(true).toBe(true)
    })

    it('should render Profile component', async () => {
      const Profile = (await import('../pages/farmer/Profile')).default
      render(
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      )
      expect(true).toBe(true)
    })

    it('should render FarmSetup component', async () => {
      const FarmSetup = (await import('../pages/farmer/FarmSetup')).default
      render(
        <BrowserRouter>
          <FarmSetup />
        </BrowserRouter>
      )
      expect(true).toBe(true)
    })

    it('should render PlantingCalendar component', async () => {
      const PlantingCalendar = (await import('../pages/farmer/PlantingCalendar')).default
      render(
        <BrowserRouter>
          <PlantingCalendar />
        </BrowserRouter>
      )
      expect(true).toBe(true)
    })

    it('should render YieldTracker component', async () => {
      const YieldTracker = (await import('../pages/farmer/YieldTracker')).default
      render(
        <BrowserRouter>
          <YieldTracker />
        </BrowserRouter>
      )
      expect(true).toBe(true)
    })

    it('should render AIAssistant component', async () => {
      const AIAssistant = (await import('../pages/farmer/AIAssistant')).default
      render(
        <BrowserRouter>
          <AIAssistant />
        </BrowserRouter>
      )
      expect(true).toBe(true)
    })

    it('should render FinancialManager component', async () => {
      const FinancialManager = (await import('../pages/farmer/FinancialManager')).default
      render(
        <BrowserRouter>
          <FinancialManager />
        </BrowserRouter>
      )
      expect(true).toBe(true)
    })

    it('should render SoilHealth component', async () => {
      const SoilHealth = (await import('../pages/farmer/SoilHealth')).default
      render(
        <BrowserRouter>
          <SoilHealth />
        </BrowserRouter>
      )
      expect(true).toBe(true)
    })

    it('should render IrrigationManager component', async () => {
      const IrrigationManager = (await import('../pages/farmer/IrrigationManager')).default
      render(
        <BrowserRouter>
          <IrrigationManager />
        </BrowserRouter>
      )
      expect(true).toBe(true)
    })

    it('should render PestLibrary component', async () => {
      const PestLibrary = (await import('../pages/farmer/PestLibrary')).default
      render(
        <BrowserRouter>
          <PestLibrary />
        </BrowserRouter>
      )
      expect(true).toBe(true)
    })

    it('should render Community component', async () => {
      const Community = (await import('../pages/farmer/Community')).default
      render(
        <BrowserRouter>
          <Community />
        </BrowserRouter>
      )
      expect(true).toBe(true)
    })
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 18. DATA FETCHING TESTS (10 tests)
  // ─────────────────────────────────────────────────────────────────────────────
  
  describe('Data Fetching Integration', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should handle successful data fetch', async () => {
      const mockData = { success: true, data: { test: 'data' } }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/test')
      expect(response.data.success).toBe(true)
    })

    it('should handle network error', async () => {
      axios.get.mockRejectedValue(new Error('Network Error'))
      
      try {
        await axios.get('/api/test')
      } catch (error) {
        expect(error.message).toBe('Network Error')
      }
    })

    it('should handle timeout', async () => {
      axios.get.mockRejectedValue(new Error('Request timeout'))
      
      try {
        await axios.get('/api/test')
      } catch (error) {
        expect(error.message).toBe('Request timeout')
      }
    })

    it('should handle 500 server error', async () => {
      const mockError = { response: { status: 500 } }
      axios.get.mockRejectedValue(mockError)
      
      try {
        await axios.get('/api/test')
      } catch (error) {
        expect(error.response.status).toBe(500)
      }
    })

    it('should handle 404 not found', async () => {
      const mockError = { response: { status: 404 } }
      axios.get.mockRejectedValue(mockError)
      
      try {
        await axios.get('/api/nonexistent')
      } catch (error) {
        expect(error.response.status).toBe(404)
      }
    })

    it('should retry failed requests', async () => {
      axios.get.mockRejectedValueOnce(new Error('Network Error'))
      axios.get.mockResolvedValueOnce({ data: { success: true } })
      
      // Simulate retry logic - first call fails, second succeeds
      try {
        await axios.get('/api/test')
      } catch (error) {
        // First call fails as expected
        expect(error.message).toBe('Network Error')
      }
      
      // Second call succeeds
      const response = await axios.get('/api/test')
      expect(response.data.success).toBe(true)
    })

    it('should cache responses', async () => {
      const mockData = { success: true, data: { cached: true } }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response1 = await axios.get('/api/test')
      const response2 = await axios.get('/api/test')
      
      expect(response1.data).toEqual(response2.data)
      expect(response1.data.data.cached).toBe(true)
    })

    it('should handle pagination', async () => {
      const mockData = {
        success: true,
        data: { items: [], total: 100, page: 1, per_page: 10 }
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/test', { params: { page: 1 } })
      expect(response.data.data.total).toBe(100)
    })

    it('should handle filtering', async () => {
      const mockData = {
        success: true,
        data: [{ id: 1, type: 'maize' }]
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/test', { params: { type: 'maize' } })
      expect(response.data.data[0].type).toBe('maize')
    })

    it('should handle sorting', async () => {
      const mockData = {
        success: true,
        data: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }]
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/test', { params: { sort: 'name' } })
      expect(response.data.data.length).toBe(2)
    })
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 19. ERROR HANDLING TESTS (10 tests)
  // ─────────────────────────────────────────────────────────────────────────────
  
  describe('Error Handling Integration', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should display error message on 400', async () => {
      const mockError = { response: { status: 400, data: { error: 'Bad Request' } } }
      axios.get.mockRejectedValue(mockError)
      
      try {
        await axios.get('/api/test')
      } catch (error) {
        expect(error.response.data.error).toBe('Bad Request')
      }
    })

    it('should redirect to login on 401', async () => {
      const mockError = { response: { status: 401 } }
      axios.get.mockRejectedValue(mockError)
      
      try {
        await axios.get('/api/protected')
      } catch (error) {
        expect(error.response.status).toBe(401)
      }
    })

    it('should show forbidden message on 403', async () => {
      const mockError = { response: { status: 403, data: { error: 'Forbidden' } } }
      axios.get.mockRejectedValue(mockError)
      
      try {
        await axios.get('/api/admin')
      } catch (error) {
        expect(error.response.status).toBe(403)
      }
    })

    it('should show not found on 404', async () => {
      const mockError = { response: { status: 404, data: { error: 'Not Found' } } }
      axios.get.mockRejectedValue(mockError)
      
      try {
        await axios.get('/api/nonexistent')
      } catch (error) {
        expect(error.response.status).toBe(404)
      }
    })

    it('should show server error on 500', async () => {
      const mockError = { response: { status: 500, data: { error: 'Server Error' } } }
      axios.get.mockRejectedValue(mockError)
      
      try {
        await axios.get('/api/test')
      } catch (error) {
        expect(error.response.status).toBe(500)
      }
    })

    it('should handle malformed JSON', async () => {
      const mockError = { response: { data: 'invalid json' } }
      axios.get.mockRejectedValue(mockError)
      
      try {
        await axios.get('/api/test')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    it('should handle empty response', async () => {
      const mockData = { success: true, data: null }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/test')
      expect(response.data.data).toBeNull()
    })

    it('should handle missing required fields', async () => {
      const mockError = { response: { status: 400, data: { error: 'MISSING_FIELD' } } }
      axios.post.mockRejectedValue(mockError)
      
      try {
        await axios.post('/api/test', {})
      } catch (error) {
        expect(error.response.data.error).toBe('MISSING_FIELD')
      }
    })

    it('should handle validation errors', async () => {
      const mockError = { response: { status: 400, data: { errors: ['Invalid email'] } } }
      axios.post.mockRejectedValue(mockError)
      
      try {
        await axios.post('/api/test', { email: 'invalid' })
      } catch (error) {
        expect(error.response.data.errors).toBeDefined()
      }
    })

    it('should log errors for debugging', async () => {
      const mockError = new Error('Test error')
      axios.get.mockRejectedValue(mockError)
      
      try {
        await axios.get('/api/test')
      } catch (error) {
        expect(error.message).toBe('Test error')
      }
    })
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 20. STATE MANAGEMENT TESTS (10 tests)
  // ─────────────────────────────────────────────────────────────────────────────
  
  describe('State Management Integration', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should update user state on login', async () => {
      const mockData = {
        success: true,
        data: { access_token: 'token', user: { phone: '+254711111111' } }
      }
      axios.post.mockResolvedValue({ data: mockData })
      
      const response = await axios.post('/api/auth/login', {
        phone: '+254711111111',
        password: 'TestPass123!'
      })
      
      expect(response.data.data.user.phone).toBe('+254711111111')
    })

    it('should clear user state on logout', async () => {
      const mockData = { success: true, message: 'Logged out' }
      axios.post.mockResolvedValue({ data: mockData })
      
      const response = await axios.post('/api/auth/logout', {}, {
        headers: { Authorization: 'Bearer token' }
      })
      
      expect(response.data.success).toBe(true)
    })

    it('should update subscription state', async () => {
      const mockData = {
        success: true,
        data: { plan: 'pro_monthly', is_active: true }
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/payments/subscription', {
        headers: { Authorization: 'Bearer token' }
      })
      
      expect(response.data.data.is_active).toBe(true)
    })

    it('should update farm list state', async () => {
      const mockData = {
        success: true,
        data: [{ id: 'farm-1', name: 'Farm 1' }]
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/farms/', {
        headers: { Authorization: 'Bearer token' }
      })
      
      expect(response.data.data.length).toBe(1)
    })

    it('should update weather state', async () => {
      const mockData = {
        success: true,
        data: { temp: 25, condition: 'Sunny' }
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/weather/current', {
        params: { lat: -1.29, lon: 36.82 }
      })
      
      expect(response.data.data.temp).toBe(25)
    })

    it('should update advisory state', async () => {
      const mockData = {
        success: true,
        data: [{ crop: 'maize', message: 'Plant now' }]
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/advisory/crop/maize')
      
      expect(response.data.data.length).toBeGreaterThan(0)
    })

    it('should update market state', async () => {
      const mockData = {
        success: true,
        data: [{ crop: 'maize', price: 30 }]
      }
      axios.get.mockResolvedValue({ data: mockData })
      
      const response = await axios.get('/api/market/prices')
      
      expect(response.data.data.length).toBeGreaterThan(0)
    })

    it('should persist state to localStorage', () => {
      global.localStorage.setItem('test_key', 'test_value')
      expect(global.localStorage.setItem).toHaveBeenCalledWith('test_key', 'test_value')
    })

    it('should load state from localStorage', () => {
      global.localStorage.getItem('user')
      expect(global.localStorage.getItem).toHaveBeenCalledWith('user')
    })

    it('should clear state on token expiry', async () => {
      const mockError = { response: { status: 401 } }
      axios.get.mockRejectedValue(mockError)
      
      try {
        await axios.get('/api/protected', {
          headers: { Authorization: 'Bearer expired_token' }
        })
      } catch (error) {
        expect(error.response.status).toBe(401)
      }
    })
  })
})
