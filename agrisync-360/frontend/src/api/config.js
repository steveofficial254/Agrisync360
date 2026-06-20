/**
 * API Configuration
 * Controls whether to use real API or mock data
 */

// Set to true to use mock data, false to use real API
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.DEV

// API base URL for real API
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Export configuration
export const apiConfig = {
  useMock: USE_MOCK_API,
  baseUrl: API_BASE_URL,
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000
}
