import React from 'react';

const badgeVariants = {
  // Subscription plans
  free: 'bg-gray-100 text-gray-700 border-gray-200',
  basic: 'bg-blue-50 text-blue-700 border-blue-200',
  pro: 'bg-purple-50 text-purple-700 border-purple-200',
  
  // Status indicators
  success: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-warning-50 text-warning-700 border-warning-200',
  danger: 'bg-danger-50 text-danger-700 border-danger-200',
  info: 'bg-primary-50 text-primary-700 border-primary-200',
  
  // Growth stages
  planting: 'bg-earth-50 text-earth-700 border-earth-200',
  growing: 'bg-primary-50 text-primary-700 border-primary-200',
  harvesting: 'bg-harvest-50 text-harvest-700 border-harvest-200',
  
  // Weather conditions
  sunny: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  rainy: 'bg-blue-50 text-blue-700 border-blue-200',
  cloudy: 'bg-gray-50 text-gray-700 border-gray-200',
  
  // Activity status
  active: 'bg-green-50 text-green-700 border-green-200',
  inactive: 'bg-gray-50 text-gray-500 border-gray-200',
  pending: 'bg-warning-50 text-warning-700 border-warning-200',
  
  // Market trends
  up: 'bg-green-50 text-green-700 border-green-200',
  down: 'bg-danger-50 text-danger-700 border-danger-200',
  stable: 'bg-gray-50 text-gray-700 border-gray-200',
  
  // Default
  default: 'bg-gray-50 text-gray-700 border-gray-200',
};

const badgeSizes = {
  xs: 'px-1.5 py-0.5 text-xs',
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-sm',
  lg: 'px-3 py-1 text-sm',
  xl: 'px-4 py-1.5 text-base',
};

const badgeShapes = {
  pill: 'rounded-full',
  rounded: 'rounded-md',
  square: 'rounded-none',
};

export default function Badge({
  children,
  variant = 'default',
  size = 'sm',
  shape = 'pill',
  className = '',
  dot = false,
  ...props
}) {
  const baseClasses = 'inline-flex items-center font-medium border transition-colors';
  
  const classes = [
    baseClasses,
    badgeVariants[variant],
    badgeSizes[size],
    badgeShapes[shape],
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={classes} {...props}>
      {dot && (
        <span className={`w-2 h-2 rounded-full mr-1.5 ${
          variant === 'success' ? 'bg-green-500' :
          variant === 'warning' ? 'bg-warning-500' :
          variant === 'danger' ? 'bg-danger-500' :
          variant === 'info' ? 'bg-primary-500' :
          'bg-gray-500'
        }`} />
      )}
      {children}
    </span>
  );
}
