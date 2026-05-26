import { Link } from 'react-router-dom';
import { Leaf, Phone, Mail, Globe, Facebook, Twitter, Instagram } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-gray-50 to-gray-100 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand section */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
                <Leaf size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">AgriSync 360</h3>
                <p className="text-xs text-gray-500">Smart farming solutions</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Empowering Kenyan farmers with real-time weather insights, 
              market intelligence, and expert agricultural advisories.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/farmer/dashboard" className="text-sm text-gray-600 hover:text-primary-600 transition-colors flex items-center gap-1">
                  <span className="w-1 h-1 bg-primary-400 rounded-full"></span>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/farmer/weather" className="text-sm text-gray-600 hover:text-primary-600 transition-colors flex items-center gap-1">
                  <span className="w-1 h-1 bg-primary-400 rounded-full"></span>
                  Weather
                </Link>
              </li>
              <li>
                <Link to="/farmer/advisory" className="text-sm text-gray-600 hover:text-primary-600 transition-colors flex items-center gap-1">
                  <span className="w-1 h-1 bg-primary-400 rounded-full"></span>
                  Advisory
                </Link>
              </li>
              <li>
                <Link to="/farmer/market" className="text-sm text-gray-600 hover:text-primary-600 transition-colors flex items-center gap-1">
                  <span className="w-1 h-1 bg-primary-400 rounded-full"></span>
                  Market
                </Link>
              </li>
              <li>
                <Link to="/farmer/subscription" className="text-sm text-gray-600 hover:text-primary-600 transition-colors flex items-center gap-1">
                  <span className="w-1 h-1 bg-primary-400 rounded-full"></span>
                  Subscription
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <a href="mailto:support@agrisync360.co.ke" className="text-sm text-gray-600 hover:text-primary-600 transition-colors flex items-center gap-2">
                  <Mail size={14} />
                  support@agrisync360.co.ke
                </a>
              </li>
              <li>
                <a href="tel:+254700000000" className="text-sm text-gray-600 hover:text-primary-600 transition-colors flex items-center gap-2">
                  <Phone size={14} />
                  +254 700 000 000
                </a>
              </li>
              <li>
                <a href="https://agrisync360.co.ke" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-primary-600 transition-colors flex items-center gap-2">
                  <Globe size={14} />
                  agrisync360.co.ke
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Stay Updated</h4>
            <p className="text-sm text-gray-600 mb-4">
              Get the latest farming tips and market updates
            </p>
            <div className="space-y-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <button className="w-full bg-primary-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-200 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              &copy; {year} AgriSync 360. All rights reserved.
            </p>
            
            {/* Social links */}
            <div className="flex items-center gap-4">
              <a href="#" className="text-gray-400 hover:text-primary-600 transition-colors">
                <Facebook size={18} />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary-600 transition-colors">
                <Twitter size={18} />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary-600 transition-colors">
                <Instagram size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
