import React, { useState, useEffect } from 'react';
import Layout from '../layout/Layout';
import { FileText, Eye, Search, CheckCircle, Star, AlertTriangle, Send, Filter, TrendingUp, Users } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const OrderForm = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState('all');
  const [specialOrderFilter, setSpecialOrderFilter] = useState('all');
  const [selectedOrderForm, setSelectedOrderForm] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Order forms data - fetched from API
  const [orderForms, setOrderForms] = useState([]);
  
  // Maps for customer, vehicle, and staff names
  const [customerMap, setCustomerMap] = useState(new Map());
  const [vehicleMap, setVehicleMap] = useState(new Map());
  const [staffMap, setStaffMap] = useState(new Map());

  // Fetch orders from API with name mapping
  useEffect(() => {
    const loadAllData = async () => {
      // ✅ FIX: Khai báo maps bên ngoài try block để tránh undefined
      let customerNameMap = new Map();
      let vehicleNameMap = new Map();
      let staffNameMap = new Map();
      
      try {
        // Fetch all customers for name mapping
        const token = localStorage.getItem('token');
        const isNgrokUrl = API_URL?.includes('ngrok');
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };
        
        if (isNgrokUrl) {
          headers['ngrok-skip-browser-warning'] = 'true';
        }

        // Fetch customers
        try {
          const customersResponse = await axios.post(
            `${API_URL}/staff/viewAllCustomer`,
            {},
            { headers }
          );
          
          if (customersResponse.data && customersResponse.data.status === 'success' && customersResponse.data.data) {
            for (const customer of customersResponse.data.data) {
              const customerId = customer.customerId || customer.customer_id || customer.id;
              if (customerId) {
                const id = parseInt(customerId);
                if (!isNaN(id)) {
                  customerNameMap.set(id, customer.name || `Customer ${id}`);
                }
              }
            }
          }
          setCustomerMap(customerNameMap);
          console.log(`✅ Loaded ${customerNameMap.size} customers for name mapping`);
        } catch (err) {
          console.warn('⚠️ Could not load customers:', err);
        }

        // Fetch vehicle models for name mapping
        try {
          // ✅ FIX: Đổi endpoint từ viewInventory sang viewVehicle
          const inventoryResponse = await axios.post(
            `${API_URL}/staff/viewVehicle`,
            {},
            { headers }
          );
          
          if (inventoryResponse.data && inventoryResponse.data.status === 'success' && inventoryResponse.data.data) {
            for (const model of inventoryResponse.data.data) {
              const modelId = model.modelId || model.model_id;
              const modelName = model.modelName || model.name || `Model ${modelId}`;
              if (modelId) {
                const id = parseInt(modelId);
                if (!isNaN(id)) {
                  vehicleNameMap.set(id, modelName);
                }
              }
            }
          }
          setVehicleMap(vehicleNameMap);
          console.log(`✅ Loaded ${vehicleNameMap.size} vehicle models for name mapping`);
        } catch (err) {
          console.warn('⚠️ Could not load vehicles:', err);
        }

        // Now fetch orders first, then we'll fetch staff accounts based on unique staffIds
        await fetchOrdersWithMaps(customerNameMap, vehicleNameMap, staffNameMap);
      } catch (err) {
        console.error('Error loading data:', err);
        // Still try to fetch orders (will show IDs if names not available)
        await fetchOrdersWithMaps(customerNameMap, vehicleNameMap, staffNameMap);
      }
    };
    
    loadAllData();
  }, []);

  const fetchOrdersWithMaps = async (customerNameMap, vehicleNameMap, staffNameMap) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const isNgrokUrl = API_URL?.includes('ngrok');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      if (isNgrokUrl) {
        headers['ngrok-skip-browser-warning'] = 'true';
      }
      
      const response = await axios.post(
        `${API_URL}/staff/viewOrdersByStaffId`,
        {},
        { headers }
      );
      
      if (response.data && response.data.status === 'success' && response.data.data) {
        console.log(`📥 Raw orders from API: ${response.data.data.length} orders`);
        
        // Debug: Check if backend returns dealerStaffName
        if (response.data.data.length > 0) {
          const firstOrder = response.data.data[0];
          console.log('📥 Sample order from API:', {
            orderId: firstOrder.orderId,
            dealerStaffId: firstOrder.dealerStaffId,
            dealerStaffName: firstOrder.dealerStaffName,
            hasDealerStaffName: !!firstOrder.dealerStaffName
          });
        }
        
        // Build staff name map from orders response if username is available
        // Note: We don't fetch from EVM API as manager doesn't have access
        // Backend OrderService.GetListOrderByDealerStaffId() returns dealerStaffName field
        
        // Transform backend data to frontend format with name mapping
        const transformedOrders = response.data.data.map((order, index) => {
          try {
            // Parse order date
            let orderDate = order.orderDate || new Date().toISOString().split('T')[0];
            if (order.orderDate && order.orderDate.includes(' ')) {
              orderDate = order.orderDate.split(' ')[0];
            }
            
            // Get amount from order detail (preferred) or calculate from quantity * unitPrice
            const detail = order.detail || order.orderDetail || null;
            let quantity = 1;
            let unitPrice = 0;
            let amount = 0;
            
            if (detail) {
              // Get from detail object
              quantity = parseInt(detail.quantity || '1');
              unitPrice = parseFloat(detail.unitPrice || 0);
              amount = quantity * unitPrice;
            } else {
              // Fallback: try to get from order directly
              quantity = parseInt(order.quantity || '1');
              unitPrice = parseFloat(order.unitPrice || 0);
              amount = quantity * unitPrice;
            }
            
            // Get IDs
            const customerId = order.customerId || order.customer_id;
            const modelId = order.modelId || order.model_id;
            const staffId = order.dealerStaffId || order.dealer_staff_id || order.salespersonId;
            
            // Get names from maps or order data
            const customerName = customerNameMap.get(customerId) || order.customerName || `Customer ${customerId || 'N/A'}`;
            const vehicleName = vehicleNameMap.get(modelId) || order.vehicleName || `Model ${modelId || 'N/A'}`;
            
            // ✅ FIX: Get username from order response - backend returns dealerStaffName
            // Backend OrderService.GetListOrderByDealerStaffId() returns dealerStaffName field
            const staffName = order.dealerStaffName || order.username || order.salespersonName || 
                            order.staffName || order.staffUsername || 
                            (staffId ? `Staff ${staffId}` : 'N/A');
            
            // If we have username from order, add it to map for future use
            if (staffId && (order.dealerStaffName || order.username || order.salespersonName || 
                          order.staffName || order.staffUsername)) {
              const staffIdInt = parseInt(staffId);
              if (!isNaN(staffIdInt)) {
                const username = order.dealerStaffName || order.username || order.salespersonName || 
                               order.staffName || order.staffUsername;
                if (username && username !== `Staff ${staffId}` && username !== 'N/A' && username !== 'Unknown') {
                  staffNameMap.set(staffIdInt, username);
                }
              }
            }
            
            // Transform order - include ALL orders regardless of status or detail
            const transformed = {
              id: `OF-${order.orderId}`,
              orderId: order.orderId,
              customer: customerName,
              customerId: customerId,
              salesperson: staffName,
              dealerStaffId: staffId,
              vehicle: vehicleName,
              modelId: modelId,
              serialId: order.serialId || null,
              amount: amount,
              quantity: quantity,
              unitPrice: unitPrice,
              status: order.status || 'Pending', // Default to 'Pending' if null
              orderDate: orderDate,
              createdDate: orderDate,
              isSpecialOrder: order.isCustom || false,
              flaggedForCompany: order.flaggedForCompany || false,
              orderDetailId: order.orderDetailId || null,
              confirmationId: order.confirmationId || null,
              agreement: order.agreement || null,
              confirmationDateTime: order.confirmationDateTime || null
            };
            
            return transformed;
          } catch (err) {
            console.error(`❌ Error transforming order ${order.orderId}:`, err);
            // Even if transform fails, still return a basic order object
            const staffId = order.dealerStaffId || order.dealer_staff_id || order.salespersonId;
            const staffIdInt = staffId ? parseInt(staffId) : null;
            const usernameFromMap = staffIdInt ? staffNameMap.get(staffIdInt) : null;
            // ✅ FIX: Prioritize dealerStaffName from backend response
            const staffName = order.dealerStaffName || usernameFromMap || order.username || 
                            order.salespersonName || order.staffName || order.staffUsername ||
                            (staffId ? `Staff ${staffId}` : 'N/A');
            
            // Try to get amount from detail even in error case
            const detail = order.detail || order.orderDetail || null;
            let amount = 0;
            if (detail) {
              const qty = parseInt(detail.quantity || '1');
              const price = parseFloat(detail.unitPrice || 0);
              amount = qty * price;
            }
            
            return {
              id: `OF-${order.orderId}`,
              orderId: order.orderId,
              customer: `Customer ${order.customerId || 'N/A'}`,
              customerId: order.customerId,
              salesperson: staffName,
              dealerStaffId: staffId,
              vehicle: `Model ${order.modelId || 'N/A'}`,
              modelId: order.modelId,
              serialId: null,
              amount: amount,
              quantity: 1,
              unitPrice: 0,
              status: order.status || 'Pending',
              orderDate: new Date().toISOString().split('T')[0],
              createdDate: new Date().toISOString().split('T')[0],
              isSpecialOrder: false,
              flaggedForCompany: false,
              orderDetailId: null,
              confirmationId: null,
              agreement: null,
              confirmationDateTime: null
            };
          }
        }).filter(Boolean);
        
        // Update staff map from orders (extract staff names if available)
        const newStaffMap = new Map(staffNameMap);
        transformedOrders.forEach(order => {
          if (order.dealerStaffId && order.salesperson && order.salesperson !== `Staff ${order.dealerStaffId}`) {
            newStaffMap.set(order.dealerStaffId, order.salesperson);
          }
        });
        setStaffMap(newStaffMap);
        
        console.log(`✅ Transformed ${transformedOrders.length} orders (should match raw count: ${response.data.data.length})`);
        console.log(`📋 Orders by status:`, transformedOrders.reduce((acc, o) => {
          acc[o.status] = (acc[o.status] || 0) + 1;
          return acc;
        }, {}));
        
        setOrderForms(transformedOrders);
      } else {
        console.warn('⚠️ API response not successful or no data:', response.data);
        setOrderForms([]);
        setError(response.data?.message || 'Failed to load orders');
      }
    } catch (err) {
      console.error('❌ Error fetching orders:', err);
      setOrderForms([]);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Authentication failed. Please log in again.');
      } else {
        setError(err.response?.data?.message || 'Failed to load orders');
      }
    } finally {
      setLoading(false);
    }
  };

  // Get unique staff list
  const staffList = [...new Set(orderForms.map(of => of.salesperson))];
  
  // Get unique status list for dynamic filter dropdown
  const statusList = [...new Set(orderForms.map(of => of.status).filter(Boolean))].sort();

  // Filter order forms - Show ALL orders by default, filter only when user selects
  // IMPORTANT: This is only for UI filtering. All orders are already loaded from backend.
  const filteredOrderForms = orderForms.filter(of => {
    // Status filter - case-insensitive comparison (only filter if user selected a specific status)
    if (statusFilter !== 'all') {
      const orderStatus = (of.status || '').toLowerCase();
      const filterStatus = statusFilter.toLowerCase();
      if (orderStatus !== filterStatus) return false;
    }
    
    // Staff filter (only filter if user selected a specific staff)
    if (staffFilter !== 'all' && of.salesperson !== staffFilter) return false;
    
    // Special order filter (only filter if user selected a specific type)
    if (specialOrderFilter === 'special' && !of.isSpecialOrder) return false;
    if (specialOrderFilter === 'flagged' && !of.flaggedForCompany) return false;
    if (specialOrderFilter === 'normal' && of.isSpecialOrder) return false;
    
    // Search filter (only filter if user entered search query)
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesId = of.id?.toLowerCase().includes(searchLower);
      const matchesCustomer = of.customer?.toLowerCase().includes(searchLower);
      const matchesOrderId = of.orderId?.toString().includes(searchLower);
      if (!matchesId && !matchesCustomer && !matchesOrderId) return false;
    }
    
    // Include all other orders
    return true;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    if (!status) {
      status = 'Unknown';
    }
    
    // Normalize status to lowercase for comparison
    const statusLower = status.toLowerCase();
    
    const statusConfig = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
      'completed': { color: 'bg-green-100 text-green-800', icon: '✅' },
      'delivered': { color: 'bg-green-100 text-green-800', icon: '✅' },
      'cancelled': { color: 'bg-red-100 text-red-800', icon: '❌' },
      'cancel': { color: 'bg-red-100 text-red-800', icon: '❌' },
      'confirmed': { color: 'bg-blue-100 text-blue-800', icon: '✓' },
      'in progress': { color: 'bg-purple-100 text-purple-800', icon: '🔄' },
      'approved': { color: 'bg-indigo-100 text-indigo-800', icon: '✓' },
    };
    
    const config = statusConfig[statusLower] || { 
      color: 'bg-gray-100 text-gray-800', 
      icon: '📋' 
    };
    
    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        <span>{config.icon}</span>
        <span>{status}</span>
      </span>
    );
  };

  const handleView = (orderForm) => {
    setSelectedOrderForm(orderForm);
    setIsViewModalOpen(true);
  };

  const handleApproveSpecialOrder = (orderFormId) => {
    if (window.confirm(`Approve special order ${orderFormId}? This will send the request to the company.`)) {
      console.log('Approving special order:', orderFormId);
      alert(`✅ Special order ${orderFormId} approved and sent to company for processing.`);
    }
  };

  // Statistics - Count all orders regardless of status
  const stats = {
    total: orderForms.length,
    pending: orderForms.filter(of => of.status && of.status.toLowerCase() === 'pending').length,
    completed: orderForms.filter(of => {
      const status = of.status?.toLowerCase();
      return status === 'completed' || status === 'delivered';
    }).length,
    specialOrders: orderForms.filter(of => of.isSpecialOrder).length,
    flagged: orderForms.filter(of => of.flaggedForCompany).length,
    totalRevenue: orderForms.reduce((sum, of) => sum + (of.amount || 0), 0)
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading orders...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-900 font-semibold">Error loading orders</p>
            <p className="text-gray-600 mt-2">{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 flex items-center space-x-2">
                <FileText className="w-7 h-7" />
                <span>Order Forms Overview</span>
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Monitor all order forms from staff members
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">Total Orders</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.specialOrders}</p>
                <p className="text-sm text-gray-600">Special Orders</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-sm text-gray-600">Total Revenue</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter - Dynamic based on available statuses */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              {statusList.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            {/* Staff Filter */}
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Staff</option>
              {staffList.map(staff => (
                <option key={staff} value={staff}>{staff}</option>
              ))}
            </select>

            {/* Special Order Filter */}
            <select
              value={specialOrderFilter}
              onChange={(e) => setSpecialOrderFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Orders</option>
              <option value="normal">Normal Orders</option>
              <option value="special">Special Orders</option>
              <option value="flagged">Flagged for Company</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Form ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrderForms.map((orderForm) => (
                  <tr key={orderForm.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{orderForm.id}</div>
                      <div className="text-xs text-gray-500">{formatDate(orderForm.createdDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{orderForm.salesperson}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{orderForm.customer}</div>
                      <div className="text-xs text-gray-500">{orderForm.customerId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{orderForm.vehicle}</div>
                      {orderForm.isSpecialOrder && (
                        <div className="flex items-center space-x-1 mt-1">
                          <Star className="w-3 h-3 text-purple-600" />
                          <span className="text-xs text-purple-600">Qty: {orderForm.quantity}</span>
                        </div>
                      )}
                      {orderForm.flaggedForCompany && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mt-1">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Flagged
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(orderForm.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(orderForm.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleView(orderForm)}
                          className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </button>
                        {orderForm.isSpecialOrder && orderForm.flaggedForCompany && (
                          <button
                            onClick={() => handleApproveSpecialOrder(orderForm.id)}
                            className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Approve</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredOrderForms.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No orders found</p>
              <p className="text-gray-400 text-sm mt-2">
                {orderForms.length === 0 
                  ? "There are no orders in the system yet."
                  : "No orders match your current filters."}
              </p>
            </div>
          )}
        </div>

        {/* View Modal */}
        {isViewModalOpen && selectedOrderForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Order Form Details</h2>
                    <p className="text-blue-100 text-sm mt-1">{selectedOrderForm.id}</p>
                  </div>
                  <button
                    onClick={() => setIsViewModalOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-full"
                  >
                    <span className="text-2xl">&times;</span>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Order Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Order ID</label>
                    <p className="text-gray-900 mt-1">{selectedOrderForm.orderId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Order Date</label>
                    <p className="text-gray-900 mt-1">{formatDate(selectedOrderForm.orderDate || selectedOrderForm.createdDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Status</label>
                    <p className="text-gray-900 mt-1">{getStatusBadge(selectedOrderForm.status)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Created By (Staff ID)</label>
                    <p className="text-gray-900 mt-1">{selectedOrderForm.salesperson} (ID: {selectedOrderForm.dealerStaffId})</p>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Customer ID</label>
                      <p className="text-gray-900 mt-1">{selectedOrderForm.customerId}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Customer</label>
                      <p className="text-gray-900 mt-1">{selectedOrderForm.customer}</p>
                    </div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Vehicle Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Model ID</label>
                      <p className="text-gray-900 mt-1">{selectedOrderForm.modelId}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Vehicle</label>
                      <p className="text-gray-900 mt-1">{selectedOrderForm.vehicle}</p>
                    </div>
                    {selectedOrderForm.serialId && (
                      <div>
                        <label className="text-sm font-semibold text-gray-700">Serial ID / VIN</label>
                        <p className="text-gray-900 mt-1">{selectedOrderForm.serialId}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Detail Information */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedOrderForm.orderDetailId && (
                      <div>
                        <label className="text-sm font-semibold text-gray-700">Order Detail ID</label>
                        <p className="text-gray-900 mt-1">{selectedOrderForm.orderDetailId}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Quantity</label>
                      <p className="text-gray-900 mt-1">{selectedOrderForm.quantity} units</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Unit Price</label>
                      <p className="text-gray-900 mt-1">{formatCurrency(selectedOrderForm.unitPrice || 0)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Total Amount</label>
                      <p className="text-gray-900 mt-1 font-semibold text-lg">{formatCurrency(selectedOrderForm.amount)}</p>
                    </div>
                  </div>
                </div>

                {/* Special Order Information */}
                {selectedOrderForm.isSpecialOrder && (
                  <div className="border-t pt-4">
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-3">
                        <Star className="w-5 h-5 text-purple-600" />
                        <span className="font-semibold text-purple-900 text-lg">Special Order</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-semibold text-gray-700">Quantity</label>
                          <p className="text-gray-900 mt-1">{selectedOrderForm.quantity} units</p>
                        </div>
                        {selectedOrderForm.confirmationId && (
                          <div>
                            <label className="text-sm font-semibold text-gray-700">Confirmation ID</label>
                            <p className="text-gray-900 mt-1">{selectedOrderForm.confirmationId}</p>
                          </div>
                        )}
                        {selectedOrderForm.agreement && (
                          <div className="col-span-2">
                            <label className="text-sm font-semibold text-gray-700">Agreement</label>
                            <p className="text-gray-900 mt-1">{selectedOrderForm.agreement}</p>
                          </div>
                        )}
                        {selectedOrderForm.confirmationDateTime && (
                          <div>
                            <label className="text-sm font-semibold text-gray-700">Confirmation Date/Time</label>
                            <p className="text-gray-900 mt-1">{selectedOrderForm.confirmationDateTime}</p>
                          </div>
                        )}
                      </div>
                      {selectedOrderForm.flaggedForCompany && (
                        <div className="mt-3 p-3 bg-red-50 rounded-lg">
                          <p className="text-sm text-red-600 flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            <span className="font-semibold">Flagged for company review</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default OrderForm;
