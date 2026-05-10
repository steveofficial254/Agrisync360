import React from 'react';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-earth-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
            <span className="text-white text-2xl font-bold">A3</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">AgriSync 360</h1>
          <p className="text-gray-600 mt-1">Smart farming for better yields</p>
        </div>
        
        {/* Auth Form Container */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {children}
        </div>
        
        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>&copy; 2026 AgriSync 360. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
