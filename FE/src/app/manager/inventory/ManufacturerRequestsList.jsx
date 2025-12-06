import React, { useEffect, useState } from 'react';
import Layout from '../layout/Layout';
import { Plus, Search, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import CreateManufacturerRequestModal from './components/CreateManufacturerRequestModal';
import { fetchManufacturerRequests } from '../services/inventoryService';

const ManufacturerRequestsList = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Requests data - fetched from API
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    const res = await fetchManufacturerRequests();
    if (res.success) {
      const list = Array.isArray(res.data) ? res.data : [];
      setRequests(groupRequests(list));
    } else {
      setRequests([]);
      console.warn('Failed to load requests:', res.message);
    }
    setLoading(false);
  };

  // Group rows to ensure "1 lần tạo = 1 dòng"
  // Primary rule: collapse items created in the same day with same model/color/status
  // This preserves truly separate creations on different days or with different specs
  const groupRequests = (rows) => {
    const grouped = new Map();
    for (const r of rows) {
      const dateObj = r.createdAt ? new Date(r.createdAt) : null;
      const dayKey = dateObj ? `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}` : 'unknown';
      const model = (r.modelName || r.model || 'N/A').toString().trim().toLowerCase();
      const color = (r.color || 'N/A').toString().trim().toLowerCase();
      const status = (r.status || r.agreement || 'Pending').toString().trim().toLowerCase();
      const key = `${dayKey}|${status}|${model}|${color}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          requestId: r.requestId ?? r.orderId ?? r.id ?? key,
          modelName: r.modelName || r.model || 'N/A',
          color: r.color || 'N/A',
          quantity: Number(r.quantity || 0),
          price: r.price ?? r.unitPrice ?? null,
          status: r.status || r.agreement || 'Pending',
          createdAt: r.createdAt || r.date || r.orderDate || null,
          _models: new Set(r.modelName || r.model ? [r.modelName || r.model] : []),
          _colors: new Set(r.color ? [r.color] : []),
          _prices: new Set(r.price != null ? [r.price] : []),
          _statuses: new Set(r.status ? [r.status] : []),
        });
      } else {
        const g = grouped.get(key);
        g.quantity += Number(r.quantity || 0);
        if (r.modelName || r.model) g._models.add(r.modelName || r.model);
        if (r.color) g._colors.add(r.color);
        if (r.price != null) g._prices.add(r.price);
        if (r.status) g._statuses.add(r.status);
        // keep earliest date
        const date = r.createdAt || r.date || r.orderDate;
        if (date && (!g.createdAt || date < g.createdAt)) g.createdAt = date;
      }
    }

    return Array.from(grouped.values()).map((g) => {
      const modelCount = g._models.size;
      const colorCount = g._colors.size;
      const priceCount = g._prices.size;
      // resolve status: if any Rejected -> Rejected; else if all Approved -> Approved; else Pending
      const statuses = Array.from(g._statuses);
      let status = 'Pending';
      if (statuses.some((s) => (s || '').toLowerCase() === 'rejected')) status = 'Rejected';
      else if (statuses.length > 0 && statuses.every((s) => (s || '').toLowerCase() === 'approved')) status = 'Approved';

      return {
        requestId: g.requestId,
        modelName: modelCount <= 1 ? (Array.from(g._models)[0] || 'N/A') : 'Multiple Models',
        color: colorCount <= 1 ? (Array.from(g._colors)[0] || 'N/A') : 'Mixed',
        quantity: g.quantity,
        price: priceCount === 1 ? Array.from(g._prices)[0] : null,
        status,
        createdAt: g.createdAt || null,
      };
    });
  };

  useEffect(() => {
    loadRequests();
    
    // Auto-refresh every 30 seconds to update status when EVM approves
    const interval = setInterval(() => {
      loadRequests();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Pending':
        return {
          icon: Clock,
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          label: 'Pending'
        };
      case 'Approved':
        return {
          icon: CheckCircle,
          color: 'bg-green-100 text-green-800 border-green-200',
          label: 'Approved'
        };
      case 'Rejected':
        return {
          icon: XCircle,
          color: 'bg-red-100 text-red-800 border-red-200',
          label: 'Rejected'
        };
      default:
        return {
          icon: Clock,
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          label: status
        };
    }
  };

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const filteredRequests = requests.filter((r) => {
    if (statusFilter !== 'all' && (r.status || '').toLowerCase() !== statusFilter) return false;
    if (query) {
      const q = query.toLowerCase();
      if (!(`${r.requestId || ''}`.toLowerCase().includes(q) || (r.modelName || '').toLowerCase().includes(q) || (r.color || '').toLowerCase().includes(q))) {
        return false;
      }
    }
    return true;
  });

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manufacturer Requests</h1>
            <p className="text-sm text-gray-600 mt-1">Manage and track requests to manufacturer</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadRequests}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Create Request</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search requests..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Brand / Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Color
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price (Unit)
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  {/* Actions column removed - top bar Refresh already exists */}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request, index) => {
                  const statusInfo = getStatusBadge(request.status);
                  const StatusIcon = statusInfo.icon;
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-gray-900">#{request.requestId}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{request.modelName || 'Model'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {request.color || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-medium text-gray-900">{request.quantity ?? 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm text-gray-900">{formatPrice(request.price ?? 0)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.createdAt ? new Date(request.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                      </td>
                      {/* Per-row action removed */}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {!loading && filteredRequests.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500 mb-4">No requests found</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Create Your First Request</span>
            </button>
          </div>
        )}

        {/* Create Request Modal */}
        <CreateManufacturerRequestModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={(requestData) => {
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            loadRequests();
          }}
        />

        {/* Toast Notification */}
        {showToast && (
          <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-right duration-300">
            <div className="bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 min-w-[300px] flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm font-medium text-green-800 flex-1">
                Request submitted successfully
              </p>
              <button
                onClick={() => setShowToast(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-lg">×</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ManufacturerRequestsList;

