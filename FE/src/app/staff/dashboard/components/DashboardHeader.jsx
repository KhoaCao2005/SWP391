import React from 'react';
import { RefreshCw, Calendar, Clock } from 'lucide-react';

const DashboardHeader = ({ onRefresh, lastUpdated }) => {
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedTime = currentDate.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 text-lg">
            Check the sales, value and bounce rate by country.
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Current Date & Time */}
          <div className="text-right">
            <div className="flex items-center space-x-2 text-gray-600 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">{formattedDate}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-500">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{formattedTime}</span>
            </div>
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="font-medium">Refresh Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
