import React from 'react';

const emptyStateVariants = {
  default: 'text-gray-400',
  primary: 'text-primary-400',
  harvest: 'text-harvest-400',
  earth: 'text-earth-400',
  danger: 'text-danger-400',
};

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
  variant = 'default',
  size = 'lg',
  illustration = null,
  ...props
}) {
  const iconColor = emptyStateVariants[variant];
  
  const sizeClasses = {
    sm: 'py-8 px-4',
    md: 'py-12 px-4',
    lg: 'py-16 px-4',
    xl: 'py-20 px-4',
  };

  const iconSizes = {
    sm: 'text-4xl',
    md: 'text-5xl',
    lg: 'text-6xl',
    xl: 'text-7xl',
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  const descriptionSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-base',
    xl: 'text-lg',
  };

  return (
    <div
      className={`
        text-center ${sizeClasses[size]}
        ${className}
      `}
      {...props}
    >
      {illustration && (
        <div className="mb-6 max-w-xs mx-auto">
          {illustration}
        </div>
      )}
      
      {icon && (
        <div className={`${iconSizes[size]} ${iconColor} mb-6 animate-pulse-slow`}>
          {icon}
        </div>
      )}
      
      {title && (
        <h3 className={`${titleSizes[size]} font-semibold text-gray-900 mb-3 font-display`}>
          {title}
        </h3>
      )}
      
      {description && (
        <p className={`${descriptionSizes[size]} text-gray-500 mb-8 max-w-md mx-auto leading-relaxed`}>
          {description}
        </p>
      )}
      
      {action && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          {action}
        </div>
      )}
      
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gray-100 rounded-full opacity-20 blur-xl" />
        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-gray-100 rounded-full opacity-20 blur-xl" />
      </div>
    </div>
  );
}

// Predefined empty states for common use cases
export const EmptyStates = {
  // Data related
  noData: (props) => (
    <EmptyState
      icon="📊"
      title="No data available"
      description="There's no data to display here. Check back later or try adjusting your filters."
      variant="default"
      {...props}
    />
  ),
  
  noResults: (props) => (
    <EmptyState
      icon="🔍"
      title="No results found"
      description="We couldn't find any results matching your search. Try different keywords or filters."
      variant="primary"
      {...props}
    />
  ),
  
  // Farm related
  noFarms: (props) => (
    <EmptyState
      icon="🌾"
      title="No farms registered"
      description="You haven't added any farms yet. Get started by adding your first farm to begin tracking your agricultural activities."
      variant="earth"
      {...props}
    />
  ),
  
  noCrops: (props) => (
    <EmptyState
      icon="🌱"
      title="No crops planted"
      description="Start planting crops to track their growth and receive personalized agricultural advice."
      variant="primary"
      {...props}
    />
  ),
  
  // Market related
  noMarketData: (props) => (
    <EmptyState
      icon="📈"
      title="No market data available"
      description="Market price information is currently unavailable. Please check back later for the latest prices."
      variant="harvest"
      {...props}
    />
  ),
  
  // Weather related
  noWeatherData: (props) => (
    <EmptyState
      icon="🌤️"
      title="Weather data unavailable"
      description="Weather information couldn't be loaded. Please check your internet connection and try again."
      variant="primary"
      {...props}
    />
  ),
  
  // Network related
  networkError: (props) => (
    <EmptyState
      icon="🌐"
      title="Connection error"
      description="Unable to connect to our servers. Please check your internet connection and try again."
      variant="danger"
      {...props}
    />
  ),
  
  // User related
  notFound: (props) => (
    <EmptyState
      icon="🤷"
      title="Page not found"
      description="The page you're looking for doesn't exist or has been moved."
      variant="default"
      {...props}
    />
  ),
  
  unauthorized: (props) => (
    <EmptyState
      icon="🔒"
      title="Access denied"
      description="You don't have permission to view this content. Please contact your administrator if you think this is an error."
      variant="danger"
      {...props}
    />
  ),
};
