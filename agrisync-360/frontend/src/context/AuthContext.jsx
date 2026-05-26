import { createContext, useContext, useState,
         useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    try {
      const token = localStorage.getItem('access_token')
      const userData = localStorage.getItem('user_data')
      if (token && userData) {
        setUser(JSON.parse(userData))
        setIsAuthenticated(true)
      }
    } catch (e) {
      localStorage.clear()
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback((userData, accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
    localStorage.setItem('user_data', JSON.stringify(userData))
    setUser(userData)
    setIsAuthenticated(true)
  }, [])

  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => {})
      }
    } finally {
      localStorage.clear()
      setUser(null)
      setIsAuthenticated(false)
    }
  }, [])

  const updateUser = useCallback((updates) => {
    const updated = { ...user, ...updates }
    setUser(updated)
    localStorage.setItem('user_data', JSON.stringify(updated))
  }, [user])

  const getDashboardPath = useCallback((role) => {
    const paths = {
      admin: '/admin', agro_dealer: '/dealer',
      ngo_partner: '/ngo', county_officer: '/admin',
      farmer: '/farmer/dashboard',
    }
    return paths[role] || '/farmer/dashboard'
  }, [])

  return (
    <AuthContext.Provider value={{
      user, isLoading, isAuthenticated,
      isFarmer: user?.role === 'farmer',
      isAdmin: user?.role === 'admin',
      isAgroDealer: user?.role === 'agro_dealer',
      isNGO: user?.role === 'ngo_partner',
      login, logout, updateUser, getDashboardPath,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
