import React, { useState } from 'react';
import Layout from '../layout/Layout';
import { ShoppingCart, Search, CheckCircle, Package, CreditCard, Truck } from 'lucide-react';
import { useNavigate } from 'react-router';

const Orders = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Sample orders data
  const ordersData = [
    {
      id: 'ORD-2025-001',
      orderFormId: 'OF-2025-001',
      customer: 'Le Minh Tuan',
      customerId: 'C-001',
      vehicle: 'Model 3 Standard RWD',
      vin: '5YJ3E1EA0001',
      amount: 920000000,
      paymentMethod: 'Full Payment',
      status: 'Pending Confirmation',
      orderDate: '2025-10-22',
      estimatedDelivery: '2025-10-29',
      salesperson: 'Nguyen Van Hung',
      notes: 'Customer wants white color, ready for confirmation'
    },
    {
      id: 'ORD-2025-002',
      orderFormId: 'OF-2025-002',
      customer: 'Tran Hoa',
      customerId: 'C-002',
      vehicle: 'Model Y Long Range',
      vin: 'Pending',
      amount: 1040000000,
      paymentMethod: 'Installment',
      status: 'Pending Confirmation',
      orderDate: '2025-10-23',
      estimatedDelivery: '2025-10-30',
      salesperson: 'Le Thi Mai',
      notes: 'Need to discuss financing options'
    },
    {
      id: 'ORD-2025-003',
      orderFormId: 'OF-2025-003',
      customer: 'Nguyen Van An',
      customerId: 'C-003',
      vehicle: 'Model 3 Performance AWD',
      vin: '5YJ3E3EA0003',
      amount: 1250000000,
      paymentMethod: 'Full Payment',
      status: 'Confirmed',
      orderDate: '2025-10-21',
      estimatedDelivery: '2025-10-28',
      salesperson: 'Pham Thi Lan',
      notes: 'VIP customer - priority delivery',
      confirmedDate: '2025-10-21'
    },
    {
      id: 'ORD-2025-004',
      orderFormId: 'OF-2025-004',
      customer: 'Pham Thu Ha',
      customerId: 'C-004',
      vehicle: 'Model 3 Premium AWD',
      vin: 'Pending',
      amount: 1020000000,
      paymentMethod: 'Full Payment',
      status: 'Completed',
      orderDate: '2025-10-20',
      estimatedDelivery: '2025-10-27',
      salesperson: 'Tran Van Minh',
      notes: 'Order completed, transferred to delivery',
      confirmedDate: '2025-10-20',
      completedDate: '2025-10-25'
    },
  ];

  // Filter orders
  const filteredOrders = ordersData.filter(o => {
    if (statusFilter === 'all') return true;
    return o.status.toLowerCase().replace(/\s+/g, '') === statusFilter.toLowerCase().replace(/\s+/g, '');
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Pending Confirmation': { color: 'bg-yellow-100 text-yellow-800', icon: '⏳', label: 'Pending Confirmation' },
      'Confirmed': { color: 'bg-blue-100 text-blue-800', icon: '✅', label: 'Confirmed' },
      'Completed': { color: 'bg-green-100 text-green-800', icon: '🎉', label: 'Completed' },
      'Cancelled': { color: 'bg-red-100 text-red-800', icon: '❌', label: 'Cancelled' }
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: '❓', label: status };
    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Handle view order
  const handleView = (order) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  };

  // Handle confirm order
  const handleConfirmOrder = (order) => {
    if (window.confirm(`Confirm order ${order.id}?\n\nThis will mark the order as "Confirmed" and prepare it for delivery.`)) {
      console.log('Confirming order:', order.id);
      alert(`✅ Order ${order.id} confirmed successfully!\n\nMoving to delivery stage...`);
      setIsViewModalOpen(false);
    }
  };

  // Handle complete order
  const handleCompleteOrder = (order) => {
    if (window.confirm(`Mark order ${order.id} as completed?\n\nThis will transfer it to the delivery module.`)) {
      console.log('Completing order:', order.id);
      alert(`✅ Order ${order.id} marked as completed!\n\nRedirecting to Payment & Delivery...`);
      setIsViewModalOpen(false);
      navigate('/staff/sales/payment-delivery', { state: { orderId: order.id } });
    }
  };

  // Handle cancel order
  const handleCancelOrder = (order) => {
    if (window.confirm(`Cancel order ${order.id}?\n\nThis will mark the order as cancelled.`)) {
      console.log('Cancelling order:', order.id);
      alert(`❌ Order ${order.id} cancelled.`);
      setIsViewModalOpen(false);
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
                <ShoppingCart className="w-7 h-7" />
                <span>Orders Management</span>
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Confirm and manage customer orders
              </p>
            </div>
          </div>
        </div>

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
              onClick={() => setStatusFilter('pendingconfirmation')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'pendingconfirmation'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending Confirmation
            </button>
            <button
              onClick={() => setStatusFilter('confirmed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'confirmed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Confirmed
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'completed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Form ID
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
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr 
                    key={order.id} 
                    onClick={() => handleView(order)}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{order.orderFormId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.customer}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.vehicle}</div>
                      <div className="text-xs text-gray-500 font-mono">{order.vin}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(order.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.paymentMethod}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(order.orderDate)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {ordersData.filter(o => o.status === 'Pending Confirmation').length}
                </p>
                <p className="text-sm text-gray-600">Pending Confirmation</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {ordersData.filter(o => o.status === 'Confirmed').length}
                </p>
                <p className="text-sm text-gray-600">Confirmed</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {ordersData.filter(o => o.status === 'Completed').length}
                </p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(ordersData.reduce((sum, o) => sum + o.amount, 0))}
                </p>
                <p className="text-sm text-gray-600">Total Value</p>
              </div>
            </div>
          </div>
        </div>

        {/* View Order Modal */}
        {isViewModalOpen && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 border-b border-purple-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Order Details</h2>
                    <p className="text-blue-100 text-sm mt-1">
                      {selectedOrder.id} • {selectedOrder.orderFormId}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsViewModalOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition-all duration-200"
                  >
                    <span className="text-2xl">&times;</span>
                  </button>
                </div>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Status Badge */}
                  <div className="flex justify-start">
                    {getStatusBadge(selectedOrder.status)}
                  </div>

                  {/* Order Information */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-700 uppercase">Order Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Order ID:</span>
                        <span className="text-sm font-bold text-gray-900">{selectedOrder.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Order Form ID:</span>
                        <span className="text-sm font-semibold text-blue-600">{selectedOrder.orderFormId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Salesperson:</span>
                        <span className="text-sm font-semibold text-gray-900">{selectedOrder.salesperson}</span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-700 uppercase">Customer Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Name:</span>
                        <span className="text-sm font-semibold text-gray-900">{selectedOrder.customer}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Customer ID:</span>
                        <span className="text-sm font-mono text-gray-700">{selectedOrder.customerId}</span>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Information */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-700 uppercase">Vehicle Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Model:</span>
                        <span className="text-sm font-semibold text-gray-900">{selectedOrder.vehicle}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">VIN:</span>
                        <span className="text-sm font-mono text-gray-700">{selectedOrder.vin}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-700 uppercase">Payment Information</h3>
                    <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Amount:</span>
                        <span className="text-xl font-bold text-blue-600">
                          {formatCurrency(selectedOrder.amount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Payment Method:</span>
                        <span className="text-sm font-semibold text-gray-900">{selectedOrder.paymentMethod}</span>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Information */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-700 uppercase">Delivery Information</h3>
                    <div className="bg-green-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Order Date:</span>
                        <span className="text-sm font-semibold text-gray-900">{formatDate(selectedOrder.orderDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Estimated Delivery:</span>
                        <span className="text-sm font-semibold text-green-600">{formatDate(selectedOrder.estimatedDelivery)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedOrder.notes && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-gray-700 uppercase">Notes</h3>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="text-sm text-gray-700">{selectedOrder.notes}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer - Action Buttons */}
              {selectedOrder.status === 'Pending Confirmation' && (
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  <div className="flex items-center justify-end space-x-3">
                    <button
                      onClick={() => setIsViewModalOpen(false)}
                      className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleCancelOrder(selectedOrder)}
                      className="px-6 py-2 text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      Cancel Order
                    </button>
                    <button
                      onClick={() => handleConfirmOrder(selectedOrder)}
                      className="px-6 py-2 text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <CheckCircle className="w-4 h-4 inline mr-2" />
                      Confirm Order
                    </button>
                  </div>
                </div>
              )}
              {selectedOrder.status === 'Confirmed' && (
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  <div className="flex items-center justify-end space-x-3">
                    <button
                      onClick={() => setIsViewModalOpen(false)}
                      className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => handleCompleteOrder(selectedOrder)}
                      className="px-6 py-2 text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center"
                    >
                      <Truck className="w-4 h-4 mr-2" />
                      Complete & Transfer to Delivery
                    </button>
                  </div>
                </div>
              )}
              {selectedOrder.status === 'Completed' && (
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  <div className="flex items-center justify-center">
                    <p className="text-green-700 font-semibold">✅ This order has been completed and transferred to delivery.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Orders;
