import React from 'react';
import { Loader2, Sprout } from 'lucide-react';

// Spinner component for inline loading
export function Spinner({ 
  size = 'md', 
  className = '', 
  color = 'primary',
  variant = 'default' 
}) {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const colorClasses = {
    primary: 'text-primary-600',
    secondary: 'text-gray-600',
    white: 'text-white',
    harvest: 'text-harvest-600',
    earth: 'text-earth-600',
    danger: 'text-danger-600',
  };

  const variantClasses = {
    default: 'animate-spin',
    pulse: 'animate-pulse',
    bounce: 'animate-bounce',
  };

  const classes = [
    variantClasses[variant],
    sizeClasses[size],
    colorClasses[color],
    className
  ].filter(Boolean).join(' ');

  return <Loader2 className={classes} />;
}

// PageLoader for full page loading
export function PageLoader({ 
  message = 'Loading...', 
  showLogo = true,
  size = 'lg',
  color = 'primary'
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center max-w-sm mx-auto px-4">
        {showLogo && (
          <div className="mb-6">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Sprout className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 font-display">AgriSync 360</h1>
          </div>
        )}
        
        <Spinner size={size} color={color} className="mx-auto mb-4" />
        
        <p className="text-gray-600 text-sm font-medium animate-pulse-slow">
          {message}
        </p>
        
        <div className="mt-6 flex justify-center space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-primary-600 rounded-full animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Skeleton for content placeholders
export function Skeleton({ 
  className = '', 
  lines = 3, 
  variant = 'text',
  height = 'h-4'
}) {
  const variantClasses = {
    text: 'bg-gray-200 rounded',
    circular: 'bg-gray-200 rounded-full',
    rectangular: 'bg-gray-200 rounded-lg',
    avatar: 'bg-gray-200 rounded-full',
  };

  if (variant === 'avatar') {
    return (
      <div className={`${variantClasses[variant]} ${className} ${height} ${height}`} />
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i}
          className={`${variantClasses[variant]} animate-pulse ${height}`}
          style={{ 
            width: i === lines - 1 ? '60%' : '100%',
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
    </div>
  );
}

// CardSkeleton for card placeholders
export function CardSkeleton({ showAvatar = false, lines = 3 }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
      <div className="animate-pulse">
        <div className="flex items-start gap-3 mb-4">
          {showAvatar && (
            <Skeleton variant="avatar" height="h-10 w-10" className="flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <Skeleton height="h-5" lines={1} />
            <Skeleton height="h-4" lines={1} className="w-3/4 mt-2" />
          </div>
        </div>
        <Skeleton lines={lines} />
      </div>
    </div>
  );
}

// TableSkeleton for table placeholders
export function TableSkeleton({ rows = 5, columns = 4, showHeader = true }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="animate-pulse">
        {showHeader && (
          <div className="border-b border-gray-200 p-4 bg-gray-50">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, i) => (
                <Skeleton key={i} height="h-4" variant="rectangular" />
              ))}
            </div>
          </div>
        )}
        
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="border-b border-gray-200 p-4 last:border-b-0">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton key={colIndex} height="h-3" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ListSkeleton for list placeholders
export function ListSkeleton({ items = 3, showAvatar = false }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <CardSkeleton key={i} showAvatar={showAvatar} lines={2} />
      ))}
    </div>
  );
}

// ButtonSkeleton for button placeholders
export function ButtonSkeleton({ width = 'w-20', height = 'h-10' }) {
  return (
    <Skeleton 
      variant="rectangular" 
      className={width} 
      height={height}
    />
  );
}

// Default export for backward compatibility
export default function Loader({ size = 'md', className = '' }) {
  return <Spinner size={size} className={className} />;
}
