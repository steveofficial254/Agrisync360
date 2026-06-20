import api from "./axios";
import { apiConfig } from './config';
import { mockAuthAPI } from './mockApi';

const authApi = apiConfig.useMock ? mockAuthAPI : api;

export const authAPI = {
  register: (data) => apiConfig.useMock ? mockAuthAPI.register(data) : api.post("/auth/register", data),
  verifyOTP: (data) => apiConfig.useMock ? mockAuthAPI.verifyOTP?.(data) : api.post("/auth/verify-otp", data),
  login: (data) => apiConfig.useMock ? mockAuthAPI.login(data) : api.post("/auth/login", data),
  logout: () => apiConfig.useMock ? mockAuthAPI.logout() : api.post("/auth/logout"),
  forgotPassword: (data) => apiConfig.useMock ? mockAuthAPI.forgotPassword?.(data) : api.post("/auth/forgot-password", data),
  verifyResetOTP: (data) => apiConfig.useMock ? mockAuthAPI.verifyResetOTP?.(data) : api.post("/auth/verify-reset-otp", data),
  resetPassword: (data) => apiConfig.useMock ? mockAuthAPI.resetPassword?.(data) : api.post("/auth/reset-password", data),
  resendOTP: (data) => apiConfig.useMock ? mockAuthAPI.resendOTP?.(data) : api.post("/auth/resend-otp", data),
};

export default authAPI;
