import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import { Toaster } from "react-hot-toast";
import { InstallBanner, OfflineBanner } from './components/pwa/InstallBanner';

// Layouts
import AuthLayout from "./layouts/AuthLayout";
import DashboardLayout from "./layouts/DashboardLayout";

// Public pages
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";

// Auth pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import VerifyOTP from "./pages/auth/VerifyOTP";
import ForgotPassword from "./pages/auth/ForgotPassword";

// Farmer pages
import Dashboard from "./pages/farmer/Dashboard";
import Weather from "./pages/farmer/Weather";
import Advisory from "./pages/farmer/Advisory";
import Market from "./pages/farmer/Market";
import Profile from "./pages/farmer/Profile";
import Subscription from "./pages/farmer/Subscription";
import FarmSetup from "./pages/farmer/FarmSetup";
import AIAssistant from "./pages/farmer/AIAssistant";
import Community from "./pages/farmer/Community";
import YieldTracker from "./pages/farmer/YieldTracker";
import Greenhouse from "./pages/farmer/Greenhouse";
import FarmOperations from "./pages/farmer/FarmOperations";
import PlantingCalendar from "./pages/farmer/PlantingCalendar";
import FinancialManager from "./pages/farmer/FinancialManager";
import SoilHealth from "./pages/farmer/SoilHealth";
import IrrigationManager from "./pages/farmer/IrrigationManager";
import PestLibrary from "./pages/farmer/PestLibrary";
import MarketPro from "./pages/farmer/MarketPro";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import FarmerManagement from "./pages/admin/FarmerManagement";
import AdvisoryManagement from "./pages/admin/AdvisoryManagement";
import MarketManagement from "./pages/admin/MarketManagement";
import AlertManagement from "./pages/admin/AlertManagement";

// Agro-dealer pages
import DealerDashboard from "./pages/agro_dealer/DealerDashboard";

// NGO pages
import NGODashboard from "./pages/ngo/NGODashboard";

// Protected Route wrapper - completely static, no automatic redirects
function ProtectedRoute({ children, requiredRole }) {
  let authValues;
  try {
    authValues = useAuth();
  } catch (error) {
    // Handle case where AuthContext is not available (hot reload issue)
    console.warn("AuthContext not available in ProtectedRoute, using fallback");
    authValues = {
      isAuthenticated: false,
      isLoading: false,
      user: null
    };
  }

  const { isAuthenticated, isLoading, user } = authValues;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Don't automatically redirect - let components handle auth state
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to access this page.</p>
          <a 
            href="/login" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
          <a
            href="/farmer/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return children;
}

// Public Route wrapper - completely static, no automatic redirects
function PublicRoute({ children }) {
  let authValues;
  try {
    authValues = useAuth();
  } catch (error) {
    // Handle case where AuthContext is not available (hot reload issue)
    console.warn("AuthContext not available in PublicRoute, using fallback");
    authValues = {
      isAuthenticated: false,
      isLoading: false,
      user: null
    };
  }

  const { isAuthenticated, isLoading, user } = authValues;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Don't automatically redirect authenticated users
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Already Logged In</h2>
          <p className="text-gray-600 mb-6">You are already logged in.</p>
          <a
            href="/farmer/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <AuthLayout>{children}</AuthLayout>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/community" element={<Community />} />
      
      {/* Auth routes */}
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />
      <Route path="/verify-otp" element={
        <PublicRoute>
          <VerifyOTP />
        </PublicRoute>
      } />
      <Route path="/forgot-password" element={
        <PublicRoute>
          <ForgotPassword />
        </PublicRoute>
      } />

      {/* Protected routes for farmers */}
      <Route path="/farmer" element={
        <ProtectedRoute requiredRole="farmer">
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="weather" element={<Weather />} />
        <Route path="advisory" element={<Advisory />} />
        <Route path="market" element={<Market />} />
        <Route path="profile" element={<Profile />} />
        <Route path="subscription" element={<Subscription />} />
        <Route path="farm-setup" element={<FarmSetup />} />
        <Route path="ai-chat" element={<AIAssistant />} />
        <Route path="community" element={<Community />} />
        <Route path="yield-tracker" element={<YieldTracker />} />
        <Route path="greenhouse" element={<Greenhouse />} />
        <Route path="farm-ops" element={<FarmOperations />} />
        <Route path="calendar" element={<PlantingCalendar />} />
        <Route path="financials" element={<FinancialManager />} />
        <Route path="soil-health" element={<SoilHealth />} />
        <Route path="irrigation" element={<IrrigationManager />} />
        <Route path="pest-library" element={<PestLibrary />} />
        <Route path="market-pro" element={<MarketPro />} />
      </Route>

      {/* Legacy dashboard route - redirect to /farmer/dashboard */}
      <Route path="/dashboard" element={<Navigate to="/farmer/dashboard" replace />} />

      {/* Admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/farmers" element={
        <ProtectedRoute requiredRole="admin">
          <FarmerManagement />
        </ProtectedRoute>
      } />
      <Route path="/admin/advisory" element={
        <ProtectedRoute requiredRole="admin">
          <AdvisoryManagement />
        </ProtectedRoute>
      } />
      <Route path="/admin/market" element={
        <ProtectedRoute requiredRole="admin">
          <MarketManagement />
        </ProtectedRoute>
      } />
      <Route path="/admin/alerts" element={
        <ProtectedRoute requiredRole="admin">
          <AlertManagement />
        </ProtectedRoute>
      } />

      {/* Agro-dealer routes */}
      <Route path="/dealer" element={
        <ProtectedRoute requiredRole="agro_dealer">
          <DealerDashboard />
        </ProtectedRoute>
      } />

      {/* NGO routes */}
      <Route path="/ngo" element={
        <ProtectedRoute requiredRole="ngo_partner">
          <NGODashboard />
        </ProtectedRoute>
      } />

      {/* Error pages */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <OfflineBanner />
        <AppRoutes />
        <InstallBanner />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
            },
          }}
        />
      </AuthProvider>
    </AppProvider>
  );
}
