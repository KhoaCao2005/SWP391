import React, { useMemo, useState, useEffect } from 'react';
import Layout from '../layout/Layout';
import { useNavigate } from 'react-router';
import { 
  Search, Car as CarIcon, ArrowUpDown, BarChart3, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { getVehicles, getStockOverview } from '../services/inventoryService';
import VehicleDetailModal from './components/VehicleDetailModal';

const ManagerVehicleList = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [sortKey, setSortKey] = useState('model');
  const [sortDir, setSortDir] = useState('asc'); // 'asc' | 'desc'
  const [vehicles, setVehicles] = useState([]);
  const [overview, setOverview] = useState({ totals: { total: 0 }, byModel: [] });
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleVehicleClick = (vehicle) => {
    setSelectedVehicle(vehicle);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedVehicle(null);
  };


  // Load vehicles when search changes
  useEffect(() => {
    const loadVehicles = async () => {
      setLoading(true);
      setError(null);
      try {
        // Only pass search filter - no status/dealer since we don't have that data
        const data = await getVehicles({ search });
        const transformedVehicles = data.map(v => ({
          img: v.image,
          model: v.model,
          modelName: v.modelName,
          versionName: v.versionName,
          color: v.color,
          price: v.price,
          modelId: v.modelId,
          variantId: v.variantId,
          description: v.description,
          isActive: v.isActive,
        }));
        setVehicles(transformedVehicles);
      } catch (err) {
        console.error('Error loading vehicles:', err);
        setError('Failed to load vehicles. Please try again.');
        setVehicles([]);
      } finally {
        setLoading(false);
      }
    };
    loadVehicles();
  }, [search]);

  // Update overview when vehicles change
  useEffect(() => {
    const overviewData = getStockOverview(vehicles);
    setOverview(overviewData);
  }, [vehicles]);

  const filtered = useMemo(() => {
    const base = vehicles;
    const sorted = [...base].sort((a,b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'number') return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      return sortDir === 'asc' ? String(aVal || '').localeCompare(String(bVal || '')) : String(bVal || '').localeCompare(String(aVal || ''));
    });
    return sorted;
  }, [vehicles, sortKey, sortDir]);

  const summary = overview.totals;

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header with Navigation */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vehicle List</h1>
            <p className="text-sm text-gray-600 mt-1">Vehicle models and variants inventory</p>
          </div>
          <button
            onClick={() => navigate('/manager/inventory/stock')}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            <span>View Stock Overview</span>
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-sm border border-[#DEE2E6] p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
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

        {/* Filters */}
        {!loading && (
        <div className="bg-white rounded-lg shadow-sm border border-[#DEE2E6] p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search Model, Version, or Color" className="w-full pl-9 pr-3 py-2 border border-[#DEE2E6] rounded-lg focus:ring-2 focus:ring-[#0D6EFD]" />
            </div>
            <div className="flex items-center justify-end">
              <div className="hidden md:flex items-center space-x-2">
                <button onClick={()=>setViewMode('grid')} className={`px-2 py-1 rounded ${viewMode==='grid'?'bg-blue-50 text-blue-600':'text-gray-600'}`}>Cards</button>
                <button onClick={()=>setViewMode('list')} className={`px-2 py-1 rounded ${viewMode==='list'?'bg-blue-50 text-blue-600':'text-gray-600'}`}>List</button>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Summary */}
        {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-[#DEE2E6] p-4 flex justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Vehicle Variants</p>
              <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg"><CarIcon className="w-6 h-6 text-blue-600"/></div>
          </div>
        </div>
        )}

        {/* Variants by Model */}
        {!loading && (
        <div className="bg-white rounded-lg shadow-sm border border-[#DEE2E6] px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900">Variants by Model</h3>
          </div>
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
            {overview.byModel.map((m, idx) => {
              const colors = ['#2563eb','#16a34a','#f59e0b','#7c3aed','#0ea5e9'];
              const color = colors[idx % colors.length];
              return (
                <div key={m.modelId} className="flex items-center gap-2 px-2 py-1 rounded-full border border-[#DEE2E6] text-xs whitespace-nowrap">
                  <span className="text-gray-700">{m.modelName}</span>
                  <span className="font-semibold px-2 py-0.5 rounded" style={{backgroundColor: `${color}20`, color}}>{m.total} variants</span>
                </div>
              );
            })}
          </div>
        </div>
        )}

        {/* Table or Cards */}
        {!loading && viewMode === 'list' ? (
        <div className="bg-white rounded-lg shadow-sm border border-[#DEE2E6]">
          <div className="px-6 py-4 border-b border-[#EEE]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Vehicle List ({filtered.length})</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
                  <th onClick={()=>toggleSort('model')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">Model <ArrowUpDown className="inline w-3 h-3 ml-1"/></th>
                  <th onClick={()=>toggleSort('versionName')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">Version <ArrowUpDown className="inline w-3 h-3 ml-1"/></th>
                  <th onClick={()=>toggleSort('color')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">Color <ArrowUpDown className="inline w-3 h-3 ml-1"/></th>
                  <th onClick={()=>toggleSort('price')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">Price <ArrowUpDown className="inline w-3 h-3 ml-1"/></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((v) => (
                  <tr 
                    key={`${v.modelId}-${v.variantId}`} 
                    onClick={() => handleVehicleClick(v)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {v.img ? (
                        <img src={v.img} alt={v.model} className="w-24 h-14 object-cover rounded-md border"/>
                      ) : (
                        <div className="w-24 h-14 bg-gray-200 rounded-md border flex items-center justify-center text-xs text-gray-400">No Image</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{v.modelName || v.model}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{v.versionName || 'Standard'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {v.color}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{formatPrice(v.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        ) : !loading ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map(v => (
              <div 
                key={`${v.modelId}-${v.variantId}`} 
                onClick={() => handleVehicleClick(v)}
                className="bg-white border border-[#DEE2E6] rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              >
                {v.img ? (
                  <img src={v.img} alt={v.model} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-gray-200 flex items-center justify-center text-sm text-gray-400">No Image</div>
                )}
                <div className="p-4 space-y-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">{v.modelName || v.model}</h4>
                    {v.versionName && <p className="text-xs text-gray-500 mt-0.5">{v.versionName}</p>}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Color: <span className="font-medium text-gray-900">{v.color}</span></span>
                    <span className="font-semibold text-gray-900">{formatPrice(v.price)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Turnover is placed above the list (compact card) */}

        {/* Vehicle Detail Modal */}
        <VehicleDetailModal
          vehicle={selectedVehicle}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      </div>
    </Layout>
  );
};

export default ManagerVehicleList;


