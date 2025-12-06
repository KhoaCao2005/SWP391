import React, { useState, useEffect } from 'react';
import Layout from '../layout/Layout';
import { useNavigate, useParams } from 'react-router';
import { 
  ArrowLeft,
  TrendingUp,
  Package,
  Calendar,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  Clock,
  LineChart as LineChartIcon,
  History,
  TrendingDown,
  Send,
  RefreshCw
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { getModelDetail, createStockRequest } from '../services/inventoryService';

const ModelDetail = () => {
  const { modelId } = useParams();
  const navigate = useNavigate();
  const [modelData, setModelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [reorderQuantity, setReorderQuantity] = useState(5);
  const [reorderNotes, setReorderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadModelDetail = async () => {
      setLoading(true);
      try {
        const data = getModelDetail(parseInt(modelId));
        setModelData(data);
      } catch (error) {
        console.error('Error loading model detail:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (modelId) {
      loadModelDetail();
    }
  }, [modelId]);

  const handleReorder = async () => {
    setIsSubmitting(true);
    try {
      const result = createStockRequest(parseInt(modelId), reorderQuantity, reorderNotes);
      if (result.success) {
        alert(`Stock Request Created Successfully!\nRequest ID: ${result.data.requestId}\nQuantity: ${reorderQuantity}`);
        setShowReorderModal(false);
        setReorderQuantity(5);
        setReorderNotes('');
        // Navigate to manufacturer requests list page
        navigate('/manager/inventory/manufacturer-requests');
      }
    } catch (error) {
      console.error('Error creating stock request:', error);
      alert('Failed to create stock request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStockStatusColor = (status) => {
    switch(status) {
      case 'Low': return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'High': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading model details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!modelData) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-900 font-semibold">Model not found</p>
            <button
              onClick={() => navigate('/manager/inventory/stock')}
              className="mt-4 text-indigo-600 hover:text-indigo-700"
            >
              Back to Stock Overview
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/manager/inventory/stock')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{modelData.modelName}</h1>
              <p className="text-sm text-gray-600 mt-1">{modelData.description}</p>
            </div>
          </div>
          <button
            onClick={() => setShowReorderModal(true)}
            disabled={modelData.stockStatus === 'High'}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              modelData.stockStatus === 'High' 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            <Send className="w-5 h-5" />
            <span>Reorder from Manufacturer</span>
          </button>
        </div>

        {/* Stock Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total Stock</p>
              <Package className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{modelData.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Available</p>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-green-600">{modelData.available}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Reserved</p>
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-yellow-600">{modelData.reserved}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Sold</p>
              <ShoppingCart className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-blue-600">{modelData.sold}</p>
          </div>
        </div>

        {/* Stock Status Badge */}
        <div className={`rounded-lg border-2 p-4 ${getStockStatusColor(modelData.stockStatus)}`}>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <div>
              <p className="font-semibold">Stock Status: {modelData.stockStatus}</p>
              <p className="text-sm mt-1">
                {modelData.stockStatus === 'Low' 
                  ? '⚠️ Urgent: Stock is running low. Consider reordering immediately.'
                  : modelData.stockStatus === 'Medium'
                  ? '⚠️ Watch: Stock levels are moderate. Monitor closely.'
                  : '✓ Good: Stock levels are healthy.'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Demand Trend Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <LineChartIcon className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">Demand Trend (Last 6 Months)</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={modelData.demandTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Legend />
                <Line type="monotone" dataKey="reserved" stroke="#f59e0b" strokeWidth={2} name="Reserved" />
                <Line type="monotone" dataKey="sold" stroke="#10b981" strokeWidth={2} name="Sold" />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 text-sm text-gray-600">
              <p>• <span className="font-semibold text-orange-600">Reserved</span>: Vehicles ordered by customers</p>
              <p>• <span className="font-semibold text-green-600">Sold</span>: Vehicles completed sales</p>
            </div>
          </div>

          {/* Forecast Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <TrendingDown className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Stock Forecast (Next 3 Months)</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={modelData.forecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="predicted" fill="#8b5cf6" name="Predicted Stock" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Forecast is based on average monthly sales. If current trend continues, stock may run out by{' '}
                {modelData.forecast.find(f => f.predicted <= 0)?.month || 'future months'}.
              </p>
            </div>
          </div>
        </div>

        {/* History Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <History className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">Vehicle History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VIN</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Sale Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {modelData.history.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{item.vin}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {item.color}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.status === 'Available' ? 'bg-green-100 text-green-800' :
                        item.status === 'Reserved' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-gray-900">
                      {formatPrice(item.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                      {item.date || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reorder Modal */}
        {showReorderModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Create Stock Request</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Model
                    </label>
                    <input
                      type="text"
                      value={modelData.modelName}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={reorderQuantity}
                      onChange={(e) => setReorderQuantity(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={reorderNotes}
                      onChange={(e) => setReorderNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Add any special instructions or requirements..."
                    />
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowReorderModal(false);
                      setReorderQuantity(5);
                      setReorderNotes('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReorder}
                    disabled={isSubmitting || reorderQuantity < 1}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ModelDetail;

