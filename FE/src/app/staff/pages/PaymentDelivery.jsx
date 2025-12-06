import React, { useState } from 'react';
import Layout from '../layout/Layout';
import { CreditCard, Package, CheckCircle, Plus, FileText } from 'lucide-react';

const PaymentDelivery = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Sample payment & delivery data
  const records = [
    {
      orderId: 'ORD-2025-003',
      orderFormId: 'OF-2025-003',
      customer: 'Nguyen Van An',
      vehicle: 'Model 3 Performance AWD',
      amount: 1250000000,
      // Payment Info
      paymentMethod: 'Full Payment',
      amountPaid: 0,
      paymentStatus: 'Pending',
      paymentNotes: 'Awaiting customer payment',
      // Delivery Info
      warehouse: 'Warehouse A',
      driver: 'Tran Van Hung',
      estimatedDelivery: '2025-10-28',
      deliveryStatus: 'Awaiting',
      deliveryNotes: 'Vehicle prepared for delivery',
      overallStatus: 'Pending',
    },
    {
      orderId: 'ORD-2025-004',
      orderFormId: 'OF-2025-004',
      customer: 'Pham Thu Ha',
      vehicle: 'Model 3 Premium AWD',
      amount: 1020000000,
      // Payment Info
      paymentMethod: 'Full Payment',
      amountPaid: 1020000000,
      paymentStatus: 'Paid',
      paymentNotes: 'Full payment received',
      // Delivery Info
      warehouse: 'Warehouse B',
      driver: 'Le Van Thanh',
      estimatedDelivery: '2025-10-27',
      deliveryStatus: 'Delivered',
      deliveryNotes: 'Successfully delivered on October 27, 2025',
      overallStatus: 'Completed',
    },
  ];

  // Filter records
  const filteredRecords = records.filter(r => {
    if (statusFilter === 'all') return true;
    return r.overallStatus.toLowerCase() === statusFilter.toLowerCase();
  });

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      'Pending': { color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
      'Paid': { color: 'bg-blue-100 text-blue-800', icon: '💳' },
      'Delivered': { color: 'bg-purple-100 text-purple-800', icon: '📦' },
      'Completed': { color: 'bg-green-100 text-green-800', icon: '✅' },
      'Partial': { color: 'bg-orange-100 text-orange-800', icon: '⚠️' },
      'In Transit': { color: 'bg-indigo-100 text-indigo-800', icon: '🚚' },
      'Awaiting': { color: 'bg-gray-100 text-gray-800', icon: '⏸️' },
    };
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: '❓' };
    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        <span>{config.icon}</span>
        <span>{status}</span>
      </span>
    );
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
  };

  // Handle view details
  const handleViewDetails = (record) => {
    setSelectedRecord(record);
    setIsDetailsModalOpen(true);
  };

  // Handle mark as paid
  const handleMarkAsPaid = (record) => {
    const totalAmount = formatCurrency(record.amount);
    if (window.confirm(`Confirm payment received in full (${totalAmount})?`)) {
      console.log('Marking as paid:', record.orderId);
      alert(`✅ Payment confirmed successfully.\n\nOrder ${record.orderId} marked as Paid.`);
      setIsDetailsModalOpen(false);
    }
  };

  // Handle mark as delivered
  const handleMarkAsDelivered = (orderId) => {
    console.log('Marking as delivered:', orderId);
    alert(`🚚 Delivery confirmed. Order ${orderId} marked as Delivered.`);
    setIsDetailsModalOpen(false);
  };

  // Handle complete order
  const handleCompleteOrder = (orderId) => {
    if (window.confirm(`Complete order ${orderId}? This will finalize the sale.`)) {
      console.log('Completing order:', orderId);
      alert(`✅ Order ${orderId} Completed successfully!`);
      setIsDetailsModalOpen(false);
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
                <CreditCard className="w-7 h-7" />
                <span>Payment & Delivery</span>
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Monitor payment and delivery status for all contracts
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
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('paid')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'paid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Paid
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

        {/* Payment & Delivery Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivery
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record.orderId} onClick={() => handleViewDetails(record)} className="hover:bg-blue-50 cursor-pointer transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{record.orderId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.customer}</div>
                      <div className="text-xs text-gray-500">{record.vehicle}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(record.amount)}
                      </div>
                      {record.paymentStatus === 'Partial' && (
                        <div className="text-xs text-orange-600">
                          Paid: {formatCurrency(record.amountPaid)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(record.paymentStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(record.deliveryStatus)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Details Modal */}
        {isDetailsModalOpen && selectedRecord && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white p-6 border-b border-green-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Payment & Delivery Details</h2>
                    <p className="text-green-100 text-sm mt-1">
                      Order {selectedRecord.orderId} • {selectedRecord.orderFormId}
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

              {/* Modal Content - Two Column Layout */}
              <div className="flex flex-col lg:flex-row max-h-[calc(90vh-200px)] overflow-hidden">
                {/* Left Section - Details (50%) */}
                <div className="flex-1 p-6 overflow-y-auto space-y-6 border-r border-gray-200">
                {/* Customer Info */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Customer</label>
                      <div className="text-base font-semibold text-gray-900 mt-1">
                        {selectedRecord.customer}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Vehicle</label>
                      <div className="text-base font-semibold text-gray-900 mt-1">
                        {selectedRecord.vehicle}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="bg-blue-50 rounded-lg p-5 border-2 border-blue-200">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center space-x-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <span>Payment Information</span>
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Method:</span>
                      <span className="text-sm font-semibold text-gray-900">{selectedRecord.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Total:</span>
                      <span className="text-sm font-bold text-blue-600">{formatCurrency(selectedRecord.amount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Amount Paid:</span>
                      <span className="text-sm font-bold text-green-600">{formatCurrency(selectedRecord.amountPaid)}</span>
                    </div>
                    {selectedRecord.paymentStatus === 'Partial' && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Remaining:</span>
                        <span className="text-sm font-bold text-red-600">
                          {formatCurrency(selectedRecord.amount - selectedRecord.amountPaid)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-blue-300">
                      <span className="text-sm font-medium text-gray-600">Status:</span>
                      <span>{getStatusBadge(selectedRecord.paymentStatus)}</span>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-gray-600 bg-white/50 p-2 rounded">
                    💡 {selectedRecord.paymentNotes}
                  </div>
                </div>

                {/* Delivery Info */}
                <div className="bg-purple-50 rounded-lg p-5 border-2 border-purple-200">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center space-x-2">
                    <Package className="w-5 h-5 text-purple-600" />
                    <span>Delivery Information</span>
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Warehouse:</span>
                      <span className="text-sm font-semibold text-gray-900">{selectedRecord.warehouse}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Driver:</span>
                      <span className="text-sm font-semibold text-gray-900">{selectedRecord.driver}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Estimated:</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {new Date(selectedRecord.estimatedDelivery).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-purple-300">
                      <span className="text-sm font-medium text-gray-600">Status:</span>
                      <span>{getStatusBadge(selectedRecord.deliveryStatus)}</span>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-gray-600 bg-white/50 p-2 rounded">
                    📦 {selectedRecord.deliveryNotes}
                  </div>
                </div>
                </div>

                {/* Right Section - Actions (50%) */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4 border-l border-gray-100">
                  {/* Current Status Display */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                    <div className="text-xs text-gray-600 uppercase tracking-wide mb-2">Progress</div>
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {selectedRecord.overallStatus}
                    </div>
                    <div className="text-xs text-gray-500">
                      {selectedRecord.paymentMethod}
                    </div>
                  </div>

                  {/* Payment Actions */}
                  {selectedRecord.paymentStatus !== 'Paid' && (
                    <div className="space-y-2">
                      {selectedRecord.paymentMethod === 'Full Payment' && (
                        <button
                          onClick={() => handleMarkAsPaid(selectedRecord)}
                          className="w-full flex items-center justify-between px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 group"
                        >
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <div className="text-left">
                              <div className="font-semibold">Confirm Payment</div>
                              <div className="text-xs text-green-100">Mark as Paid</div>
                            </div>
                          </div>
                          <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                        </button>
                      )}
                      {selectedRecord.paymentMethod === 'Installment' && (
                        <button className="w-full flex items-center justify-between px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all duration-200 group">
                          <div className="flex items-center space-x-3">
                            <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <div className="text-left">
                              <div className="font-semibold">Add Installment</div>
                              <div className="text-xs text-orange-100">Record Payment</div>
                            </div>
                          </div>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Delivery Actions */}
                  {selectedRecord.deliveryStatus !== 'Delivered' && selectedRecord.paymentStatus === 'Paid' && (
                    <div className="space-y-2">
                      <button
                        onClick={() => handleMarkAsDelivered(selectedRecord.orderId)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200 group"
                      >
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          <div className="text-left">
                            <div className="font-semibold">Confirm Delivery</div>
                            <div className="text-xs text-purple-100">Mark as Delivered</div>
                          </div>
                        </div>
                        <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                      </button>
                    </div>
                  )}

                  {/* Additional Actions */}
                  <div className="space-y-2 pt-2 border-t border-gray-200">
                    <button className="w-full flex items-center justify-between px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 hover:border-gray-400 rounded-lg transition-all duration-200 group">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-4 h-4 text-gray-500 group-hover:text-blue-600 transition-colors" />
                        <span className="text-sm font-medium">View Payment Log</span>
                      </div>
                    </button>
                    
                    <button className="w-full flex items-center justify-between px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 hover:border-gray-400 rounded-lg transition-all duration-200 group">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-4 h-4 text-gray-500 group-hover:text-purple-600 transition-colors" />
                        <span className="text-sm font-medium">Add Note</span>
                      </div>
                    </button>
                  </div>

                  {/* Complete Order Action */}
                  {selectedRecord.paymentStatus === 'Paid' && selectedRecord.deliveryStatus === 'Delivered' && (
                    <div className="pt-2 border-t border-gray-200">
                      <button
                        onClick={() => handleCompleteOrder(selectedRecord.orderId)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all duration-200 group"
                      >
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          <div className="text-left">
                            <div className="font-semibold">Complete Order</div>
                            <div className="text-xs text-green-100">Finalize Sale</div>
                          </div>
                        </div>
                        <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 border-t border-gray-200 p-4 flex items-center justify-end">
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
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

export default PaymentDelivery;

