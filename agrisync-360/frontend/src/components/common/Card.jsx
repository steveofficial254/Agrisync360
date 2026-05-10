import React from 'react';

export default function Card({
  children,
  className = '',
  hover = false,
  padding = 'normal',
  rounded = 'lg',
  shadow = 'sm',
  border = true,
  gradient = false,
  ...props
}) {
  const baseClasses = gradient 
    ? 'text-white'
    : 'bg-white';
    
  const borderClasses = border && !gradient ? 'border border-gray-200' : '';
  const shadowClasses = shadow === 'none' ? '' : `shadow-${shadow}`;
  const hoverClasses = hover ? 'hover:shadow-lg transition-all duration-200 hover:scale-[1.02]' : '';
  
  const paddingClasses = {
    none: '',
    xs: 'p-2',
    sm: 'p-3',
    normal: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  }[padding] || 'p-4';

  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
    full: 'rounded-full',
  }[rounded] || 'rounded-lg';

  const gradientClasses = gradient ? 'bg-gradient-primary' : '';

  const classes = [
    baseClasses,
    borderClasses,
    shadowClasses,
    hoverClasses,
    paddingClasses,
    roundedClasses,
    gradientClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
