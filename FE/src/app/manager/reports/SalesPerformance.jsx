import React, { useEffect, useState } from 'react';
import Layout from '../layout/Layout';
import {
  TrendingUp,
  Search,
  ChevronRight,
  Calendar,
  Eye,
  X,
  Users
} from 'lucide-react';

const SalesPerformance = () => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [topFilter, setTopFilter] = useState('all');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);

  // Sales performance data from BE
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Default: load current month
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    setDateFrom(first);
    setDateTo(last);
  }, []);

  const loadData = async () => {
    if (!dateFrom || !dateTo) return;
    setLoading(true);
    setError('');
    const { fetchDealerSalesRecords } = await import('../services/reportsService');
    const res = await fetchDealerSalesRecords({ startDate: dateFrom, endDate: dateTo });
    if (res.success) {
      setSalesData(res.data || []);
    } else {
      setSalesData([]);
      setError(res.message || 'Failed to load sales data');
    }
    setLoading(false);
  };

  // Helper functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '–';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Filter sales data
  const filteredSalesData = salesData.filter(staff => {
    // Date range filter would be applied here in real app
    // For now, just filter by top
    return true;
  }).sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, topFilter === 'all' ? salesData.length : parseInt(topFilter));

  // Handle search
  const handleSearch = () => {
    loadData();
  };

  // Handle view details
  const handleViewDetails = (staff) => {
    setSelectedStaff(staff);
    setIsDetailPanelOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <span className="hover:text-blue-600 cursor-pointer">Dashboard</span>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="hover:text-blue-600 cursor-pointer">Reports</span>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 font-medium">Sales Performance</span>
        </div>

        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales Performance Report</h1>
            <p className="text-sm text-gray-600 mt-1">Overview of sales performance by staff member</p>
          </div>
        </div>

        {/* Filter Row */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Date Range */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Date Range:</label>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="From"
                  />
                </div>
                <span className="text-gray-500">–</span>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="To"
                  />
                </div>
              </div>
            </div>

            {/* Top Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Top:</label>
              <select
                value={topFilter}
                onChange={(e) => setTopFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="5">Top 5</option>
                <option value="10">Top 10</option>
              </select>
            </div>

            {/* Search Button */}
            <div className="ml-auto">
              <button
                onClick={handleSearch}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {error && <div className="p-3 text-sm text-red-700 bg-red-50 border-b border-red-200">{error}</div>}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Sales Staff
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Total Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Total Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSalesData.map((staff) => (
                  <tr key={staff.staffId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{staff.username || staff.staffName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">{staff.totalOrders}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(staff.totalRevenue)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleViewDetails(staff)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center space-x-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Side Panel */}
      {isDetailPanelOpen && selectedStaff && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-end">
          <div className="bg-white h-full w-full max-w-2xl shadow-2xl overflow-y-auto">
            {/* Panel Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedStaff.staffName} - Sales Details</h2>
                  <p className="text-sm text-gray-600 mt-1">Total Orders: {selectedStaff.totalOrders}</p>
                </div>
                <button
                  onClick={() => setIsDetailPanelOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Panel Content */}
            <div className="p-6">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Total Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedStaff.orders.map((order) => (
                        <tr key={order.orderId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">{order.orderId}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm text-gray-700">{order.customer}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm text-gray-700">{formatDate(order.date)}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <span className="text-sm font-semibold text-gray-900">
                              {formatCurrency(order.totalAmount)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <td colSpan="3" className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                          Total Revenue:
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                          {formatCurrency(selectedStaff.totalRevenue)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default SalesPerformance;
