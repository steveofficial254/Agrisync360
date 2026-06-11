import React, { useState } from 'react';
import { Menu, X, Sprout, Bell, User, LogOut, Settings, HelpCircle } from 'lucide-react';

export default function Navbar({
  user = null,
  onLogout,
  showNotifications = true,
  notifications = [],
  className = '',
  variant = 'default',
  ...props
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    setIsMenuOpen(false);
  };

  const unreadNotifications = notifications?.filter(n => !n.read).length || 0;

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { name: 'Weather', href: '/weather', icon: '🌤️' },
    { name: 'Advisory', href: '/advisory', icon: '📋' },
    { name: 'Market', href: '/market', icon: '📈' },
    { name: 'Profile', href: '/profile', icon: '👤' },
  ];

  const userMenuItems = [
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Help', href: '/help', icon: HelpCircle },
    { name: 'Logout', action: handleLogout, icon: LogOut, variant: 'danger' },
  ];

  if (variant === 'simple') {
    return (
      <nav className={`bg-white border-b border-gray-200 ${className}`} {...props}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Sprout className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900 font-display">AgriSync 360</span>
              </div>
            </div>
            
            {user && (
              <div className="flex items-center gap-4">
                {showNotifications && (
                  <button className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
                    <Bell className="w-5 h-5" />
                    {unreadNotifications > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full" />
                    )}
                  </button>
                )}
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.role}</p>
                  </div>
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-700">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className={`bg-white border-b border-gray-200 shadow-sm ${className}`} {...props}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Sprout className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 font-display">AgriSync 360</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors duration-200 font-medium"
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.name}</span>
              </a>
            ))}
          </div>

          {/* Right side items */}
          <div className="flex items-center gap-4">
            {showNotifications && (
              <div className="relative">
                <button
                  onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                  className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full animate-pulse" />
                  )}
                </button>
                
                {showNotificationsDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications?.length > 0 ? (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                              !notification.read ? 'bg-primary-50' : ''
                            }`}
                          >
                            <p className="text-sm text-gray-900">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(notification.created_at).toLocaleString()}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          <p className="text-sm">No notifications</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                </div>
                
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center hover:bg-primary-200 transition-colors"
                  >
                    <span className="text-sm font-medium text-primary-700">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </button>
                  
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      {userMenuItems.map((item) => (
                        <button
                          key={item.name}
                          onClick={item.action || (() => window.location.href = item.href)}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                            item.variant === 'danger' ? 'text-danger-600' : 'text-gray-700'
                          }`}
                        >
                          <item.icon className="w-4 h-4" />
                          {item.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <a
                  href="/login"
                  className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
                >
                  Login
                </a>
                <a
                  href="/register"
                  className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Get Started
                </a>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.name}</span>
                </a>
              ))}
            </div>
            
            {user && (
              <div className="border-t border-gray-200 pt-4 pb-3">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                </div>
                <div className="mt-3 space-y-1">
                  {userMenuItems.map((item) => (
                    <button
                      key={item.name}
                      onClick={item.action || (() => window.location.href = item.href)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3 ${
                        item.variant === 'danger' ? 'text-danger-600' : 'text-gray-700'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
