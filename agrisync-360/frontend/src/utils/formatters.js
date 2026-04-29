export const formatCurrency = (n) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(n || 0);
