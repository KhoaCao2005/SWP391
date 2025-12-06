import React, { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';
import Layout from '../layout/Layout';
import InventoryControlBar from './components/InventoryControlBar';
import VehicleCard from './components/VehicleCard';
import CarDetailModal from './components/CarDetailModal';
import { useInventoryControls } from './hooks/useInventoryControls';
import { fetchInventory, transformInventoryData } from '../services/inventoryService';



const Inventory = () => {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch inventory data from API when component mounts
  useEffect(() => {
    const loadInventory = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await fetchInventory();
        
        if (result.success) {
          const transformedData = transformInventoryData(result.data);
          setInventoryData(transformedData);
        } else {
          setError(result.message || 'Failed to load inventory');
        }
      } catch (err) {
        console.error('Error loading inventory:', err);
        setError('An error occurred while loading inventory');
      } finally {
        setLoading(false);
      }
    };

    loadInventory();
  }, []);

  const getStatusBadge = () => {
    // Only "available" because filtered vehicles with stock from BE (isActive=true && quantity>0)
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        🟢 Available
      </span>
    );
  };

  const controls = useInventoryControls(inventoryData);
  const data = controls.data;

  const handleViewDetails = (vehicle) => {
    setSelectedVehicle(vehicle);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedVehicle(null);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Car Inventory Management
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage and track vehicle inventory status
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading inventory...</p>
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
                <h3 className="text-sm font-medium text-red-800">Error loading inventory</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Top controls: Search | Filters | Sort | View */}
        {!loading && !error && (
          <InventoryControlBar
            searchQuery={controls.searchQuery}
            setSearchQuery={controls.setSearchQuery}
            statusFilter={controls.statusFilter}
            setStatusFilter={controls.setStatusFilter}
            sortKey={controls.sortKey}
            setSortKey={controls.setSortKey}
            viewMode={controls.viewMode}
            setViewMode={controls.setViewMode}
          />
        )}

        {/* Inventory Content */}
        {!loading && !error && controls.viewMode === 'grid' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Vehicle List ({data.length})
              </h3>
            </div>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {data.map((v) => (
                <VehicleCard key={v.id} vehicle={v} onViewDetails={handleViewDetails} />
              ))}
            </div>
          </div>
        ) : !loading && !error ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Vehicle List ({data.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vehicle.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vehicle.model}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vehicle.variant}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vehicle.color}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(vehicle);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {/* Car Detail Modal */}
        {!loading && !error && (
          <CarDetailModal
            vehicle={selectedVehicle}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
          />
        )}
      </div>
    </Layout>
  );
};

export default Inventory;
