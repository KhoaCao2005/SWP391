import React from 'react';

const SummaryCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  bgColor, 
  onViewDetails,
  trend,
  trendValue 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
          <p className="text-2xl font-bold text-gray-900 mb-2">{value}</p>
          {trend && (
            <span className={`text-sm font-medium ${
              trend === 'up' ? 'text-green-600' : 
              trend === 'down' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {trendValue}
            </span>
          )}
        </div>
        <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center shadow-sm">
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;
