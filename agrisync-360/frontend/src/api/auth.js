import api from "./axios";

export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  verifyOTP: (data) => api.post("/auth/verify-otp", data),
  login: (data) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  forgotPassword: (data) => api.post("/auth/forgot-password", data),
  verifyResetOTP: (data) => api.post("/auth/verify-reset-otp", data),
  resetPassword: (data) => api.post("/auth/reset-password", data),
  resendOTP: (data) => api.post("/auth/resend-otp", data),
};

export default authAPI;
