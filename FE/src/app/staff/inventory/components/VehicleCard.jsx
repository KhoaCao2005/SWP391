import React from 'react';

function StatusBadge() {
  // Chỉ có "available" vì đã filter xe có hàng từ BE
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
      🟢 In Stock
    </span>
  );
}

function Dot() {
  return <span className="mx-2 inline-block w-1 h-1 rounded-full bg-gray-400 align-middle" />;
}

export default function VehicleCard({ vehicle, onViewDetails }) {
  return (
    <div 
      className="border border-gray-200 rounded-xl overflow-hidden bg-white hover:shadow-lg hover:border-gray-300 transition-all duration-200 cursor-pointer"
      onClick={() => onViewDetails && onViewDetails(vehicle)}
    >
      {/* Product image */}
      <div className="bg-gray-100 aspect-[16/9] w-full overflow-hidden">
        {vehicle.imageUrl ? (
          <img src={vehicle.imageUrl} alt={vehicle.title} className="w-full h-full object-cover object-center" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span>No Image</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="text-[15px] font-medium text-gray-900">{vehicle.title}</div>
          <StatusBadge />
        </div>
        <div className="text-[17px] font-semibold text-gray-900 mb-2">
          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(vehicle.priceUsd)}
        </div>
        <div className="text-sm text-gray-600 mb-1">{vehicle.condition}</div>
        {vehicle.color && (
          <div className="flex items-center text-sm text-gray-600 mt-2">
            <span className="text-gray-500">Color:</span>
            <span className="ml-2 font-medium">{vehicle.color}</span>
          </div>
        )}
        {vehicle.quantity && (
          <div className="flex items-center text-xs text-gray-500 mt-2">
            <span>Stock: {vehicle.quantity} units</span>
          </div>
        )}
      </div>
    </div>
  );
}


