import React from 'react';

export default function Table({
  columns = [],
  data = [],
  loading = false,
  error = null,
  emptyState = null,
  className = '',
  striped = false,
  hover = true,
  compact = false,
  onRowClick,
  ...props
}) {
  const getRowClassName = (index) => {
    const baseClasses = 'transition-colors duration-200';
    const stripeClasses = striped && index % 2 === 1 ? 'bg-gray-50' : 'bg-white';
    const hoverClasses = hover ? 'hover:bg-gray-100 cursor-pointer' : '';
    
    return `${baseClasses} ${stripeClasses} ${hoverClasses}`;
  };

  const getCellPadding = () => {
    return compact ? 'px-3 py-2' : 'px-4 py-3';
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`} {...props}>
        <div className="animate-pulse">
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="flex gap-4 p-4">
              {columns.map((_, index) => (
                <div key={index} className="h-4 bg-gray-200 rounded flex-1" />
              ))}
            </div>
          </div>
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="border-b border-gray-200 p-4">
              <div className="flex gap-4">
                {columns.map((_, colIndex) => (
                  <div key={colIndex} className="h-3 bg-gray-200 rounded flex-1" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-8 text-center ${className}`} {...props}>
        <div className="text-danger-600">
          <p className="font-medium">Error loading data</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 ${className}`} {...props}>
        {emptyState || (
          <div className="p-8 text-center">
            <p className="text-gray-500">No data available</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`} {...props}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`${getCellPadding()} text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.className || ''
                  }`}
                  style={column.width ? { width: column.width } : {}}
                >
                  {column.header || column.key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={getRowClassName(rowIndex)}
                onClick={() => onRowClick && onRowClick(row, rowIndex)}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={`${getCellPadding()} text-sm ${
                      column.className || ''
                    }`}
                  >
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Table components for specific use cases
export const TableHeader = ({ title, subtitle, actions, className = '' }) => (
  <div className={`flex items-center justify-between mb-4 ${className}`}>
    <div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {subtitle && (
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
    {actions && (
      <div className="flex items-center gap-2">
        {actions}
      </div>
    )}
  </div>
);

export const TableFooter = ({ 
  total, 
  page, 
  totalPages, 
  onPageChange, 
  showingFrom, 
  showingTo,
  className = '' 
}) => (
  <div className={`flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200 ${className}`}>
    <div className="text-sm text-gray-700">
      Showing {showingFrom} to {showingTo} of {total} results
    </div>
    <div className="flex items-center gap-2">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </button>
      <span className="text-sm text-gray-700">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  </div>
);

// Predefined table configurations
export const TableConfigs = {
  farmerList: [
    { key: 'name', header: 'Name', width: '200px' },
    { key: 'phone', header: 'Phone', width: '150px' },
    { key: 'county', header: 'County', width: '120px' },
    { key: 'farm_count', header: 'Farms', width: '80px' },
    { key: 'plan', header: 'Plan', width: '100px', render: (plan) => (
      <span className={`px-2 py-1 text-xs rounded-full ${
        plan === 'pro' ? 'bg-purple-100 text-purple-700' :
        plan === 'basic' ? 'bg-blue-100 text-blue-700' :
        'bg-gray-100 text-gray-700'
      }`}>
        {plan?.toUpperCase()}
      </span>
    )},
    { key: 'status', header: 'Status', width: '100px', render: (status) => (
      <span className={`px-2 py-1 text-xs rounded-full ${
        status ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
      }`}>
        {status ? 'Active' : 'Inactive'}
      </span>
    )},
  ],
  
  marketPrices: [
    { key: 'crop', header: 'Crop', width: '120px' },
    { key: 'county', header: 'County', width: '120px' },
    { key: 'market', header: 'Market', width: '150px' },
    { key: 'price', header: 'Price (KSH/kg)', width: '120px', render: (price) => (
      <span className="font-medium">KSH {price}</span>
    )},
    { key: 'trend', header: 'Trend', width: '80px', render: (trend) => (
      <span className={`text-sm ${
        trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'
      }`}>
        {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}%
      </span>
    )},
    { key: 'updated_at', header: 'Updated', width: '120px', render: (date) => (
      <span className="text-xs text-gray-500">
        {new Date(date).toLocaleDateString()}
      </span>
    )},
  ],
  
  weatherForecast: [
    { key: 'date', header: 'Date', width: '120px', render: (date) => (
      <span className="font-medium">{new Date(date).toLocaleDateString()}</span>
    )},
    { key: 'weather', header: 'Weather', width: '100px', render: (weather) => (
      <span className="text-2xl">{weather}</span>
    )},
    { key: 'temp_max', header: 'High (°C)', width: '100px', render: (temp) => (
      <span className="text-red-600">{temp}°</span>
    )},
    { key: 'temp_min', header: 'Low (°C)', width: '100px', render: (temp) => (
      <span className="text-blue-600">{temp}°</span>
    )},
    { key: 'rainfall', header: 'Rain (mm)', width: '100px', render: (rain) => (
      <span>{rain}mm</span>
    )},
    { key: 'humidity', header: 'Humidity', width: '100px', render: (humidity) => (
      <span>{humidity}%</span>
    )},
  ],
};
