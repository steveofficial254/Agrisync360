import { Navigate, Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import VerifyOTP from "./pages/auth/VerifyOTP";
import Dashboard from "./pages/farmer/Dashboard";
import Weather from "./pages/farmer/Weather";
import Advisory from "./pages/farmer/Advisory";
import Market from "./pages/farmer/Market";
import Profile from "./pages/farmer/Profile";
import Subscription from "./pages/farmer/Subscription";
import AdminDashboard from "./pages/admin/AdminDashboard";
import FarmerManagement from "./pages/admin/FarmerManagement";
import AdvisoryManagement from "./pages/admin/AdvisoryManagement";
import MarketManagement from "./pages/admin/MarketManagement";
import AlertManagement from "./pages/admin/AlertManagement";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/farmer" element={<Dashboard />} />
      <Route path="/farmer/weather" element={<Weather />} />
      <Route path="/farmer/advisory" element={<Advisory />} />
      <Route path="/farmer/market" element={<Market />} />
      <Route path="/farmer/profile" element={<Profile />} />
      <Route path="/farmer/subscription" element={<Subscription />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/farmers" element={<FarmerManagement />} />
      <Route path="/admin/advisory" element={<AdvisoryManagement />} />
      <Route path="/admin/market" element={<MarketManagement />} />
      <Route path="/admin/alerts" element={<AlertManagement />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
