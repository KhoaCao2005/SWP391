import React, { useState } from 'react';
import { Calendar, Users, Car } from 'lucide-react';

const DashboardFilters = ({ filters, onChange, onClose, inline }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'thisWeek', label: 'This Week' },
    { value: 'lastWeek', label: 'Last Week' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'thisQuarter', label: 'This Quarter' },
    { value: 'thisYear', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const staffOptions = [
    { value: 'all', label: 'All Staff' },
    { value: 'nguyen-van-hung', label: 'Nguyen Van Hung' },
    { value: 'tran-thi-hoa', label: 'Tran Thi Hoa' },
    { value: 'le-van-minh', label: 'Le Van Minh' },
    { value: 'pham-thu-ha', label: 'Pham Thu Ha' }
  ];

  const modelOptions = [
    { value: 'all', label: 'All Models' },
    { value: 'tesla-model-3', label: 'Tesla Model 3' },
    { value: 'tesla-model-y', label: 'Tesla Model Y' },
    { value: 'vinfast-vf8', label: 'VinFast VF 8' },
    { value: 'vinfast-vf9', label: 'VinFast VF 9' }
  ];

  const handleApply = () => {
    onChange(localFilters);
    onClose();
  };

  const handleReset = () => {
    const defaultFilters = {
      dateRange: 'thisMonth',
      staff: 'all',
      model: 'all'
    };
    setLocalFilters(defaultFilters);
    onChange(defaultFilters);
  };

  if (inline) {
    return (
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Global Filters:</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 md:max-w-2xl md:ml-4">
          {/* Date Range */}
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-[#6C757D] flex-shrink-0" />
            <select
              value={localFilters.dateRange}
              onChange={(e) => {
                const newFilters = { ...localFilters, dateRange: e.target.value };
                setLocalFilters(newFilters);
                onChange(newFilters);
              }}
              className="flex-1 px-3 py-2 border border-[#DEE2E6] rounded-lg focus:ring-2 focus:ring-[#0D6EFD] focus:border-transparent text-sm bg-white"
            >
              {dateRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Staff Filter */}
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-[#6C757D] flex-shrink-0" />
            <select
              value={localFilters.staff}
              onChange={(e) => {
                const newFilters = { ...localFilters, staff: e.target.value };
                setLocalFilters(newFilters);
                onChange(newFilters);
              }}
              className="flex-1 px-3 py-2 border border-[#DEE2E6] rounded-lg focus:ring-2 focus:ring-[#0D6EFD] focus:border-transparent text-sm bg-white"
            >
              {staffOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Model Filter */}
          <div className="flex items-center space-x-2">
            <Car className="w-4 h-4 text-[#6C757D] flex-shrink-0" />
            <select
              value={localFilters.model}
              onChange={(e) => {
                const newFilters = { ...localFilters, model: e.target.value };
                setLocalFilters(newFilters);
                onChange(newFilters);
              }}
              className="flex-1 px-3 py-2 border border-[#DEE2E6] rounded-lg focus:ring-2 focus:ring-[#0D6EFD] focus:border-transparent text-sm bg-white"
            >
              {modelOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm font-medium text-[#6C757D] hover:text-[#0D6EFD] transition-colors"
        >
          Reset
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-[#DEE2E6] animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Date Range
          </label>
          <select
            value={localFilters.dateRange}
            onChange={(e) => setLocalFilters({ ...localFilters, dateRange: e.target.value })}
            className="w-full px-3 py-2 border border-[#DEE2E6] rounded-lg focus:ring-2 focus:ring-[#0D6EFD] focus:border-transparent text-sm"
          >
            {dateRangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Staff Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Staff Member
          </label>
          <select
            value={localFilters.staff}
            onChange={(e) => setLocalFilters({ ...localFilters, staff: e.target.value })}
            className="w-full px-3 py-2 border border-[#DEE2E6] rounded-lg focus:ring-2 focus:ring-[#0D6EFD] focus:border-transparent text-sm"
          >
            {staffOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Model Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vehicle Model
          </label>
          <select
            value={localFilters.model}
            onChange={(e) => setLocalFilters({ ...localFilters, model: e.target.value })}
            className="w-full px-3 py-2 border border-[#DEE2E6] rounded-lg focus:ring-2 focus:ring-[#0D6EFD] focus:border-transparent text-sm"
          >
            {modelOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3 mt-4">
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm font-medium text-[#6C757D] hover:text-gray-900 transition-colors"
        >
          Reset
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-[#6C757D] border border-[#DEE2E6] rounded-lg hover:bg-[#F8F9FA] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleApply}
          className="px-4 py-2 text-sm font-medium text-white bg-[#0D6EFD] rounded-lg hover:bg-[#0a58ca] transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default DashboardFilters;

