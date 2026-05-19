import axios from 'axios'

const API = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Handle 401 responses
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    
    if (error.response?.status === 401 &&
        !original._retry &&
        !original.url?.includes('/auth/')) {
      original._retry = true
      
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          const res = await axios.post('/api/auth/refresh', {}, {
            headers: { Authorization: `Bearer ${refreshToken}` }
          })
          const newToken = res.data?.data?.access_token
          if (newToken) {
            localStorage.setItem('access_token', newToken)
            original.headers.Authorization = `Bearer ${newToken}`
            return API(original)
          }
        } catch (e) {
          // Refresh failed
        }
      }
      
      // Session expired
      localStorage.clear()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    
    return Promise.reject({
      status: error.response?.status,
      message: error.response?.data?.message ||
               error.message || 'Request failed',
      error: error.response?.data?.error || 'UNKNOWN',
      success: false,
    })
  }
)

export default API
