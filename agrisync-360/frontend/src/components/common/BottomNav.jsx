import React from 'react';
import { Home, Cloud, FileText, TrendingUp, User } from 'lucide-react';

export default function BottomNav({
  activeTab = 'home',
  onTabChange,
  showLabels = true,
  className = '',
  ...props
}) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home, href: '/dashboard' },
    { id: 'weather', label: 'Weather', icon: Cloud, href: '/weather' },
    { id: 'advisory', label: 'Advisory', icon: FileText, href: '/advisory' },
    { id: 'market', label: 'Market', icon: TrendingUp, href: '/market' },
    { id: 'profile', label: 'Profile', icon: User, href: '/profile' },
  ];

  const handleTabClick = (item) => {
    if (onTabChange) {
      onTabChange(item.id);
    } else {
      window.location.href = item.href;
    }
  };

  return (
    <nav className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 ${className}`} {...props}>
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item)}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'text-primary-600 bg-primary-50' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-current'}`} />
              {showLabels && (
                <span className={`text-xs font-medium ${
                  isActive ? 'text-primary-600' : 'text-current'
                }`}>
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Safe area for iPhone notch */}
      <div className="h-safe-area-inset-bottom bg-white" />
    </nav>
  );
}
