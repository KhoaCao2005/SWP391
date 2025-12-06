import React from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';

const VehicleDetailModal = ({ vehicle, isOpen, onClose }) => {
  if (!isOpen || !vehicle) return null;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusInfo = (isActive) => {
    // Use isActive field from database instead of status
    if (isActive === true || isActive === 'true') {
      return {
        label: 'Active',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        icon: CheckCircle
      };
    } else {
      return {
        label: 'Inactive',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        icon: XCircle
      };
    }
  };


  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Vehicle Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side - Image */}
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-8 flex items-center justify-center h-64">
                {vehicle.img ? (
                  <img 
                    src={vehicle.img} 
                    alt={vehicle.model}
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <div className="text-6xl mb-4">🚗</div>
                    <div className="text-lg">No Image Available</div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Details */}
            <div className="space-y-6">
              {/* Model Name & Price */}
              <div className="pb-4 border-b border-gray-200">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {vehicle.model}
                </h1>
                <div className="mb-4">
                  <div className="text-sm text-gray-500 mb-1">Price</div>
                  <div className="text-4xl font-bold text-gray-900">
                    {formatPrice(vehicle.price)}
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className={`rounded-lg border-2 p-4 ${getStatusInfo(vehicle.isActive).bgColor} ${getStatusInfo(vehicle.isActive).borderColor}`}>
                <div className="flex items-center space-x-2">
                  {React.createElement(getStatusInfo(vehicle.isActive).icon, { className: `w-5 h-5 ${getStatusInfo(vehicle.isActive).color}` })}
                  <div>
                    <p className={`font-semibold ${getStatusInfo(vehicle.isActive).color}`}>Status: {getStatusInfo(vehicle.isActive).label}</p>
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Vehicle Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 uppercase mb-1">Model Name</div>
                    <div className="text-sm font-medium text-gray-900">{vehicle.modelName || vehicle.model || 'N/A'}</div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-gray-500 uppercase mb-1">Version</div>
                    <div className="text-sm font-medium text-gray-900">{vehicle.versionName || 'N/A'}</div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-gray-500 uppercase mb-1">Color</div>
                    <div className="text-sm font-medium text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {vehicle.color || 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-gray-500 uppercase mb-1">Model ID</div>
                    <div className="text-sm font-medium text-gray-900">{vehicle.modelId || 'N/A'}</div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-gray-500 uppercase mb-1">Variant ID</div>
                    <div className="text-sm font-medium text-gray-900">{vehicle.variantId || 'N/A'}</div>
                  </div>
                </div>
                
                {/* Description */}
                {vehicle.description && (
                  <div className="mt-4">
                    <div className="text-xs text-gray-500 uppercase mb-1">Description</div>
                    <div className="text-sm text-gray-700">{vehicle.description}</div>
                  </div>
                )}
              </div>

              {/* Additional Details */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Vehicle model: <strong>{vehicle.modelName || vehicle.model || 'N/A'}</strong></p>
                  <p>• Version: <strong>{vehicle.versionName || 'N/A'}</strong></p>
                  <p>• Color: <strong>{vehicle.color || 'N/A'}</strong></p>
                  <p>• Status: <strong>{vehicle.isActive ? 'Active' : 'Inactive'}</strong></p>
                  {vehicle.description && (
                    <p>• {vehicle.description}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetailModal;

