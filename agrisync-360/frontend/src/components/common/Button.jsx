import React from 'react';
import { Loader2 } from 'lucide-react';

const buttonVariants = {
  primary: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 active:scale-95 transition-transform',
  secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 active:scale-95 transition-transform',
  outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-green-500 active:scale-95 transition-transform',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:scale-95 transition-transform',
  ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-green-500 active:scale-95 transition-transform',
  success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 active:scale-95 transition-transform',
  warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500 active:scale-95 transition-transform',
  harvest: 'bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500 active:scale-95 transition-transform',
  earth: 'bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500 active:scale-95 transition-transform',
  gradient: 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:opacity-90 focus:ring-green-500 active:scale-95 transition-transform',
};

const buttonSizes = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-4 text-lg',
  full: 'px-6 py-3 text-base w-full',
};

const buttonRounded = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  rounded = 'lg',
  isLoading = false,
  disabled = false,
  className = '',
  leftIcon,
  rightIcon,
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';
  
  const classes = [
    baseClasses,
    buttonVariants[variant],
    buttonSizes[size],
    buttonRounded[rounded],
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      {!isLoading && leftIcon && (
        <span className="mr-2">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && (
        <span className="ml-2">{rightIcon}</span>
      )}
    </button>
  );
}
