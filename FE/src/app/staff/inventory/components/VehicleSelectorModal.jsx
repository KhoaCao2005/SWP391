import React, { useState } from 'react';
import { X, Search } from 'lucide-react';

const VehicleSelectorModal = ({ isOpen, onClose, onSelect, vehicles = [], selectedVehicles = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Get IDs of already selected vehicles
  const selectedIds = selectedVehicles.filter(v => v).map(v => v.id);

  // Filter vehicles - Only show available vehicles
  const filteredVehicles = vehicles.filter(vehicle => {
    // Only show available vehicles
    if (vehicle.status !== 'available') return false;
    
    // Exclude already selected vehicles
    if (selectedIds.includes(vehicle.id)) return false;

    // Search filter
    const matchesSearch = !searchQuery || 
      vehicle.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.variant?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.color?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.id?.toString().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      'available': { emoji: '🟢', label: 'Available', color: 'bg-green-100 text-green-800' },
      'reserved': { emoji: '🟡', label: 'Reserved', color: 'bg-yellow-100 text-yellow-800' },
      'sold': { emoji: '🔴', label: 'Sold', color: 'bg-red-100 text-red-800' },
    };
    const config = statusConfig[status] || { emoji: '⚪', label: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <span>{config.emoji}</span>
        <span>{config.label}</span>
      </span>
    );
  };

  const handleSelect = (vehicle) => {
    onSelect(vehicle);
    setSearchQuery('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 text-white p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Select Vehicle to Compare</h2>
              <p className="text-gray-300 text-sm mt-1">
                Choose a vehicle from the inventory
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="relative">
            {/* Search */}
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by model, variant, or color..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Vehicle List */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-4">
          {filteredVehicles.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">🔍</div>
              <div className="text-sm">No vehicles found</div>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredVehicles.map((vehicle) => (
                <button
                  key={vehicle.id}
                  onClick={() => handleSelect(vehicle)}
                  className="flex items-center space-x-4 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-left w-full"
                >
                  {/* Image */}
                  <div className="flex-shrink-0 w-20 h-16 bg-white rounded-lg overflow-hidden border border-gray-200">
                    {vehicle.imageUrl ? (
                      <img
                        src={vehicle.imageUrl}
                        alt={vehicle.title}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                        🚗
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base mb-1">
                      {vehicle.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                      {vehicle.variant && (
                        <>
                          <span>{vehicle.variant}</span>
                          <span>•</span>
                        </>
                      )}
                      {vehicle.color && <span>{vehicle.color}</span>}
                    </div>
                    <div>
                      {getStatusBadge(vehicle.status)}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right flex-shrink-0 mr-4">
                    <div className="text-lg font-bold text-gray-900 mb-1">
                      {vehicle.priceUsd 
                        ? `$${vehicle.priceUsd.toLocaleString()}`
                        : '—'
                      }
                    </div>
                    {vehicle.quantity !== undefined && (
                      <div className="text-xs text-gray-500">
                        {vehicle.quantity} available
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleSelectorModal;

