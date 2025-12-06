import React, { useState, useEffect } from 'react';
import Layout from '../layout/Layout';
import { Truck, CheckCircle, Clock, Package, AlertCircle, Loader2, XCircle } from 'lucide-react';
import { viewOrdersByStaffId, updateOrderStatus } from '../services/orderService';
import { getAllCustomers } from '../services/customerService';
import { fetchInventory } from '../services/inventoryService';

const Delivery = () => {
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, delivered, cancel
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  // Maps for customer and vehicle names
  const [customerMap, setCustomerMap] = useState(new Map()); // customerId -> customerName
  const [vehicleMap, setVehicleMap] = useState(new Map()); // modelId -> modelName

  // Fetch customer names and vehicle names, then fetch orders
  useEffect(() => {
    const loadAllData = async () => {
      try {
        // Fetch all customers
        const customersResult = await getAllCustomers();
        const customerNameMap = new Map();
        if (customersResult.success && customersResult.data) {
          for (const customer of customersResult.data) {
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

        // Fetch vehicle models
        const inventoryResult = await fetchInventory();
        const vehicleNameMap = new Map();
        if (inventoryResult.success && inventoryResult.data) {
          for (const model of inventoryResult.data) {
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
        
        // Now fetch orders with the maps available
        await fetchOrdersWithMaps(customerNameMap, vehicleNameMap);
      } catch (err) {
        console.error('Error fetching customer/vehicle data:', err);
        // Still try to fetch orders (will show IDs if names not available)
        await fetchOrdersWithMaps(new Map(), new Map());
      }
    };
    
    loadAllData();
  }, []); // Only run once on mount

  const fetchOrdersWithMaps = async (customerNameMap, vehicleNameMap) => {
    setLoading(true);
    setError(null);
    
    const result = await viewOrdersByStaffId();
    
    if (result.success && result.data && result.data.length > 0) {
      // IMPORTANT: Show ALL orders with ALL statuses - do not filter
      // Map ALL orders and enrich with customer/vehicle names
      const filtered = result.data.map(order => {
        // Get status from various possible field names
        const orderStatus = order.status || order.order_status || order.Status || 'Pending';
        
        // Map backend status to delivery display status
        // Handle all possible status values: pending, Pending, delivered, Delivered, cancelled, Cancelled, Cancel, cancel
        let deliveryStatus = 'Not Delivered';
        const statusLower = (orderStatus || '').toLowerCase().trim();
        
        if (statusLower === 'delivered') {
          deliveryStatus = 'Delivered';
        } else if (statusLower === 'cancel' || statusLower === 'cancelled') {
          deliveryStatus = 'Cancelled';
        } else if (statusLower === 'pending') {
          deliveryStatus = 'Not Delivered';
        } else {
          // For any other status, default to 'Not Delivered'
          deliveryStatus = 'Not Delivered';
        }
        
        // Get customer and vehicle names from maps
        const customerId = order.customerId || order.customer_id || order.CustomerId;
        const modelId = order.modelId || order.model_id || order.ModelId;
        const customerName = customerNameMap.get(customerId) || `Customer ${customerId || 'N/A'}`;
        const vehicleName = vehicleNameMap.get(modelId) || `Model ${modelId || 'N/A'}`;
        
        return {
          ...order,
          status: orderStatus, // Ensure status is always set
          deliveryStatus,
          orderId: order.orderId || order.order_id || order.OrderId,
          customerId: customerId,
          customerName: customerName, // ✅ Added customer name
          modelId: modelId,
          vehicleName: vehicleName, // ✅ Added vehicle name
          orderDate: order.orderDate || order.order_date || order.OrderDate
        };
      });
      setOrders(filtered);
      setError(null);
      console.log(`✅ Loaded ${filtered.length} orders with customer and vehicle names`);
    } else {
      // Endpoint not available or no data
      setOrders([]);
      if (result.message) {
        setError(result.message);
      } else {
        setError(null);
      }
    }
    
    setLoading(false);
  };

  // Also provide a function to refresh orders (uses current state maps)
  const fetchOrders = async () => {
    await fetchOrdersWithMaps(customerMap, vehicleMap);
  };

  // Filter deliveries based on status
  const filteredDeliveries = orders.filter(d => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return d.deliveryStatus === 'Not Delivered';
    if (statusFilter === 'delivered') return d.deliveryStatus === 'Delivered';
    if (statusFilter === 'cancel') return d.deliveryStatus === 'Cancelled';
    return true;
  });

  // Get status badge - handle all possible statuses
  const getStatusBadge = (status) => {
    // Normalize status to handle case variations
    const statusLower = (status || '').toLowerCase().trim();
    let normalizedStatus = 'Not Delivered';
    
    if (statusLower === 'delivered') {
      normalizedStatus = 'Delivered';
    } else if (statusLower === 'cancel' || statusLower === 'cancelled') {
      normalizedStatus = 'Cancelled';
    } else if (statusLower === 'pending') {
      normalizedStatus = 'Not Delivered';
    }
    
    const statusConfig = {
      'Delivered': { color: 'bg-green-100 text-green-800', icon: '✅', label: 'Delivered' },
      'Not Delivered': { color: 'bg-yellow-100 text-yellow-800', icon: '⏳', label: 'Not Delivered' },
      'Cancelled': { color: 'bg-red-100 text-red-800', icon: '❌', label: 'Cancelled' },
    };

    const config = statusConfig[normalizedStatus] || { color: 'bg-gray-100 text-gray-800', icon: '❓', label: status || 'Unknown' };
    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </span>
    );
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Handle view details
  const handleViewDetails = (delivery) => {
    setSelectedDelivery(delivery);
    setIsDetailsModalOpen(true);
  };

  // Handle update order status
  const handleUpdateStatus = async (orderId, newStatus) => {
    if (!window.confirm(`Are you sure you want to update order #${orderId} status to "${newStatus}"?`)) {
      return;
    }

    setUpdatingStatus(true);
    try {
      const result = await updateOrderStatus(orderId, newStatus);
      
      if (result.success) {
        alert(`✅ Order #${orderId} status updated to "${newStatus}" successfully!`);
        
        // Update local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.orderId === orderId || order.order_id === orderId
              ? { 
                  ...order, 
                  status: newStatus,
                  deliveryStatus: newStatus === 'Delivered' ? 'Delivered' : 
                                newStatus === 'Cancel' ? 'Cancelled' : 'Not Delivered'
                }
              : order
          )
        );
        
        // Update selected delivery if it's the same order
        if (selectedDelivery && (selectedDelivery.orderId === orderId || selectedDelivery.order_id === orderId)) {
          setSelectedDelivery({
            ...selectedDelivery,
            status: newStatus,
            deliveryStatus: newStatus === 'Delivered' ? 'Delivered' : 
                           newStatus === 'Cancel' ? 'Cancelled' : 'Not Delivered'
          });
        }
        
        // Refresh data from server
        await fetchOrders();
      } else {
        alert(`❌ Failed to update order status: ${result.message}`);
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Failed to update order status. Please try again.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 flex items-center space-x-2">
                <Truck className="w-7 h-7" />
                <span>Delivery Management</span>
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Track and manage order deliveries. Delivery status is based on Order status.
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-800 mb-2">Backend Endpoint Not Available</p>
                <p className="text-sm text-yellow-700 mb-3">{error}</p>
                
                {error.includes('viewOrdersByStaffId') && (
                  <div className="bg-white border border-yellow-300 rounded-lg p-4 mt-3">
                    <p className="text-xs font-semibold text-yellow-800 mb-2">📋 Backend Implementation Required:</p>
                    <div className="text-xs text-yellow-700 space-y-2">
                      <p><strong>✅ Available in Backend:</strong></p>
                      <ul className="list-disc list-inside ml-2 space-y-1">
                        <li>OrderDAO.getByStaffId() - retrieves orders by dealer_staff_id</li>
                        <li>OrderService.GetListOrderByDealerStaffId() - service method exists</li>
                        <li>Order table has status field: "Pending", "Delivered", "Cancel"</li>
                      </ul>
                      <p className="mt-2"><strong>❌ Missing:</strong> Controller endpoint</p>
                      <p className="mt-2 font-mono bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                        Create: ViewOrdersByStaffIdController.java<br/>
                        Use: JwtUtil.extractUserId(token) to get staffId<br/>
                        Call: orderService.GetListOrderByDealerStaffId(staffId)<br/>
                        Return: List&lt;OrderDTO&gt; with status field
                      </p>
                    </div>
                    <p className="text-xs text-yellow-600 mt-3 italic">
                      Reference: See ApproveCustomOrderController.java for JWT extraction pattern
                    </p>
                  </div>
                )}
                
                <p className="text-xs text-yellow-600 mt-3">
                  Delivery data will appear here once the backend endpoint is implemented.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Not Delivered
            </button>
            <button
              onClick={() => setStatusFilter('delivered')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'delivered'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Delivered
            </button>
            <button
              onClick={() => setStatusFilter('cancel')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'cancel'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancelled
            </button>
          </div>
        </div>

        {/* Delivery Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading deliveries...</p>
              </div>
            </div>
          ) : filteredDeliveries.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No deliveries found</p>
                <p className="text-sm text-gray-500 mt-1">
                  {error ? (
                    <span>
                      Backend endpoint <code className="bg-gray-100 px-1 rounded text-xs">/api/staff/viewOrdersByStaffId</code> not available yet
                    </span>
                  ) : (
                    'No orders match the selected filter'
                  )}
                </p>
                {error && (
                  <p className="text-xs text-gray-400 mt-2">
                    Please check the error message above for backend implementation details
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Date
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
                  {filteredDeliveries.map((delivery, index) => {
                    const orderId = delivery.orderId || delivery.order_id || delivery.OrderId || `ORDER-${index}`;
                    const customerName = delivery.customerName || `Customer ${delivery.customerId || 'N/A'}`;
                    const vehicleName = delivery.vehicleName || `Model ${delivery.modelId || 'N/A'}`;
                    const orderDate = delivery.orderDate || delivery.order_date || delivery.OrderDate || null;
                    
                    return (
                      <tr key={orderId} className="hover:bg-blue-50 transition-colors cursor-pointer" onClick={() => handleViewDetails(delivery)}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">#{orderId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{customerName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-blue-600">{vehicleName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(orderDate)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(delivery.deliveryStatus || 'Not Delivered')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(delivery);
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Details Modal */}
        {isDetailsModalOpen && selectedDelivery && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-6 border-b border-purple-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Delivery Details</h2>
                    <p className="text-purple-100 text-sm mt-1">
                      Order #{selectedDelivery.orderId}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition-all duration-200"
                  >
                    <span className="text-2xl">&times;</span>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
                {/* Order Information */}
                <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center space-x-2">
                    <Package className="w-5 h-5 text-purple-600" />
                    <span>Order Information</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Order ID</label>
                      <div className="text-base font-semibold text-gray-900 mt-1">
                        #{selectedDelivery.orderId}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Order Date</label>
                      <div className="text-base font-semibold text-gray-900 mt-1">
                        {formatDate(selectedDelivery.orderDate)}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Customer Name</label>
                      <div className="text-base font-semibold text-gray-900 mt-1">
                        {selectedDelivery.customerName || `Customer ${selectedDelivery.customerId || 'N/A'}`}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        ID: {selectedDelivery.customerId || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Vehicle Name</label>
                      <div className="text-base font-semibold text-blue-600 mt-1">
                        {selectedDelivery.vehicleName || `Model ${selectedDelivery.modelId || 'N/A'}`}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Model ID: {selectedDelivery.modelId || 'N/A'}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
                      <div className="mt-1">
                        {getStatusBadge(selectedDelivery.deliveryStatus)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Update Actions */}
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center space-x-2">
                    <Truck className="w-5 h-5 text-purple-600" />
                    <span>Update Delivery Status</span>
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Delivery status follows Order status. Update the order status to change delivery status.
                  </p>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {(() => {
                      const currentStatus = selectedDelivery.status || selectedDelivery.Status || 'Pending';
                      const orderId = selectedDelivery.orderId || selectedDelivery.order_id || selectedDelivery.OrderId;
                      
                      return (
                        <>
                          {currentStatus !== 'Pending' && currentStatus !== 'pending' && (
                            <button
                              onClick={() => handleUpdateStatus(orderId, 'Pending')}
                              disabled={updatingStatus || !orderId}
                              className="flex items-center justify-center space-x-2 px-4 py-3 bg-yellow-50 hover:bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {updatingStatus ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Updating...</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-4 h-4" />
                                  <span>Mark as Pending (Not Delivered)</span>
                                </>
                              )}
                            </button>
                          )}
                          
                          {currentStatus !== 'Delivered' && currentStatus !== 'delivered' && (
                            <button
                              onClick={() => handleUpdateStatus(orderId, 'Delivered')}
                              disabled={updatingStatus || !orderId}
                              className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-50 hover:bg-green-100 border border-green-300 text-green-800 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {updatingStatus ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Updating...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Mark as Delivered</span>
                                </>
                              )}
                            </button>
                          )}
                          
                          {currentStatus !== 'Cancel' && currentStatus !== 'cancel' && currentStatus !== 'Cancelled' && currentStatus !== 'cancelled' && (
                            <button
                              onClick={() => {
                                if (window.confirm('Are you sure you want to cancel this order? This action cannot be easily undone.')) {
                                  handleUpdateStatus(orderId, 'Cancel');
                                }
                              }}
                              disabled={updatingStatus || !orderId}
                              className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 hover:bg-red-100 border border-red-300 text-red-800 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {updatingStatus ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Updating...</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4" />
                                  <span>Cancel Order</span>
                                </>
                              )}
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-3">
                    Current status: <strong>{selectedDelivery.status || selectedDelivery.Status || 'Pending'}</strong>
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  disabled={updatingStatus}
                  className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Delivery;

