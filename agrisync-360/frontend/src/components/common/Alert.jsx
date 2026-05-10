import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info, X, Bell, Shield, TrendingUp } from 'lucide-react';

const alertVariants = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: CheckCircle,
    iconColor: 'text-green-600',
    hoverBg: 'hover:bg-green-100',
  },
  error: {
    bg: 'bg-danger-50',
    border: 'border-danger-200',
    text: 'text-danger-800',
    icon: AlertCircle,
    iconColor: 'text-danger-600',
    hoverBg: 'hover:bg-danger-100',
  },
  warning: {
    bg: 'bg-warning-50',
    border: 'border-warning-200',
    text: 'text-warning-800',
    icon: AlertTriangle,
    iconColor: 'text-warning-600',
    hoverBg: 'hover:bg-warning-100',
  },
  info: {
    bg: 'bg-primary-50',
    border: 'border-primary-200',
    text: 'text-primary-800',
    icon: Info,
    iconColor: 'text-primary-600',
    hoverBg: 'hover:bg-primary-100',
  },
  // Specialized alerts
  weather: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: Bell,
    iconColor: 'text-blue-600',
    hoverBg: 'hover:bg-blue-100',
  },
  market: {
    bg: 'bg-harvest-50',
    border: 'border-harvest-200',
    text: 'text-harvest-800',
    icon: TrendingUp,
    iconColor: 'text-harvest-600',
    hoverBg: 'hover:bg-harvest-100',
  },
  security: {
    bg: 'bg-earth-50',
    border: 'border-earth-200',
    text: 'text-earth-800',
    icon: Shield,
    iconColor: 'text-earth-600',
    hoverBg: 'hover:bg-earth-100',
  },
};

const alertSizes = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

export default function Alert({
  type = 'info',
  title,
  message,
  className = '',
  dismissible = false,
  onDismiss,
  size = 'md',
  showIcon = true,
  actions,
  ...props
}) {
  const variant = alertVariants[type];
  const Icon = variant.icon;

  return (
    <div
      className={`
        rounded-2xl border transition-all duration-200
        ${variant.bg}
        ${variant.border}
        ${variant.text}
        ${alertSizes[size]}
        ${className}
      `}
      role="alert"
      {...props}
    >
      <div className="flex items-start">
        {showIcon && (
          <div className="flex-shrink-0">
            <Icon className={`h-5 w-5 ${variant.iconColor}`} />
          </div>
        )}
        <div className={`${showIcon ? 'ml-3' : ''} flex-1 min-w-0`}>
          {title && (
            <h3 className="text-sm font-semibold mb-1">
              {title}
            </h3>
          )}
          {message && (
            <div className={`text-sm ${title ? '' : 'font-medium'}`}>
              {message}
            </div>
          )}
          {actions && (
            <div className="mt-3 flex gap-2">
              {actions}
            </div>
          )}
        </div>
        {dismissible && (
          <div className="ml-auto pl-3">
            <button
              onClick={onDismiss}
              className={`
                inline-flex items-center justify-center rounded-lg p-1
                ${variant.bg}
                ${variant.text}
                ${variant.hoverBg}
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-2
                focus:ring-offset-transparent
              `}
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
