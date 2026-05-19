/**
 * AgriSync 360 — Axios API Client
 * Handles JWT authentication automatically
 */
import axios from 'axios'

// Create axios instance
const API = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ============================================================
// REQUEST INTERCEPTOR
// Attaches JWT token to every request automatically
// ============================================================
API.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('access_token')
    
    // Attach token if it exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    console.error('[API] Request error:', error)
    return Promise.reject(error)
  }
)

// ============================================================
// RESPONSE INTERCEPTOR
// Handles 401 errors and token refresh
// ============================================================
API.interceptors.response.use(
  (response) => {
    // Return successful responses as-is
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Don't retry auth endpoints (prevents infinite loops)
      const isAuthEndpoint = originalRequest.url?.includes('/auth/')
      
      if (!isAuthEndpoint && !originalRequest._retry) {
        originalRequest._retry = true
        
        // Try to refresh token
        const refreshToken = localStorage.getItem('refresh_token')
        
        if (refreshToken) {
          try {
            const refreshResponse = await API.post('/auth/refresh', {});
            
            const { access_token } = refreshResponse.data.data;
            
            if (access_token) {
              localStorage.setItem('access_token', access_token);
              
              // Update original request with new token
              originalRequest.headers.Authorization = `Bearer ${access_token}`;

              return API(originalRequest);
            }
          } catch (refreshError) {
            console.error('[API] Token refresh failed:', refreshError);
            
            // Clear tokens and redirect to login
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user_data');
            
            // Only redirect if not already on login page
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
            
            return Promise.reject(refreshError);
          }
        }
        
        // Refresh failed — clear auth and redirect to login
        console.warn('[API] Session expired — redirecting to login')
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        
        // Redirect to login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    }
    
    // Format error for consistent handling in components
    const formattedError = {
      status: error.response?.status,
      message: error.response?.data?.message || 
               error.message || 
               'Request failed',
      error: error.response?.data?.error || 'UNKNOWN_ERROR',
      success: false,
    }
    
    return Promise.reject(formattedError)
  }
)

export default API
