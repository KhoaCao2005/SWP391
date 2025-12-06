import React, { useState, useEffect } from 'react';
import Layout from '../layout/Layout';
import VehicleComparisonCard from './components/VehicleComparisonCard';
import VehicleSelectorModal from './components/VehicleSelectorModal';
import { FileText, Download, RefreshCw, Plus, Truck } from 'lucide-react';
import { useNavigate } from 'react-router';
import { fetchInventory, transformInventoryData } from '../services/inventoryService';

const CompareModels = () => {
  const navigate = useNavigate();
  const [selectedVehicles, setSelectedVehicles] = useState([null, null, null]);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [selectorSlotIndex, setSelectorSlotIndex] = useState(null);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load available vehicles from API
  useEffect(() => {
    const loadVehicles = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await fetchInventory();
        
        if (result.success) {
          const transformedData = transformInventoryData(result.data);
          setAvailableVehicles(transformedData);
        } else {
          setError(result.message || 'Failed to load vehicles');
        }
      } catch (err) {
        console.error('Error loading vehicles:', err);
        setError('An error occurred while loading vehicles');
      } finally {
        setLoading(false);
      }
    };

    loadVehicles();
  }, []);

  // Get comparison attributes (Chỉ dùng field có từ BE)
  const getComparisonRows = () => {
    const rows = [
      { category: 'Vehicle Information', items: [
        { label: 'Model', key: 'model', type: 'text' },
        { label: 'Variant', key: 'variant', type: 'text' },
        { label: 'Color', key: 'color', type: 'text' },
        { label: 'Status', key: 'status', type: 'status' },
      ]},
      { category: 'Pricing', items: [
        { label: 'Price (USD)', key: 'priceUsd', type: 'currency-usd' },
        { label: 'Condition', key: 'condition', type: 'text' },
      ]},
      { category: 'Inventory', items: [
        { label: 'Stock Quantity', key: 'quantity', type: 'number' },
        { label: 'Model Active', key: 'modelActive', type: 'boolean' },
      ]},
    ];

    return rows;
  };

  // Format value based on type
  const formatValue = (vehicle, key, type) => {
    if (!vehicle) return '—';
    
    const value = vehicle[key];
    if (value === undefined || value === null) return '—';

    switch (type) {
      case 'currency-usd':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
        }).format(value);
      case 'number':
        return value;
      case 'boolean':
        return value ? '✓ Yes' : '✗ No';
      case 'status':
        return getStatusBadge(value);
      default:
        return value || '—';
    }
  };

  // Get status badge (Chỉ dùng "available" vì đã filter xe có hàng từ BE)
  const getStatusBadge = (status) => {
    const statusConfig = {
      'available': { emoji: '🟢', label: 'In Stock', color: 'text-green-600' },
    };
    const config = statusConfig[status] || { emoji: '🟢', label: 'In Stock', color: 'text-green-600' };
    return (
      <span className={`flex items-center justify-center space-x-1 ${config.color} font-semibold`}>
        <span>{config.emoji}</span>
        <span>{config.label}</span>
      </span>
    );
  };

  // Handlers
  const handleAddVehicle = (slotIndex) => {
    setSelectorSlotIndex(slotIndex);
    setIsSelectorOpen(true);
  };

  const handleRemoveVehicle = (index) => {
    const newVehicles = [...selectedVehicles];
    newVehicles[index] = null;
    setSelectedVehicles(newVehicles);
  };

  const handleReplaceVehicle = (index) => {
    setSelectorSlotIndex(index);
    setIsSelectorOpen(true);
  };

  const handleSelectVehicle = (vehicle) => {
    const newVehicles = [...selectedVehicles];
    newVehicles[selectorSlotIndex] = vehicle;
    setSelectedVehicles(newVehicles);
    setIsSelectorOpen(false);
    setSelectorSlotIndex(null);
  };

  const handleExportReport = () => {
    console.log('Export comparison report');
    // Implement export functionality
  };

  // Handle create order - navigate to order form page with vehicle data
  const handleCreateOrder = (vehicle) => {
    // Prepare vehicle data for order form
    const orderVehicleData = {
      modelId: vehicle.modelId,
      variantId: vehicle.variantId,
      modelName: vehicle.model || vehicle.title || vehicle.modelName,
      title: vehicle.title || vehicle.model,
      price: vehicle.price || vehicle.priceUsd,
      dealerPrice: vehicle.price || vehicle.priceUsd,
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
  };

  // Handle pick and deliver - navigate to order form, then to delivery
  const handlePickAndDeliver = (vehicle) => {
    // Prepare vehicle data for order form with delivery flag
    const orderVehicleData = {
      modelId: vehicle.modelId,
      variantId: vehicle.variantId,
      modelName: vehicle.model || vehicle.title || vehicle.modelName,
      title: vehicle.title || vehicle.model,
      price: vehicle.price || vehicle.priceUsd,
      dealerPrice: vehicle.price || vehicle.priceUsd,
      color: vehicle.color || 'White',
      vin: vehicle.vin || 'Pending',
      serialId: vehicle.vin,
      imageUrl: vehicle.imageUrl,
      status: vehicle.status,
      variant: vehicle.variant,
      model: vehicle.model || vehicle.title,
      forDelivery: true, // Flag to indicate this is for delivery
    };
    
    // Navigate to order form with vehicle data
    // After order creation, user can navigate to delivery section
    navigate('/staff/sales/order-form', { 
      state: { 
        vehicleData: orderVehicleData,
        redirectToDelivery: true // Flag to redirect to delivery after order creation
      } 
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Compare Vehicles
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Select up to 3 models to view side-by-side comparison
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleExportReport}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                <span>Export Report</span>
              </button>
              <button
                onClick={() => window.location.reload()}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading vehicles...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading vehicles</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Vehicle Selection Cards */}
        {!loading && !error && (
        <div className="grid grid-cols-3 gap-6">
          {selectedVehicles.map((vehicle, index) => (
            <VehicleComparisonCard
              key={index}
              vehicle={vehicle}
              onRemove={() => handleRemoveVehicle(index)}
              onReplace={() => handleReplaceVehicle(index)}
              onAdd={() => handleAddVehicle(index)}
            />
          ))}
        </div>
        )}

        {/* Comparison Table */}
        {!loading && !error && selectedVehicles.some(v => v !== null) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {getComparisonRows().map((category, categoryIndex) => (
              <div key={categoryIndex} className="mb-6 last:mb-0">
                {/* Category Header */}
                <div className="bg-gray-100 border-b-2 border-gray-300 px-4 py-3 mb-2 rounded-t-lg">
                  <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">
                    {category.category}
                  </h3>
                </div>

                {/* Comparison Rows */}
                {category.items.map((item, itemIndex) => {
                  return (
                    <div
                      key={itemIndex}
                      className={`grid grid-cols-4 gap-6 py-3 px-4 ${
                        itemIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      } border-b border-gray-200 last:border-b-0`}
                    >
                      {/* Attribute Label */}
                      <div className="flex items-center font-medium text-gray-700 text-sm">
                        {item.label}
                      </div>

                      {/* Values for each vehicle */}
                      {selectedVehicles.map((vehicle, vIndex) => {
                        const formattedValue = formatValue(vehicle, item.key, item.type);

                        return (
                          <div
                            key={vIndex}
                            className="flex items-center justify-center text-sm text-gray-900"
                          >
                            {formattedValue}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons for each vehicle - Aligned with vehicle cards */}
        {!loading && !error && selectedVehicles.some(v => v !== null) && (
          <div className="grid grid-cols-3 gap-6">
            {selectedVehicles.map((vehicle, index) => (
              <div key={index} className="flex flex-col gap-3">
                {vehicle ? (
                  <>
                    <button
                      onClick={() => handleCreateOrder(vehicle)}
                      className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Create Order</span>
                    </button>
                    <button
                      onClick={() => handlePickAndDeliver(vehicle)}
                      className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Truck className="w-4 h-4" />
                      <span>Pick and Deliver</span>
                    </button>
                  </>
                ) : (
                  <div className="w-full"></div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Vehicle Selector Modal */}
        <VehicleSelectorModal
          isOpen={isSelectorOpen}
          onClose={() => {
            setIsSelectorOpen(false);
            setSelectorSlotIndex(null);
          }}
          onSelect={handleSelectVehicle}
          vehicles={availableVehicles}
          selectedVehicles={selectedVehicles}
        />
      </div>
    </Layout>
  );
};

export default CompareModels;

