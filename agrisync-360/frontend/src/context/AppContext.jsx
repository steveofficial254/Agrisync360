import { createContext, useMemo, useState } from "react";

export const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const value = useMemo(() => ({ loading, setLoading }), [loading]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
