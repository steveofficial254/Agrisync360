import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, LogOut, Home, MessageSquare, MessageCircle, Cloud, BookOpen,
  Users, TrendingUp, AlertTriangle, Package, Send
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SidebarNav from './SidebarNav';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isFarmer, isAdmin, isAgroDealer, isNGO } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const farmerNav = [
    { name: 'Dashboard', href: '/farmer/dashboard', icon: Home, label: 'Nyumbani' },
    { name: 'AI Assistant', href: '/farmer/ai-chat', icon: MessageSquare, label: 'AI' },
    { name: 'Community', href: '/farmer/community', icon: MessageCircle, label: 'Jamii' },
    { name: 'Weather', href: '/farmer/weather', icon: Cloud, label: 'Hewa' },
    { name: 'Advisory', href: '/farmer/advisory', icon: BookOpen, label: 'Ushauri' },
  ];

  const adminNav = [
    { name: 'Dashboard', href: '/admin', icon: Home, label: 'Home' },
    { name: 'Farmers', href: '/admin/farmers', icon: Users, label: 'Farmers' },
    { name: 'Advisory', href: '/admin/advisory', icon: BookOpen, label: 'Advisories' },
    { name: 'Market', href: '/admin/market', icon: TrendingUp, label: 'Market' },
    { name: 'Alerts', href: '/admin/alerts', icon: AlertTriangle, label: 'Alerts' },
  ];

  const dealerNav = [
    { name: 'Dashboard', href: '/dealer', icon: Home, label: 'Home' },
    { name: 'Products', href: '/dealer/products', icon: Package, label: 'Products' },
    { name: 'Farmers', href: '/dealer/farmers', icon: Users, label: 'Farmers' },
    { name: 'Broadcasts', href: '/dealer/broadcasts', icon: Send, label: 'Broadcasts' },
  ];

  const ngoNav = [
    { name: 'Dashboard', href: '/ngo', icon: Home, label: 'Home' },
    { name: 'Farmers', href: '/ngo/farmers', icon: Users, label: 'Farmers' },
    { name: 'Batches', href: '/ngo/batches', icon: Package, label: 'Batches' },
    { name: 'Broadcasts', href: '/ngo/broadcasts', icon: Send, label: 'Broadcasts' },
  ];

  const getNavigation = () => {
    if (isAdmin) return adminNav;
    if (isAgroDealer) return dealerNav;
    if (isNGO) return ngoNav;
    return farmerNav;
  };

  const navigation = getNavigation();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <SidebarNav
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        role={user?.role}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4
                          border-b border-green-100 bg-white sticky top-0 z-20 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-green-50 rounded-lg transition-colors"
          >
            <Menu size={20} className="text-gray-600" />
          </button>
          <p className="font-bold text-gray-900 font-display">AgriSync 360</p>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} className="text-red-600" />
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 min-w-0">
          {children || <Outlet />}
        </main>

        {/* Bottom navigation for mobile */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30
                bg-white border-t border-green-100 shadow-lg
                safe-area-inset-bottom">
          <div className="flex items-stretch h-16">
            {navigation.slice(0, 5).map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <button
                  key={item.name}
                  onClick={() => navigate(item.href)}
                  className={`
                    flex-1 flex flex-col items-center justify-center
                    py-2 px-1 text-xs relative transition-colors duration-200
                    ${isActive ? 'text-green-600 font-semibold' : 'text-gray-500'}
                    hover:bg-green-50
                  `}
                >
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                  <span className="mt-1 font-sans text-2xs">{item.label || item.name}</span>
                  {isActive && <div className="absolute top-1.5 w-1.5 h-1.5 bg-green-600 rounded-full" />}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
