import React, { useState } from 'react';
import Layout from '../layout/Layout';
import { ScrollText, Search, CheckCircle, X } from 'lucide-react';

const Contracts = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContract, setSelectedContract] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Contracts data - to be fetched from API
  const [contracts, setContracts] = useState([]);

  // Filter contracts
  const filteredContracts = contracts.filter(c => {
    const matchesStatus = statusFilter === 'all' || c.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesPaymentType = paymentTypeFilter === 'all' || c.paymentMethod === paymentTypeFilter;
    const matchesSearch = searchQuery === '' || c.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesPaymentType && matchesSearch;
  });

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      'Pending': { color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
      'Approved': { color: 'bg-green-100 text-green-800', icon: '✅' },
      'Rejected': { color: 'bg-red-100 text-red-800', icon: '❌' },
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
  const handleRowClick = (contract) => {
    setSelectedContract(contract);
    setIsPanelOpen(true);
  };

  // Handle approve
  const handleApprove = (contract) => {
    if (window.confirm(`Approve contract ${contract.id}?\n\nThis will enable the "Delivery Creation Stage".`)) {
      console.log('Approving contract:', contract.id);
      alert(`✅ Contract ${contract.id} approved successfully!`);
      setIsPanelOpen(false);
      // In real app: update contract status
    }
  };

  // Handle reject
  const handleReject = (contract) => {
    const reason = window.prompt(`Enter rejection reason for ${contract.id}:`);
    if (reason) {
      console.log('Rejecting contract:', contract.id, 'Reason:', reason);
      alert(`❌ Contract ${contract.id} rejected.`);
      setIsPanelOpen(false);
      // In real app: update contract status
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
                <ScrollText className="w-7 h-7" />
                <span>Contracts Management</span>
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Review and approve sales contracts
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Contract ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Payment Type Filter */}
            <select
              value={paymentTypeFilter}
              onChange={(e) => setPaymentTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Payment Types</option>
              <option value="Full Payment">Full Payment</option>
              <option value="Installment">Installment</option>
            </select>

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
                <option value="approved">Approved</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div>
          {/* Contracts Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contract ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quotation ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Salesperson
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredContracts.map((contract) => (
                    <tr 
                      key={contract.id} 
                      onClick={() => handleRowClick(contract)}
                      className="hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{contract.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{contract.quotationId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{contract.salesperson}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{contract.customer}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(contract.totalPrice)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{contract.paymentMethod}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(contract.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        {/* Details Modal */}
        {isPanelOpen && selectedContract && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-6 border-b border-purple-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Contract Details</h2>
                    <p className="text-purple-100 text-sm mt-1">
                      {selectedContract.id} • {selectedContract.quotationId}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsPanelOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition-all duration-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                {/* Status Badge */}
                <div className="flex justify-start">
                  {getStatusBadge(selectedContract.status)}
                </div>

                {/* Contract Information */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-700 uppercase">Contract Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Contract ID:</span>
                      <span className="text-sm font-bold text-gray-900">{selectedContract.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Salesperson:</span>
                      <span className="text-sm font-semibold text-gray-900">{selectedContract.salesperson}</span>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-700 uppercase">Customer Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Name:</span>
                      <span className="text-sm font-semibold text-gray-900">{selectedContract.customer}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Customer ID:</span>
                      <span className="text-sm font-mono text-gray-700">{selectedContract.customerId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Phone:</span>
                      <span className="text-sm text-gray-900">{selectedContract.customerPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Email:</span>
                      <span className="text-sm text-gray-900">{selectedContract.customerEmail}</span>
                    </div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-700 uppercase">Vehicle Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Model:</span>
                      <span className="text-sm font-semibold text-gray-900">{selectedContract.vehicle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">VIN:</span>
                      <span className="text-sm font-mono text-gray-700">{selectedContract.vin}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-700 uppercase">Payment Information</h3>
                  <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Price:</span>
                      <span className="text-xl font-bold text-blue-600">
                        {formatCurrency(selectedContract.totalPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Payment Method:</span>
                      <span className="text-sm font-semibold text-gray-900">{selectedContract.paymentMethod}</span>
                    </div>
                  </div>

                  {selectedContract.paymentMethod === 'Installment' && selectedContract.installmentPlan && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 space-y-2">
                      <h4 className="text-xs font-bold text-gray-700 uppercase mb-2">Installment Plan</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Deposit Amount:</span>
                          <span className="font-semibold text-green-700">{formatCurrency(selectedContract.deposit)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Bank:</span>
                          <span className="font-semibold text-gray-900">{selectedContract.installmentPlan.bankName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Term:</span>
                          <span className="font-semibold text-gray-900">{selectedContract.installmentPlan.term} months</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Interest Rate:</span>
                          <span className="font-semibold text-gray-900">{selectedContract.installmentPlan.interestRate}% p.a.</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-green-200">
                          <span className="text-gray-700 font-semibold">Monthly Payment:</span>
                          <span className="font-bold text-green-700">{formatCurrency(selectedContract.installmentPlan.monthly)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Interest:</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(selectedContract.installmentPlan.totalInterest)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedContract.paymentMethod === 'Full Payment' && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                      <div className="text-sm font-semibold text-green-900">Full Payment Required</div>
                      <div className="text-xs text-gray-600 mt-1">Payment due before delivery</div>
                    </div>
                  )}
                </div>

                {/* Terms & Conditions */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-700 uppercase">Terms & Conditions</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="text-sm text-gray-700 whitespace-pre-line">{selectedContract.termsConditions}</div>
                  </div>
                </div>

                {/* Rejection Reason */}
                {selectedContract.rejectionReason && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-red-700 uppercase">Rejection Reason</h3>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-900">{selectedContract.rejectionReason}</p>
                    </div>
                  </div>
                )}

                </div>
              </div>

              {/* Modal Footer - Action Buttons */}
              {selectedContract.status === 'Pending' && (
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  <div className="flex items-center justify-end space-x-3">
                    <button
                      onClick={() => setIsPanelOpen(false)}
                      className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleReject(selectedContract)}
                      className="px-6 py-2 text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <X className="w-4 h-4 inline mr-2" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(selectedContract)}
                      className="px-6 py-2 text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <CheckCircle className="w-4 h-4 inline mr-2" />
                      Approve
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </div>
    </Layout>
  );
};

export default Contracts;

