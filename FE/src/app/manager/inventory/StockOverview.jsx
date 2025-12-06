import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../layout/Layout';
import { useNavigate } from 'react-router';
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Download,
  RefreshCw,
  Filter,
  Search,
  BarChart3,
  PieChart as PieChartIcon,
  Car,
  Clock,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  List,
  Eye
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { getVehicles, getStockOverview, getDealers } from '../services/inventoryService';

const StockOverview = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [overview, setOverview] = useState({ 
    totals: { total: 0, available: 0, reserved: 0, sold: 0, turnover: 0 }, 
    byModel: [] 
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // Filters
  const [selectedDealer, setSelectedDealer] = useState('all');
  const [selectedModel, setSelectedModel] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateRange, setDateRange] = useState('30'); // days
  const [searchQuery, setSearchQuery] = useState('');

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const dealersList = getDealers();
        setDealers(dealersList);
        
        const vehiclesData = getVehicles({ 
          search: searchQuery, 
          status: selectedStatus, 
          dealer: selectedDealer 
        });
        setVehicles(vehiclesData);
        
        const overviewData = getStockOverview();
        setOverview(overviewData);
        
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error loading stock data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [selectedDealer, selectedModel, selectedStatus, searchQuery]);

  // Refresh handler
  const handleRefresh = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    const vehiclesData = getVehicles({ 
      search: searchQuery, 
      status: selectedStatus, 
      dealer: selectedDealer 
    });
    setVehicles(vehiclesData);
    const overviewData = getStockOverview();
    setOverview(overviewData);
    setLastUpdated(new Date());
    setLoading(false);
  };

  // Get unique models from vehicles
  const availableModels = useMemo(() => {
    const models = new Set();
    vehicles.forEach(v => {
      const modelName = v.model.split(' ').slice(0, -1).join(' ');
      models.add(modelName);
    });
    return Array.from(models);
  }, [vehicles]);


  // Calculate stock trends (last 6 months)
  const stockTrendData = useMemo(() => {
    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const baseValues = [45, 48, 42, 38, 35, overview.totals.total];
    return months.map((month, idx) => ({
      month,
      stock: baseValues[idx],
      sold: Math.round(baseValues[idx] * 0.15),
      reserved: Math.round(baseValues[idx] * 0.1)
    }));
  }, [overview.totals.total]);

  // Status distribution for pie chart
  const statusDistributionData = useMemo(() => {
    const available = vehicles.filter(v => v.status === 'Available').length;
    const reserved = vehicles.filter(v => v.status === 'Reserved').length;
    const sold = vehicles.filter(v => v.status === 'Sold').length;
    return [
      { name: 'Available', value: available, color: '#10b981' },
      { name: 'Reserved', value: reserved, color: '#f59e0b' },
      { name: 'Sold', value: sold, color: '#3b82f6' }
    ].filter(item => item.value > 0);
  }, [vehicles]);

  // Stock by model data
  const stockByModelData = useMemo(() => {
    const modelMap = new Map();
    vehicles.forEach(v => {
      const modelName = v.model.split(' ').slice(0, -1).join(' ') || v.model;
      const data = modelMap.get(modelName) || { available: 0, reserved: 0, sold: 0, total: 0 };
      data.total += 1;
      if (v.status === 'Available') data.available += 1;
      if (v.status === 'Reserved') data.reserved += 1;
      if (v.status === 'Sold') data.sold += 1;
      modelMap.set(modelName, data);
    });
    
    return Array.from(modelMap.entries()).map(([model, data]) => ({
      model,
      ...data,
      turnover: data.total > 0 ? Math.round((data.sold / data.total) * 100) : 0
    })).sort((a, b) => b.total - a.total);
  }, [vehicles]);

  // Alerts: Low stock, aging stock, overstock
  const alerts = useMemo(() => {
    const alertList = [];
    
    // Low stock alerts (available < 3)
    stockByModelData.forEach(item => {
      if (item.available < 3 && item.available > 0) {
        alertList.push({
          type: 'low_stock',
          severity: 'high',
          model: item.model,
          message: `Low stock: Only ${item.available} ${item.model} available`,
          icon: AlertTriangle,
          color: 'red'
        });
      }
    });
    
    // Aging stock alerts (days in stock > 60)
    const agingVehicles = vehicles.filter(v => v.daysInStock > 60 && v.status === 'Available');
    if (agingVehicles.length > 0) {
      alertList.push({
        type: 'aging_stock',
        severity: 'medium',
        count: agingVehicles.length,
        message: `${agingVehicles.length} vehicle(s) in stock for over 60 days`,
        icon: Clock,
        color: 'orange'
      });
    }
    
    // Overstock alerts (available > 20)
    stockByModelData.forEach(item => {
      if (item.available > 20) {
        alertList.push({
          type: 'overstock',
          severity: 'low',
          model: item.model,
          message: `High inventory: ${item.available} ${item.model} in stock`,
          icon: Package,
          color: 'blue'
        });
      }
    });
    
    return alertList;
  }, [stockByModelData, vehicles]);

  // Export handler
  const handleExport = () => {
    const csvContent = [
      ['Model', 'Dealer', 'Status', 'Import Date', 'Days in Stock', 'VIN'].join(','),
      ...vehicles.map(v => [
        v.model,
        v.dealerName,
        v.status,
        v.importDate,
        v.daysInStock,
        v.vin
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-overview-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

  if (loading && vehicles.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading stock overview...</p>
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
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stock Overview</h1>
            <p className="text-sm text-gray-600 mt-1">
              Model-level inventory analytics • Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/manager/inventory/vehicles')}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <List className="w-4 h-4" />
              <span>View Vehicle List</span>
            </button>
            <button
              onClick={handleRefresh}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900">Stock Alerts</h3>
              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                {alerts.length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {alerts.slice(0, 6).map((alert, idx) => {
                const Icon = alert.icon;
                return (
                  <div
                    key={idx}
                    className={`flex items-start space-x-3 p-3 rounded-lg border ${
                      alert.color === 'red' ? 'bg-red-50 border-red-200' :
                      alert.color === 'orange' ? 'bg-orange-50 border-orange-200' :
                      'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mt-0.5 ${
                      alert.color === 'red' ? 'text-red-600' :
                      alert.color === 'orange' ? 'text-orange-600' :
                      'text-blue-600'
                    }`} />
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        alert.color === 'red' ? 'text-red-900' :
                        alert.color === 'orange' ? 'text-orange-900' :
                        'text-blue-900'
                      }`}>
                        {alert.message}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search VIN or Model..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedDealer}
              onChange={(e) => setSelectedDealer(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Dealers</option>
              {dealers.map(d => (
                <option key={d.dealerId} value={d.dealerName}>{d.dealerName}</option>
              ))}
            </select>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Models</option>
              {availableModels.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="sold">Sold</option>
            </select>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="365">Last Year</option>
            </select>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stock Trends Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-900">Stock Trends</h3>
              </div>
              <span className="text-sm text-gray-500">Last 6 Months</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stockTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Legend />
                <Area type="monotone" dataKey="stock" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Area type="monotone" dataKey="reserved" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                <Area type="monotone" dataKey="sold" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Status Distribution Pie Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <PieChartIcon className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">Status Distribution</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={statusDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="mt-4 flex justify-center space-x-6">
              {statusDistributionData.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stock by Model Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">Stock by Model</h3>
            </div>
            <span className="text-sm text-gray-500">{stockByModelData.length} Models</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Available
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reserved
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sold
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Turnover %
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stockByModelData.map((item, idx) => {
                  const turnoverColor = item.turnover >= 65 ? 'text-green-600' :
                                       item.turnover >= 50 ? 'text-yellow-600' : 'text-red-600';
                  const statusColor = item.stockStatus === 'Low' ? 'bg-red-100 text-red-800' :
                                    item.stockStatus === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800';
                  return (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => item.modelId && navigate(`/manager/inventory/model/${item.modelId}`)}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Car className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">{item.model}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-semibold text-gray-900">{item.total}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-semibold text-green-600">{item.available}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-semibold text-yellow-600">{item.reserved}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-semibold text-blue-600">{item.sold}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <span className={`text-sm font-semibold ${turnoverColor}`}>
                            {item.turnover}%
                          </span>
                          {item.turnover >= 65 ? (
                            <ArrowUpRight className="w-3 h-3 text-green-500" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3 text-red-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                          {item.stockStatus} Stock
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.modelId) navigate(`/manager/inventory/model/${item.modelId}`);
                          }}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StockOverview;

