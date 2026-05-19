import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from "react";
import authAPI from "../api/auth";
import toast from "react-hot-toast";

export const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    // During hot reload, the context might be temporarily unavailable
    // Return default values instead of throwing an error
    if (typeof window !== 'undefined' && window.location?.pathname) {
      console.warn("useAuth must be used within AuthProvider - returning default values");
      return {
        user: null,
        isLoading: false,
        isAuthenticated: false,
        isFarmer: false,
        isAdmin: false,
        isAgroDealer: false,
        isNGO: false,
        login: () => ({ success: false }),
        logout: () => {},
        updateUser: () => {},
        getDashboardPath: () => "/dashboard",
      };
    }
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }) {
  // Type declarations for useState hooks
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFarmer, setIsFarmer] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAgroDealer, setIsAgroDealer] = useState(false);
  const [isNGO, setIsNGO] = useState(false);
  
  // Prevent re-render loops with refs
  const isLoadingRef = useRef(false);
  const isAuthenticatedRef = useRef(false);

  // Load persisted auth state on app startup
  useEffect(() => {
    const loadAuth = () => {
      try {
        const token = localStorage.getItem('access_token');
        const userData = localStorage.getItem('user_data');

        if (token && userData) {
          const parsed = JSON.parse(userData);
          setUser(parsed);
          setIsAuthenticated(true);
          setIsFarmer(parsed.role === "farmer");
          setIsAdmin(parsed.role === "admin");
          setIsAgroDealer(parsed.role === "agro_dealer");
          setIsNGO(parsed.role === "ngo_partner");
          console.log('[Auth] Restored session for:', parsed.role);
        } else {
          console.log('[Auth] No saved session found');
        }
      } catch (err) {
        console.error('[Auth] Failed to restore session:', err);
        // Clear corrupted data
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
      } finally {
        setIsLoading(false);
      }
    };

    loadAuth();
  }, []);

  // Role-based computed values (no duplicates - use state setters instead)

  const login = useCallback((userData, accessToken, refreshToken) => {
    // Save tokens with correct key names
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('user_data', JSON.stringify(userData));

    // Update state
    setUser(userData);
    setIsAuthenticated(true);
    setIsFarmer(userData.role === "farmer");
    setIsAdmin(userData.role === "admin");
    setIsAgroDealer(userData.role === "agro_dealer");
    setIsNGO(userData.role === "ngo_partner");

    console.log('[Auth] Logged in as:', userData.role, userData.phone);
  }, []);

  const logout = useCallback(async () => {
    try {
      // Try to call logout API (best effort)
      const token = localStorage.getItem('access_token');
      if (token) {
        // Import API dynamically to avoid circular dependency
        const { default: API } = await import('../api/axios');
        await API.post('/auth/logout').catch(() => {}); // Ignore errors
      }
    } finally {
      // Always clear local storage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');

      setUser(null);
      setIsAuthenticated(false);
      setIsFarmer(false);
      setIsAdmin(false);
      setIsAgroDealer(false);
      setIsNGO(false);

      console.log('[Auth] Logged out');
    }
  }, []);

  const updateUser = useCallback((updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('user_data', JSON.stringify(updated));
  }, [user]);

  const getDashboardPath = useCallback((role) => {
    const paths = {
      admin: '/admin',
      agro_dealer: '/dealer',
      ngo_partner: '/ngo',
      county_officer: '/admin',
      farmer: '/dashboard',
    };
    return paths[role] || '/dashboard';
  }, []);

  const value = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated,
    isFarmer,
    isAdmin,
    isAgroDealer,
    isNGO,
    login,
    logout,
    updateUser,
    getDashboardPath,
  }), [user, isLoading, isAuthenticated, isFarmer, isAdmin, isAgroDealer, isNGO, login, logout, updateUser, getDashboardPath]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
