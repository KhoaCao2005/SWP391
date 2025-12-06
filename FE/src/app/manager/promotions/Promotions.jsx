import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../layout/Layout';
import { useNavigate } from 'react-router';
import {
  Tag,
  Search,
  ChevronRight,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { fetchDealerPromotions } from '../services/promotionsService';

const Promotions = () => {
  const navigate = useNavigate();
  const [modelFilter, setModelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Promotions data - to be fetched from API
  const [promotions, setPromotions] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetchDealerPromotions();
      if (res.success) {
        setPromotions(res.data || []);
      } else {
        setPromotions([]);
        console.warn('Failed to load promotions:', res.message);
      }
      setLoading(false);
    };
    load();
  }, []);

  // Get all available vehicle models
  const vehicleModels = [...new Set(promotions.map(p => p.vehicleModel))];

  // Helper functions
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDiscountValue = (type, value) => {
    if (!type) return value ? `${value}%` : 'N/A';
    const t = type.toString().toLowerCase();
    if (t.includes('percent') || t.includes('rate')) return `${value}%`;
    return value ? formatCurrency(value) : 'N/A';
  };

  const getStatusBadge = (status) => {
    if (status === 'Active') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border bg-gray-100 text-gray-800 border-gray-200">
        <XCircle className="w-3 h-3 mr-1" />
        Inactive
      </span>
    );
  };

  // Compute active status by date range then filter
  const filteredPromotions = useMemo(() => promotions.filter(promotion => {
    const now = new Date();
    const start = promotion.startDate ? new Date(promotion.startDate) : null;
    const end = promotion.endDate ? new Date(promotion.endDate) : null;
    const isActive = (!start || start <= now) && (!end || now <= end);
    const status = isActive ? 'Active' : 'Inactive';
    promotion._status = status;

    // Model filter (not used currently, keep placeholder)
    if (modelFilter !== 'all' && promotion.vehicleModel !== modelFilter) return false;

    // Status filter
    if (statusFilter !== 'all' && status.toLowerCase() !== statusFilter.toLowerCase()) return false;

    // Date range filter
    if (dateFrom && (promotion.startDate || '') < dateFrom) return false;
    if (dateTo && (promotion.endDate || '') > dateTo) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matches = (promotion.description || '').toLowerCase().includes(query) ||
        (promotion.type || '').toLowerCase().includes(query);
      if (!matches) return false;
    }

    return true;
  }), [promotions, modelFilter, statusFilter, dateFrom, dateTo, searchQuery]);

  // Handle toggle status
  const handleToggleStatus = (promotionId, currentStatus) => {
    if (window.confirm(`Are you sure you want to ${currentStatus === 'Active' ? 'deactivate' : 'activate'} this promotion?`)) {
      // In real app, would make API call to toggle status
      console.log(`Toggling promotion ${promotionId} to ${currentStatus === 'Active' ? 'Inactive' : 'Active'}`);
      alert(`Promotion ${currentStatus === 'Active' ? 'deactivated' : 'activated'} successfully!`);
      // Refresh data would happen here
    }
  };

  // Handle view detail
  const handleViewDetail = (promotionId) => {
    navigate(`/manager/promotions/${promotionId}`);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <span className="hover:text-blue-600 cursor-pointer">Dashboard</span>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 font-medium">Promotions</span>
        </div>

        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
            <p className="text-sm text-gray-600 mt-1">Receive and configure promotions from manufacturer</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Tag className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{promotions.length}</p>
                <p className="text-sm text-gray-600">Total Promotions</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{promotions.filter(p => p._status === 'Active').length}</p>
                <p className="text-sm text-gray-600">Active</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{promotions.length}</p>
                <p className="text-sm text-gray-600">Total Applied</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{promotions.filter(p => p._status === 'Active').length}</p>
                <p className="text-sm text-gray-600">Active Now</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
            <span className="text-xs text-gray-500">({filteredPromotions.length} results)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Model/Variant Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Model/Variant</label>
              <select
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All</option>
                {vehicleModels.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>

            {/* Active/Inactive Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Date Range - From */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Valid From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Date Range - To */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Valid To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Search */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search promotions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Promotion</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Valid From
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Valid To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPromotions.map((promotion) => (
                  <tr key={promotion.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{promotion.description || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">{promotion.type || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">{formatDiscountValue(promotion.type, promotion.discountRate)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">{promotion.startDate ? formatDate(promotion.startDate) : '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">{promotion.endDate ? formatDate(promotion.endDate) : '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(promotion._status || 'Inactive')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDetail(promotion.id)}
                          className="text-blue-600 hover:text-blue-900 text-xs font-medium"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Promotions;

