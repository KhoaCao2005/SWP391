import React from 'react';
import { X, RefreshCw, Plus } from 'lucide-react';

const VehicleComparisonCard = ({ vehicle, onRemove, onReplace, onAdd }) => {
  // Empty slot - show add button
  if (!vehicle) {
    return (
      <div className="flex flex-col items-center justify-center bg-white border-2 border-dashed border-gray-300 rounded-xl p-6 min-h-[280px] hover:border-gray-400 transition-colors">
        <button
          onClick={onAdd}
          className="flex flex-col items-center space-y-3 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <Plus className="w-8 h-8" />
          </div>
          <span className="text-sm font-medium">Add Model</span>
        </button>
      </div>
    );
  }

  // Get status indicator
  const getStatusIndicator = (status) => {
    const statusConfig = {
      'available': { emoji: '🟢', label: 'Available' },
      'reserved': { emoji: '🟡', label: 'Reserved' },
      'sold': { emoji: '🔴', label: 'Sold' },
    };
    return statusConfig[status] || { emoji: '⚪', label: status };
  };

  const statusInfo = getStatusIndicator(vehicle.status);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-2 p-2 bg-gray-50 border-b border-gray-200">
        <button
          onClick={onReplace}
          className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
          title="Replace Vehicle"
        >
          <RefreshCw className="w-4 h-4 text-gray-600" />
        </button>
        <button
          onClick={onRemove}
          className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
          title="Remove"
        >
          <X className="w-4 h-4 text-gray-600 hover:text-red-600" />
        </button>
      </div>

      {/* Vehicle Image */}
      <div className="bg-white flex items-center justify-center p-6 relative border-b border-gray-200">
        {vehicle.imageUrl ? (
          <img
            src={vehicle.imageUrl}
            alt={vehicle.title}
            className="w-full h-32 object-contain"
          />
        ) : (
          <div className="text-gray-400 text-4xl">🚗</div>
        )}
        
        {/* Status Badge on Image */}
        <div className="absolute top-2 left-2">
          <span className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-100/90 backdrop-blur-sm rounded-full text-xs font-medium shadow-sm border border-gray-300">
            <span>{statusInfo.emoji}</span>
            <span>{statusInfo.label}</span>
          </span>
        </div>
      </div>

      {/* Vehicle Info */}
      <div className="p-4">
        {/* Model Name */}
        <h3 className="font-bold text-gray-900 text-base mb-3 line-clamp-2">
          {vehicle.title}
        </h3>

        {/* Quick Stats - From BE */}
        <div className="space-y-2 text-xs">
          {vehicle.variant && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Variant</span>
              <span className="font-medium text-gray-900">{vehicle.variant}</span>
            </div>
          )}
          {vehicle.color && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Color</span>
              <span className="font-medium text-gray-900">{vehicle.color}</span>
            </div>
          )}
          {vehicle.quantity !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Available</span>
              <span className="font-medium text-gray-900">{vehicle.quantity} units</span>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-gray-500 uppercase">Price</span>
            <span className="text-lg font-bold text-gray-900">
              {vehicle.priceUsd 
                ? `$${vehicle.priceUsd.toLocaleString()}`
                : '—'
              }
            </span>
          </div>
        </div>

        {/* IDs (Optional) */}
        {(vehicle.modelId || vehicle.variantId) && (
          <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
            {vehicle.modelId && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Model ID</span>
                <span className="font-mono text-gray-700">{vehicle.modelId}</span>
              </div>
            )}
            {vehicle.variantId && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Variant ID</span>
                <span className="font-mono text-gray-700">{vehicle.variantId}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleComparisonCard;

