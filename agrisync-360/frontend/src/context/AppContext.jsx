import { createContext, useContext, useMemo, useState } from "react";

export const AppContext = createContext(null);

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}

export function AppProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const value = useMemo(() => ({ 
    loading, 
    setLoading,
    sidebarOpen,
    setSidebarOpen
  }), [loading, sidebarOpen]);
  
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
