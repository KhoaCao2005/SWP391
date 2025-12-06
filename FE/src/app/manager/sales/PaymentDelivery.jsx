import React, { useState } from 'react';
import Layout from '../layout/Layout';
import { CreditCard, Package, Search, CheckCircle, X } from 'lucide-react';

const PaymentDelivery = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Payment & Delivery records - to be fetched from API
  const [records, setRecords] = useState([]);

  // Filter records
  const filteredRecords = records.filter(r => {
    const matchesStatus = statusFilter === 'all' || r.overallStatus.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch = searchQuery === '' || r.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      'Paid': { color: 'bg-green-100 text-green-800', icon: '✅' },
      'Pending': { color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
      'Delivered': { color: 'bg-blue-100 text-blue-800', icon: '📦' },
      'Completed': { color: 'bg-purple-100 text-purple-800', icon: '✔️' },
      'Partial': { color: 'bg-orange-100 text-orange-800', icon: '💳' },
      'Scheduled': { color: 'bg-blue-100 text-blue-800', icon: '📅' },
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
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Handle row click
  const handleRowClick = (record) => {
    setSelectedRecord(record);
    setIsDetailsModalOpen(true);
  };

  // Handle mark as paid
  const handleMarkAsPaid = (record) => {
    if (window.confirm(`Mark payment ${record.id} as Paid?`)) {
      console.log('Marking payment as paid:', record.id);
      alert(`✅ Payment ${record.id} marked as Paid successfully!`);
      setIsDetailsModalOpen(false);
    }
  };

  // Handle mark as delivered
  const handleMarkAsDelivered = (record) => {
    if (window.confirm(`Mark delivery ${record.id} as Delivered?`)) {
      console.log('Marking delivery as delivered:', record.id);
      alert(`✅ Delivery ${record.id} marked as Delivered successfully!`);
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
                <span>Payment & Delivery Management</span>
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Monitor and manage payment and delivery status for all contracts
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="delivered">Delivered</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Records Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contract ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivery Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr 
                    key={record.id} 
                    onClick={() => handleRowClick(record)}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{record.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{record.contractId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.customer}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.vehicle}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(record.paymentStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(record.deliveryStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(record.totalAmount)}
                      </div>
                      {record.paymentStatus === 'Partial' && (
                        <div className="text-xs text-orange-600">
                          Paid: {formatCurrency(record.paidAmount)}
                        </div>
                      )}
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
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white p-6 border-b border-green-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Payment & Delivery Details</h2>
                    <p className="text-green-100 text-sm mt-1">
                      {selectedRecord.id} • {selectedRecord.contractId}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition-all duration-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Section - Payment Information */}
                  <div className="space-y-6">
                    {/* Customer Info */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Customer Information</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Name:</span>
                          <span className="text-sm font-semibold text-gray-900">{selectedRecord.customer}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">ID:</span>
                          <span className="text-sm font-mono text-gray-700">{selectedRecord.customerId}</span>
                        </div>
                      </div>
                    </div>

                    {/* Vehicle Information */}
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Vehicle Information</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Model:</span>
                          <span className="text-sm font-semibold text-gray-900">{selectedRecord.vehicle}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">VIN:</span>
                          <span className="text-sm font-mono text-gray-700">{selectedRecord.vin}</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Information */}
                    <div className="bg-green-50 rounded-lg p-5 border-2 border-green-200">
                      <h3 className="font-bold text-gray-900 mb-4 flex items-center space-x-2">
                        <CreditCard className="w-5 h-5 text-green-600" />
                        <span>Payment Information</span>
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-600">Method:</span>
                          <span className="text-sm font-semibold text-gray-900">{selectedRecord.paymentMethod}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-600">Total:</span>
                          <span className="text-sm font-bold text-green-600">{formatCurrency(selectedRecord.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-600">Amount Paid:</span>
                          <span className="text-sm font-bold text-blue-600">{formatCurrency(selectedRecord.paidAmount)}</span>
                        </div>
                        {selectedRecord.paymentStatus === 'Partial' && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-600">Remaining:</span>
                            <span className="text-sm font-bold text-red-600">
                              {formatCurrency(selectedRecord.remainingAmount)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t border-green-300">
                          <span className="text-sm font-medium text-gray-600">Status:</span>
                          <span>{getStatusBadge(selectedRecord.paymentStatus)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Schedule (for Installments) */}
                    {selectedRecord.paymentSchedule && (
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <h3 className="text-sm font-bold text-gray-700 uppercase px-4 py-3 bg-gray-50 border-b border-gray-200">
                          Payment Schedule
                        </h3>
                        <div className="divide-y divide-gray-200">
                          {selectedRecord.paymentSchedule.map((schedule, idx) => (
                            <div key={idx} className="px-4 py-3">
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="text-sm font-semibold text-gray-900">Installment {schedule.installment}</div>
                                  <div className="text-xs text-gray-600">
                                    Due: {new Date(schedule.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-semibold text-gray-900">{formatCurrency(schedule.amount)}</div>
                                  <div className={`text-xs font-semibold px-2 py-1 rounded-full mt-1 ${
                                    schedule.status === 'Paid' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {schedule.status}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Payment Details */}
                    {selectedRecord.paymentDate && (
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <h3 className="text-sm font-bold text-gray-700 uppercase">Payment Details</h3>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Payment Date:</span>
                          <span className="text-sm font-semibold text-green-900">
                            {new Date(selectedRecord.paymentDate).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        {selectedRecord.paymentReference && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Reference:</span>
                            <span className="text-sm font-mono text-gray-700">{selectedRecord.paymentReference}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Section - Delivery Information */}
                  <div className="space-y-6">
                    {/* Delivery Information */}
                    <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                      <h3 className="text-sm font-bold text-gray-700 uppercase">Delivery Information</h3>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Scheduled Date:</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {new Date(selectedRecord.deliveryDate).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      {selectedRecord.actualDeliveryDate && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Actual Delivery:</span>
                          <span className="text-sm font-semibold text-green-900">
                            {new Date(selectedRecord.actualDeliveryDate).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Delivery Address:</span>
                        <span className="text-sm text-gray-900 text-right">{selectedRecord.address}</span>
                      </div>
                    </div>

                    {/* Delivery Staff */}
                    <div className="bg-purple-50 rounded-lg p-4 space-y-2">
                      <h3 className="text-sm font-bold text-gray-700 uppercase">Delivery Staff</h3>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Staff Name:</span>
                        <span className="text-sm font-semibold text-gray-900">{selectedRecord.deliveryStaff}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Phone:</span>
                        <span className="text-sm text-gray-900">{selectedRecord.staffPhone}</span>
                      </div>
                    </div>

                    {/* Pre-Delivery Checklist */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                      <h3 className="text-sm font-bold text-gray-700 uppercase">Pre-Delivery Checklist</h3>
                      {selectedRecord.preCheckList.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                          <span className="text-sm text-gray-700">{item.item}</span>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            item.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.status === 'completed' ? '✓ Completed' : '⏳ Pending'}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Delivery Notes */}
                    {selectedRecord.deliveryNotes && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h3 className="text-sm font-bold text-gray-700 uppercase mb-2">Delivery Notes</h3>
                        <p className="text-sm text-gray-700">{selectedRecord.deliveryNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer - Action Buttons */}
              <div className="border-t border-gray-200 p-6 bg-gray-50">
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  {selectedRecord.paymentStatus === 'Pending' && (
                    <button
                      onClick={() => handleMarkAsPaid(selectedRecord)}
                      className="px-6 py-2 text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <CheckCircle className="w-4 h-4 inline mr-2" />
                      Mark as Paid
                    </button>
                  )}
                  {selectedRecord.deliveryStatus === 'Scheduled' && (
                    <button
                      onClick={() => handleMarkAsDelivered(selectedRecord)}
                      className="px-6 py-2 text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <Package className="w-4 h-4 inline mr-2" />
                      Mark as Delivered
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PaymentDelivery;
