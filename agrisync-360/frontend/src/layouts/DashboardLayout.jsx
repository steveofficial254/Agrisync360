
import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Cloud, 
  BookOpen, 
  TrendingUp, 
  User, 
  CreditCard, 
  Menu, 
  X,
  LogOut,
  Settings,
  HelpCircle,
  Package,
  Send,
  Users,
  MessageSquare,
  MessageCircle,
  Activity,
  Box,
  Clipboard,
  Calendar,
  DollarSign,
  Leaf,
  Droplets,
  Bug,
  Building2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isFarmer, isAdmin, isAgroDealer, isNGO } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const farmerNav = [
    { name: 'Dashboard', href: '/farmer/dashboard', icon: Home, label: 'Nyumbani', labelEn: 'Home' },
    { name: 'AI Assistant', href: '/farmer/ai-chat', icon: MessageSquare, label: 'AI', labelEn: 'AI' },
    { name: 'Community', href: '/farmer/community', icon: MessageCircle, label: 'Jamii', labelEn: 'Community' },
    { name: 'Weather', href: '/farmer/weather', icon: Cloud, label: 'Hewa', labelEn: 'Weather' },
    { name: 'Advisory', href: '/farmer/advisory', icon: BookOpen, label: 'Ushauri', labelEn: 'Advisory' },
    { name: 'Market', href: '/farmer/market', icon: TrendingUp, label: 'Soko', labelEn: 'Market' },
    { name: 'Market Pro', href: '/farmer/market-pro', icon: Building2, label: 'Soko+', labelEn: 'Market Pro' },
    { name: 'Calendar', href: '/farmer/calendar', icon: Calendar, label: 'Kalenda', labelEn: 'Calendar' },
    { name: 'Financials', href: '/farmer/financials', icon: DollarSign, label: 'Fedha', labelEn: 'Financials' },
    { name: 'Soil Health', href: '/farmer/soil-health', icon: Leaf, label: 'Ardhi', labelEn: 'Soil' },
    { name: 'Irrigation', href: '/farmer/irrigation', icon: Droplets, label: 'Maji', labelEn: 'Irrigation' },
    { name: 'Pest Library', href: '/farmer/pest-library', icon: Bug, label: 'Wadudu', labelEn: 'Pests' },
    { name: 'Yields', href: '/farmer/yield-tracker', icon: Activity, label: 'Mavuno', labelEn: 'Yields' },
    { name: 'Farm Ops', href: '/farmer/farm-ops', icon: Clipboard, label: 'Kazi', labelEn: 'Ops' },
    { name: 'Greenhouse', href: '/farmer/greenhouse', icon: Box, label: 'NyumbaK', labelEn: 'Greenhouse' },
    { name: 'Profile', href: '/farmer/profile', icon: User, label: 'Akaunti', labelEn: 'Profile' },
    { name: 'Subscription', href: '/farmer/subscription', icon: CreditCard, label: 'Malipo', labelEn: 'Subscription' },
  ];

  const adminNav = [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Farmers', href: '/admin/farmers', icon: User },
    { name: 'Advisory', href: '/admin/advisory', icon: BookOpen },
    { name: 'Market', href: '/admin/market', icon: TrendingUp },
    { name: 'Alerts', href: '/admin/alerts', icon: HelpCircle },
    { name: 'Logout', action: handleLogout, icon: LogOut, variant: 'danger' },
  ];

  const dealerNav = [
    { name: 'Dashboard', href: '/dealer', icon: Home },
    { name: 'Products', href: '/dealer/products', icon: Package },
    { name: 'Farmers', href: '/dealer/farmers', icon: User },
    { name: 'Broadcasts', href: '/dealer/broadcasts', icon: Send },
    { name: 'Profile', href: '/dealer/profile', icon: User },
  ];

  const ngoNav = [
    { name: 'Dashboard', href: '/ngo', icon: Home },
    { name: 'Farmers', href: '/ngo/farmers', icon: User },
    { name: 'Batches', href: '/ngo/batches', icon: Users },
    { name: 'Broadcasts', href: '/ngo/broadcasts', icon: Send },
    { name: 'Profile', href: '/ngo/profile', icon: User },
  ];

  const getNavigation = () => {
    if (isAdmin) return adminNav;
    if (isAgroDealer) return dealerNav;
    if (isNGO) return ngoNav;
    return farmerNav;
  };

  const navigation = getNavigation();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">A3</span>
            </div>
            <span className="ml-2 text-xl font-semibold text-gray-900">AgriSync</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    if (item.action) {
                      item.action();
                    } else {
                      navigate(item.href);
                      setSidebarOpen(false);
                    }
                  }}
                  className={`
                    w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${isActive
                      ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                    ${item.variant === 'danger' ? 'text-red-600 hover:bg-red-50 hover:text-red-700' : ''}
                  `}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </button>
              );
            })}
          </div>

          {/* User section */}
          <div className="mt-8 pt-6 border-t">
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-gray-900">
                {user?.phone || 'User'}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role?.replace('_', ' ') || 'farmer'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full mt-2 flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 lg:ml-0">
        {/* Top header */}
        <header className="bg-white shadow-sm border-b lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">A3</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          <Outlet />
        </main>

        {/* Bottom navigation for mobile */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30
                bg-white border-t border-gray-200 shadow-lg
                safe-area-inset-bottom">
          <div className="flex items-stretch h-16">
            {navigation.slice(0, 5).map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <button
                  key={item.name}
                  onClick={() => navigate(item.href)}
                  className={`
                    flex-1 flex-col items-center justify-center
                    py-2 px-1 text-xs relative
                    ${isActive ? 'text-primary-600' : 'text-gray-500'}
                    hover:bg-gray-50 transition-colors duration-200
                  `}
                >
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                  <span className="mt-1">{item.label || item.name}</span>
                  {isActive && <div className="nav-dot" />}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
