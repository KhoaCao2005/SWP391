import React from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router';

const CarDetailModal = ({ vehicle, isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen || !vehicle) return null;

  // Get status information and styling
  const getStatusInfo = (status) => {
    const statusMap = {
      available: { 
        emoji: '🟢', 
        label: 'Available for Order', 
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      },
      reserved: { 
        emoji: '🟡', 
        label: 'Reserved by Le Minh Tuan', 
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      },
      sold: { 
        emoji: '🔴', 
        label: 'Sold — Delivered on 15/10/2025', 
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      },
    };
    return statusMap[status] || statusMap.available;
  };

  const statusInfo = getStatusInfo(vehicle.status);

  // Get action buttons based on status
  const getActionButtons = (status) => {
    switch (status) {
      case 'available':
        return [
          { text: 'Create Order', style: 'bg-blue-600 hover:bg-blue-700 text-white', action: 'createOrder' },
          { text: 'Schedule Test Drive', style: 'bg-gray-100 hover:bg-gray-200 text-gray-700', action: 'scheduleTestDrive' }
        ];
      case 'reserved':
        return [
          { text: 'View Quotation / Contract', style: 'bg-blue-600 hover:bg-blue-700 text-white', action: 'viewContract' },
          { text: 'Contact Customer', style: 'bg-gray-100 hover:bg-gray-200 text-gray-700', action: 'contactCustomer' }
        ];
      case 'sold':
        return [
          { text: 'Track Delivery', style: 'bg-blue-600 hover:bg-blue-700 text-white', action: 'trackDelivery' },
          { text: 'View Contract', style: 'bg-gray-100 hover:bg-gray-200 text-gray-700', action: 'viewContract' }
        ];
      default:
        return [
          { text: 'Create Order', style: 'bg-blue-600 hover:bg-blue-700 text-white', action: 'createOrder' },
          { text: 'Schedule Test Drive', style: 'bg-gray-100 hover:bg-gray-200 text-gray-700', action: 'scheduleTestDrive' }
        ];
    }
  };

  const actionButtons = getActionButtons(vehicle.status);

  // Handle create order - navigate to order form page with vehicle data
  const handleCreateOrder = () => {
    // Prepare vehicle data for order form
    // Map inventory vehicle structure to order form expected structure
    const orderVehicleData = {
      modelId: vehicle.modelId,
      variantId: vehicle.variantId,
      modelName: vehicle.title || vehicle.model || vehicle.modelName,
      title: vehicle.title,
      price: vehicle.price || vehicle.priceUsd || vehicle.dealerPrice,
      dealerPrice: vehicle.dealerPrice || vehicle.price || vehicle.priceUsd,
      color: vehicle.color || 'White',
      vin: vehicle.vin || 'Pending',
      serialId: vehicle.vin, // Use vin as serialId if available
      imageUrl: vehicle.imageUrl,
      status: vehicle.status,
      variant: vehicle.variant,
      model: vehicle.model || vehicle.title,
    };
    
    navigate('/staff/sales/order-form', { 
      state: { 
        vehicleData: orderVehicleData
      } 
    });
    onClose();
  };

  // Handle schedule test drive - navigate to test drive page with vehicle data
  const handleScheduleTestDrive = () => {
    // Prepare vehicle data for test drive
    const testDriveVehicleData = {
      modelId: vehicle.modelId,
      variantId: vehicle.variantId,
      modelName: vehicle.title || vehicle.model || vehicle.modelName,
      title: vehicle.title,
      serialId: vehicle.vin || '', // Pre-fill serial ID if available
      color: vehicle.color,
      imageUrl: vehicle.imageUrl,
    };
    
    navigate('/staff/customers/test-drives', { 
      state: { 
        vehicleData: testDriveVehicleData
      } 
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            Vehicle Configuration
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content - Tesla Style Layout */}
        <div className="flex h-[calc(95vh-100px)]">
          {/* Left Side - Car Image (60% width) */}
          <div className="w-3/5 bg-white flex items-center justify-center relative">
            <div className="w-full h-full flex items-center justify-center p-8">
              {vehicle.imageUrl ? (
                <div className="relative w-full max-w-lg">
                  <img 
                    src={vehicle.imageUrl} 
                    alt={vehicle.title}
                    className="w-full h-auto object-contain"
                  />
                  {/* Image navigation arrows */}
                  <button className="absolute left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all border border-gray-200">
                    <span className="text-gray-600 text-lg">‹</span>
                  </button>
                  <button className="absolute right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all border border-gray-200">
                    <span className="text-gray-600 text-lg">›</span>
                  </button>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <div className="text-6xl mb-4">🚗</div>
                  <div className="text-lg">No Image Available</div>
                </div>
              )}
            </div>
            {/* Image label */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded text-sm backdrop-blur-sm">
              Front View of {vehicle.title}
            </div>
          </div>

          {/* Right Side - Vehicle Status (40% width) */}
          <div className="w-2/5 bg-white overflow-y-auto">
            <div className="p-8 space-y-8">
              {/* Model Name & Price */}
              <div className="pb-6 border-b border-gray-200">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">
                  {vehicle.title}
                </h1>
                
                {/* Price - Prominent Display */}
                <div className="mb-6">
                  <div className="text-sm text-gray-500 mb-1">Price</div>
                  <div className="text-4xl font-bold text-gray-900">
                    ${vehicle.priceUsd?.toLocaleString() || 'N/A'}
                  </div>
                </div>

                {/* Vehicle Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {vehicle.variant && (
                    <div>
                      <div className="text-xs text-gray-500 uppercase mb-1">Variant</div>
                      <div className="text-sm font-medium text-gray-900">{vehicle.variant}</div>
                    </div>
                  )}
                  {vehicle.color && (
                    <div>
                      <div className="text-xs text-gray-500 uppercase mb-1">Color</div>
                      <div className="text-sm font-medium text-gray-900">{vehicle.color}</div>
                    </div>
                  )}
                  {vehicle.modelActive !== undefined && (
                    <div>
                      <div className="text-xs text-gray-500 uppercase mb-1">Status</div>
                      <div className="text-sm font-medium text-gray-900">
                        {vehicle.modelActive ? '✓ Active' : '✗ Inactive'}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Technical Information */}
              <div className="pb-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Technical Information
                </h3>
                
                <div className="space-y-3">
                  {vehicle.modelId && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Model ID</span>
                      <span className="text-sm font-medium text-gray-900">{vehicle.modelId}</span>
                    </div>
                  )}
                  
                  {vehicle.variantId && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Variant ID</span>
                      <span className="text-sm font-medium text-gray-900">{vehicle.variantId}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Availability Status */}
              <div className="pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Availability
                </h3>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className={`text-sm font-semibold ${statusInfo.color} flex items-center gap-1.5`}>
                    <span>{statusInfo.emoji}</span>
                    <span>{statusInfo.label}</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 space-y-3">
                {actionButtons.map((button, index) => (
                  <button 
                    key={index}
                    onClick={() => {
                      if (button.action === 'createOrder') {
                        handleCreateOrder();
                      } else if (button.action === 'scheduleTestDrive') {
                        handleScheduleTestDrive();
                      } else {
                        // Handle other button actions
                        console.log(`Button clicked: ${button.text} (${button.action})`);
                      }
                    }}
                    className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${button.style}`}
                  >
                    {button.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarDetailModal;
