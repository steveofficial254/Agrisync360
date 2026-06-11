/**
 * Professional Sidebar Navigation
 * Green gradient theme with dynamic role-based icons and sections
 */

import { Link, useLocation } from 'react-router-dom'
import {
  Home, Cloud, BookOpen, TrendingUp, Settings, Users,
  Leaf, DollarSign, Calendar, Bug, BarChart3, Droplets,
  AlertTriangle, Sparkles, MessageSquare, Zap, Warehouse,
  Package, Send, X
} from 'lucide-react'

const FARMER_SECTIONS = [
  {
    title: 'Dashboard',
    items: [
      { path: '/farmer/dashboard', icon: Home, label: 'Dashboard' },
    ],
  },
  {
    title: 'Farm Management',
    items: [
      { path: '/farmer/calendar', icon: Calendar, label: 'Planting Calendar' },
      { path: '/farmer/soil-health', icon: Leaf, label: 'Soil Health' },
      { path: '/farmer/irrigation', icon: Droplets, label: 'Irrigation' },
      { path: '/farmer/greenhouse', icon: Warehouse, label: 'Greenhouse' },
      { path: '/farmer/farm-ops', icon: Settings, label: 'Farm Ops' },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { path: '/farmer/weather', icon: Cloud, label: 'Weather' },
      { path: '/farmer/advisory', icon: BookOpen, label: 'Advisory' },
      { path: '/farmer/pest-library', icon: Bug, label: 'Pest Library' },
      { path: '/farmer/ai-chat', icon: Sparkles, label: 'AI Assistant' },
    ],
  },
  {
    title: 'Market & Finance',
    items: [
      { path: '/farmer/market', icon: TrendingUp, label: 'Market Prices' },
      { path: '/farmer/market-pro', icon: BarChart3, label: 'Market Pro' },
      { path: '/farmer/financials', icon: DollarSign, label: 'Financials' },
      { path: '/farmer/yield-tracker', icon: Zap, label: 'Yield Tracker' },
    ],
  },
  {
    title: 'Community',
    items: [
      { path: '/farmer/community', icon: MessageSquare, label: 'Community' },
    ],
  },
  {
    title: 'Account',
    items: [
      { path: '/farmer/profile', icon: Users, label: 'Profile' },
      { path: '/farmer/subscription', icon: AlertTriangle, label: 'Subscription' },
    ],
  },
]

const ADMIN_SECTIONS = [
  {
    title: 'Admin Console',
    items: [
      { path: '/admin', icon: Home, label: 'Dashboard' },
      { path: '/admin/farmers', icon: Users, label: 'Farmers' },
      { path: '/admin/advisory', icon: BookOpen, label: 'Advisories' },
      { path: '/admin/market', icon: TrendingUp, label: 'Market Prices' },
      { path: '/admin/alerts', icon: AlertTriangle, label: 'Alerts' },
    ]
  }
]

const DEALER_SECTIONS = [
  {
    title: 'Agro-Dealer Console',
    items: [
      { path: '/dealer', icon: Home, label: 'Dashboard' },
      { path: '/dealer/products', icon: Package, label: 'Products' },
      { path: '/dealer/farmers', icon: Users, label: 'Farmers' },
      { path: '/dealer/broadcasts', icon: Send, label: 'Broadcasts' },
      { path: '/dealer/profile', icon: Users, label: 'Profile' },
    ]
  }
]

const NGO_SECTIONS = [
  {
    title: 'NGO Console',
    items: [
      { path: '/ngo', icon: Home, label: 'Dashboard' },
      { path: '/ngo/farmers', icon: Users, label: 'Farmers' },
      { path: '/ngo/batches', icon: Package, label: 'Batches' },
      { path: '/ngo/broadcasts', icon: Send, label: 'Broadcasts' },
      { path: '/ngo/profile', icon: Users, label: 'Profile' },
    ]
  }
]

const NavItem = ({ icon: Icon, label, path, active }) => (
  <Link
    to={path}
    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg
               transition-colors duration-200 text-sm font-medium
               ${active
                 ? 'bg-gradient-green text-white shadow-sm'
                 : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
               }`}
  >
    <Icon size={18} />
    <span>{label}</span>
  </Link>
)

export default function SidebarNav({ isOpen, onClose, role }) {
  const location = useLocation()

  const getSections = () => {
    switch (role) {
      case 'admin':
        return ADMIN_SECTIONS
      case 'agro_dealer':
        return DEALER_SECTIONS
      case 'ngo_partner':
        return NGO_SECTIONS
      default:
        return FARMER_SECTIONS
    }
  }

  const sections = getSections()

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r
                        border-green-100 h-screen sticky top-0 shadow-sm">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-green-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-green
                            flex items-center justify-center text-white
                            font-bold text-sm">
              A
            </div>
            <div>
              <p className="font-bold text-gray-900">AgriSync</p>
              <p className="text-xs text-gray-500 font-sans">Smart Farming</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {sections.map(section => (
            <div key={section.title}>
              <p className="px-4 mb-3 text-xs font-bold text-gray-400
                            uppercase tracking-wider">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map(item => (
                  <NavItem
                    key={item.path}
                    {...item}
                    active={location.pathname === item.path}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-green-100 p-4">
          <p className="text-xs text-gray-500 text-center font-sans">
            AgriSync 360 v1.0.0
          </p>
        </div>
      </aside>

      {/* Mobile Sidebar (Overlay) */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={onClose}
          />
          <aside className="fixed left-0 top-0 h-screen w-64 bg-white z-40
                            shadow-xl overflow-y-auto">
            <div className="p-4 flex items-center justify-between border-b
                            border-green-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-green
                                flex items-center justify-center text-white
                                font-bold">
                  A
                </div>
                <p className="font-bold text-gray-900">AgriSync</p>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-gray-100
                                                  rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {sections.map(section => (
                <div key={section.title}>
                  <p className="text-xs font-bold text-gray-400 uppercase
                                mb-2">
                    {section.title}
                  </p>
                  <div className="space-y-1">
                    {section.items.map(item => (
                      <NavItem
                        key={item.path}
                        {...item}
                        active={location.pathname === item.path}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </>
      )}
    </>
  )
}
