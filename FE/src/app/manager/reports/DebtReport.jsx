import React, { useEffect, useState } from 'react';
import Layout from '../layout/Layout';
import {
  DollarSign,
  Search,
  Filter,
  X,
  ChevronRight,
  Calendar,
  AlertTriangle,
  Download,
  Flag,
  Users,
  CheckCircle,
  Clock,
  FileText
} from 'lucide-react';

const DebtReport = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('all');
  const [agingFilter, setAgingFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState('all');
  const [selectedContract, setSelectedContract] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Debt data from BE
  const [debtData, setDebtData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      const { fetchCustomerDebtSummary } = await import('../services/reportsService');
      const res = await fetchCustomerDebtSummary();
      if (res.success) {
        setDebtData(res.data || []);
      } else {
        setDebtData([]);
        setError(res.message || 'Failed to load debts');
      }
      setLoading(false);
    };
    load();
  }, []);

  // Get unique staff list
  const staffList = [...new Set(debtData.map(d => d.assignedStaff))];

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

  const getAgingBadge = (aging) => {
    const configs = {
      'Paid Off': { color: 'bg-green-100 text-green-800 border-green-200', label: 'Paid Off' },
      '< 30 days': { color: 'bg-blue-100 text-blue-800 border-blue-200', label: '< 30 days' },
      '30-60 days': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: '30-60 days' },
      '60-90 days': { color: 'bg-orange-100 text-orange-800 border-orange-200', label: '60-90 days' },
      '90+ days': { color: 'bg-red-100 text-red-800 border-red-200', label: '90+ days' }
    };
    const config = configs[aging] || configs['< 30 days'];

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getPaymentTypeLabel = (type, months) => {
    if (type === 'Full Payment') return 'Full Payment';
    return `Installment ${months} mo`;
  };

  // Filter debt data
  const filteredDebtData = debtData.filter(debt => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matches = 
        debt.customerName.toLowerCase().includes(query) ||
        debt.contractId.toLowerCase().includes(query);
      if (!matches) return false;
    }

    // Payment type filter
    if (paymentTypeFilter !== 'all') {
      if (paymentTypeFilter === 'Full' && debt.paymentType !== 'Full Payment') return false;
      if (paymentTypeFilter === 'Installment' && debt.paymentType === 'Full Payment') return false;
    }

    // Aging filter
    if (agingFilter !== 'all') {
      if (agingFilter === 'paid-off' && debt.aging !== 'Paid Off') return false;
      if (agingFilter === 'lt30' && debt.aging !== '< 30 days') return false;
      if (agingFilter === '30-60' && debt.aging !== '30-60 days') return false;
      if (agingFilter === '60-90' && debt.aging !== '60-90 days') return false;
      if (agingFilter === '90plus' && debt.aging !== '90+ days') return false;
    }

    // Staff filter
    if (staffFilter !== 'all' && debt.assignedStaff !== staffFilter) return false;

    return true;
  });

  // Calculate next due date
  const getNextDueDate = (installments) => {
    const pending = installments.find(i => i.status === 'Pending');
    return pending ? pending.dueDate : null;
  };

  // Handle view detail
  const handleViewDetail = (contract) => {
    setSelectedContract(contract);
    setIsDetailModalOpen(true);
  };

  // Handle export CSV (optional)
  const handleExportCSV = () => {
    // In real app, would generate CSV
    alert('CSV export functionality coming soon!');
  };

  // Handle export PDF (optional)
  const handleExportPDF = () => {
    // In real app, would generate PDF
    alert('PDF export functionality coming soon!');
  };

  // Handle flag customer
  const handleFlagCustomer = () => {
    if (window.confirm(`Flag customer "${selectedContract.customerName}" as at-risk? This will notify assigned staff to follow up.`)) {
      // In real app, would make API call
      console.log('Flagging customer:', selectedContract.customerId);
      alert('Customer flagged successfully! Staff will be notified.');
    }
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
          <span className="text-gray-900 font-medium">Debt Report</span>
        </div>

        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Debt Report</h1>
            <p className="text-sm text-gray-600 mt-1">Overview of customer debts, payments, and overdue status</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
              <span className="text-xs text-gray-500">({filteredDebtData.length} results)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Customer name / Contract ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Payment Type */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Payment Type</label>
              <select
                value={paymentTypeFilter}
                onChange={(e) => setPaymentTypeFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Both</option>
                <option value="Full">Full Payment</option>
                <option value="Installment">Installment</option>
              </select>
            </div>

            {/* Aging Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Aging</label>
              <select
                value={agingFilter}
                onChange={(e) => setAgingFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="paid-off">Paid Off</option>
                <option value="lt30">&lt; 30 days</option>
                <option value="30-60">30-60 days</option>
                <option value="60-90">60-90 days</option>
                <option value="90plus">90+ days</option>
              </select>
            </div>

            {/* Staff Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Assigned Staff</label>
              <select
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All</option>
                {staffList.map(staff => (
                  <option key={staff} value={staff}>{staff}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {error && <div className="p-3 text-sm text-red-700 bg-red-50 border-b border-red-200">{error}</div>}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Paid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Outstanding
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDebtData.map((debt) => (
                  <tr 
                    key={debt.customerName} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleViewDetail(debt)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{debt.customerName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(debt.totalAmount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-green-600 font-medium">
                        {formatCurrency(debt.paid)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-red-600 font-medium">
                        {formatCurrency(debt.outstanding)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {isDetailModalOpen && selectedContract && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Contract Debt Detail</h2>
                  <p className="text-sm text-gray-600 mt-1">Contract ID: {selectedContract.contractId}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleExportCSV}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Export CSV"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleFlagCustomer}
                    className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors flex items-center space-x-1"
                    title="Flag Customer"
                  >
                    <Flag className="w-5 h-5" />
                    <span className="text-sm">Flag</span>
                  </button>
                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                <div>
                  <label className="text-xs text-gray-600">Customer</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedContract.customerName}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-600">Staff Assigned</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedContract.assignedStaff}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-600">Contract ID</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedContract.contractId}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-600">Payment Plan Type</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {getPaymentTypeLabel(selectedContract.paymentType, selectedContract.installmentMonths)}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-600">Start Date</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{formatDate(selectedContract.startDate)}</p>
                </div>
              </div>

              {/* Installment Schedule */}
              {selectedContract.installments.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Repayment Schedule
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Installment #</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Due Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Amount</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedContract.installments.map((installment) => (
                          <tr key={installment.number}>
                            <td className="px-4 py-3 text-sm text-gray-700">{installment.number}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{formatDate(installment.dueDate)}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {formatCurrency(installment.amount)}
                            </td>
                            <td className="px-4 py-3">
                              {installment.status === 'Paid' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Paid
                                </span>
                              )}
                              {installment.status === 'Paid Late' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Paid Late
                                </span>
                              )}
                              {installment.status === 'Overdue' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Overdue
                                </span>
                              )}
                              {installment.status === 'Pending' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Pending
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs text-gray-600">Total Amount</label>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {formatCurrency(selectedContract.totalAmount)}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Paid</label>
                    <p className="text-sm font-semibold text-green-600 mt-1">
                      {formatCurrency(selectedContract.paid)}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Outstanding Remaining</label>
                    <p className="text-sm font-semibold text-red-600 mt-1">
                      {formatCurrency(selectedContract.outstanding)}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Next Due Date</label>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {formatDate(getNextDueDate(selectedContract.installments))}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex items-center justify-end">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default DebtReport;
