import React, { useState } from 'react';
import { 
  Home, Cloud, FileText, TrendingUp, User, Settings, 
  LogOut, Menu, X, Sprout, ChevronDown, ChevronRight
} from 'lucide-react';

export default function Sidebar({
  isOpen,
  onClose,
  user = null,
  activeItem = 'dashboard',
  onItemClick,
  className = '',
  variant = 'desktop',
  ...props
}) {
  const [expandedSections, setExpandedSections] = useState(new Set(['main']));

  const navigationItems = [
    {
      section: 'main',
      title: 'Main',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/dashboard' },
        { id: 'weather', label: 'Weather', icon: Cloud, href: '/weather' },
        { id: 'advisory', label: 'Advisory', icon: FileText, href: '/advisory' },
        { id: 'market', label: 'Market', icon: TrendingUp, href: '/market' },
      ]
    },
    {
      section: 'farm',
      title: 'Farm Management',
      items: [
        { id: 'farms', label: 'My Farms', icon: '🌾', href: '/farms' },
        { id: 'crops', label: 'Crops', icon: '🌱', href: '/crops' },
        { id: 'planting', label: 'Planting Calendar', icon: '📅', href: '/planting' },
      ]
    },
    {
      section: 'account',
      title: 'Account',
      items: [
        { id: 'profile', label: 'Profile', icon: User, href: '/profile' },
        { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
        { id: 'logout', label: 'Logout', icon: LogOut, action: 'logout' },
      ]
    }
  ];

  const toggleSection = (section) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleItemClick = (item) => {
    if (item.action === 'logout') {
      // Handle logout
      if (onItemClick) onItemClick('logout');
    } else {
      if (onItemClick) {
        onItemClick(item.id);
      } else {
        window.location.href = item.href;
      }
    }
    if (variant === 'mobile') {
      onClose();
    }
  };

  const sidebarClasses = variant === 'mobile'
    ? `fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`
    : 'w-64 bg-white border-r border-gray-200 h-full overflow-hidden';

  if (variant === 'mobile' && !isOpen) return null;

  return (
    <div className={`${sidebarClasses} ${className}`} {...props}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900 font-display">AgriSync 360</span>
          </div>
          
          {variant === 'mobile' && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* User Info */}
      {user && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary-700">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {navigationItems.map((section) => (
            <div key={section.section}>
              <button
                onClick={() => toggleSection(section.section)}
                className="w-full flex items-center justify-between p-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <span>{section.title}</span>
                {expandedSections.has(section.section) ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              
              {expandedSections.has(section.section) && (
                <div className="mt-1 space-y-1">
                  {section.items.map((item) => {
                    const Icon = typeof item.icon === 'string' ? null : item.icon;
                    const isActive = activeItem === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                          isActive
                            ? 'bg-primary-50 text-primary-700 font-medium'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        {Icon ? (
                          <Icon className="w-4 h-4" />
                        ) : (
                          <span className="text-base">{item.icon}</span>
                        )}
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          <p>© 2026 AgriSync 360</p>
          <p className="mt-1">Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
}
