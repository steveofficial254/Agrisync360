import React, { useState } from 'react';
import { Eye, EyeOff, Search, MapPin, Phone, Mail, User, Lock, Calendar } from 'lucide-react';

const inputVariants = {
  default: 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
  error: 'border-danger-300 text-danger-900 placeholder-danger-300 focus:ring-danger-500 focus:border-danger-500',
  success: 'border-green-300 focus:border-green-500 focus:ring-green-500',
};

const inputSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-4 py-3 text-base',
};

const iconMap = {
  search: Search,
  location: MapPin,
  phone: Phone,
  email: Mail,
  user: User,
  password: Lock,
  date: Calendar,
};

export default function Input({
  label,
  type = 'text',
  placeholder,
  error,
  hint,
  className = '',
  required = false,
  disabled = false,
  variant = 'default',
  size = 'md',
  leftIcon,
  rightIcon,
  showPasswordToggle = false,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;
  
  const LeftIconComponent = typeof leftIcon === 'string' ? iconMap[leftIcon] : leftIcon;
  const RightIconComponent = typeof rightIcon === 'string' ? iconMap[rightIcon] : rightIcon;

  const baseClasses = 'block w-full border transition-colors duration-200 placeholder-gray-400 focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed';
  const sizeClasses = inputSizes[size];
  const variantClasses = inputVariants[variant];
  const paddingClasses = LeftIconComponent ? 'pl-10' : rightIcon || (isPassword && showPasswordToggle) ? 'pr-10' : '';
  
  const inputClasses = [
    baseClasses,
    sizeClasses,
    variantClasses,
    paddingClasses,
    'rounded-lg',
    className
  ].filter(Boolean).join(' ');

  const labelClasses = 'block text-sm font-medium text-gray-700 mb-1';
  const errorClasses = 'text-sm text-danger-600 mt-1';
  const hintClasses = 'text-sm text-gray-500 mt-1';

  return (
    <div className="space-y-1">
      {label && (
        <label className={labelClasses}>
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {LeftIconComponent && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <LeftIconComponent className="h-4 w-4 text-gray-400" />
          </div>
        )}
        
        <input
          type={inputType}
          className={inputClasses}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${props.id || 'input'}-error` : hint ? `${props.id || 'input'}-hint` : undefined}
          {...props}
        />
        
        {(rightIcon || (isPassword && showPasswordToggle)) && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {isPassword && showPasswordToggle ? (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            ) : RightIconComponent ? (
              <RightIconComponent className="h-4 w-4 text-gray-400" />
            ) : null}
          </div>
        )}
      </div>
      
      {error && (
        <p id={`${props.id || 'input'}-error`} className={errorClasses}>
          {error}
        </p>
      )}
      
      {hint && !error && (
        <p id={`${props.id || 'input'}-hint`} className={hintClasses}>
          {hint}
        </p>
      )}
    </div>
  );
}
