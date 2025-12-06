import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import Layout from '../layout/Layout';
import { 
  Users, 
  Search, 
  ChevronRight,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight as ChevronRightIcon
} from 'lucide-react';
import {
  getAllCustomersForManager,
  getOrdersByCustomerId,
  getAssignedStaffId
} from '../services/customerService';

const Customers = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Data states
  const [customersData, setCustomersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const customersPerPage = 10;

  // Load metrics for a batch of customers (loads all at once, no progressive loading)
  const loadMetricsForCustomers = useCallback(async (customers) => {
    const customerIds = customers.map(c => c.customerId).filter(id => id != null);
    
    console.log(`📊 Loading metrics for ${customerIds.length} customers...`);
    
    // Process in larger batches (10 at a time) for faster loading
    const batchSize = 10;
    for (let i = 0; i < customerIds.length; i += batchSize) {
      const batch = customerIds.slice(i, i + batchSize);
      
      // Load orders for this batch
      const promises = batch.map(async (customerId) => {
        try {
          const ordersResult = await getOrdersByCustomerId(customerId);
          
          const orders = ordersResult.success ? (ordersResult.data || []) : [];
          
          // Get most recent order's staff ID (who created the last order)
          const sortedOrders = [...orders].sort((a, b) => {
            const dateA = new Date(a.orderDate || a.order_date || 0);
            const dateB = new Date(b.orderDate || b.order_date || 0);
            return dateB - dateA;
          });
          const lastOrder = sortedOrders.length > 0 ? sortedOrders[0] : null;
          const lastOrderByStaffId = lastOrder 
            ? (lastOrder.dealerStaffId || lastOrder.dealer_staff_id || null)
            : null;
          
          // Get assigned staff ID
          const assignedStaffId = getAssignedStaffId(orders);
          
          return {
            customerId,
            assignedStaffId,
            lastOrderByStaffId
          };
        } catch (err) {
          console.error(`Error loading metrics for customer ${customerId}:`, err);
          return {
            customerId,
            assignedStaffId: null,
            lastOrderByStaffId: null
          };
        }
      });
      
      const metrics = await Promise.all(promises);
      
      // Update customers data with metrics
      setCustomersData(prev => {
        return prev.map(customer => {
          const metric = metrics.find(m => m.customerId === customer.customerId);
          if (metric) {
            return {
              ...customer,
              assignedStaffId: metric.assignedStaffId,
              lastOrderByStaffId: metric.lastOrderByStaffId
            };
          }
          return customer;
        });
      });
      
      // Small delay between batches to avoid overwhelming the API
      if (i + batchSize < customerIds.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    console.log(`✅ Loaded metrics for ${customerIds.length} customers`);
  }, []);

  // Phase 1: Load initial customer data (fast)
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('📦 Phase 1: Loading initial customer data...');
        
        // Load all customers
        const customersResult = await getAllCustomersForManager();
        
        if (!customersResult.success) {
          throw new Error(customersResult.message || 'Failed to load customers');
        }
        
        // Transform customers data
        const customers = (customersResult.data || []).map(customer => {
          const customerId = customer.customerId || customer.customer_id;
          
          return {
            customerId: customerId,
            name: customer.name || '',
            email: customer.email || '',
            phone: customer.phoneNumber || customer.phone_number || '',
            address: customer.address || '',
            // Metrics will be loaded progressively
            assignedStaffId: null
          };
        });
        
        setCustomersData(customers);
        console.log(`✅ Phase 1: Loaded ${customers.length} customers`);
        
        // Phase 2: Load ALL metrics for ALL customers at once (no progressive loading)
        if (customers.length > 0) {
          await loadMetricsForCustomers(customers);
        }
        
      } catch (err) {
        console.error('Error loading initial data:', err);
        setError(err.message || 'Failed to load customers');
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, [loadMetricsForCustomers, customersPerPage]);

  // No need for progressive loading - all metrics loaded upfront

  // Filter customers
  const filteredCustomers = customersData.filter(customer => {
    const matchesSearch = 
      !searchTerm.trim() ||
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      String(customer.customerId).includes(searchTerm);
    
    return matchesSearch;
  });

  // Calculate statistics from filtered customers
  const stats = {
    totalCustomers: filteredCustomers.length
  };

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);
  const startIndex = (currentPage - 1) * customersPerPage;
  const endIndex = startIndex + customersPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };



  return (
    <Layout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <span className="hover:text-blue-600 cursor-pointer" onClick={() => navigate('/manager/dashboard')}>
            Dashboard
          </span>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 font-medium">Customers</span>
        </div>

        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
            <p className="text-sm text-gray-600 mt-1">
              Business-level customer overview and KPIs
              {loading && <span className="ml-2 text-blue-600">(Loading...)</span>}
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
                <p className="text-sm text-gray-600">Total Customers</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-gray-900">All Customers</h3>
              <span className="text-xs text-gray-500">({filteredCustomers.length} results)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name / ID / phone / email"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-gray-600">Loading customers...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                <p className="text-red-600 font-medium">Error: {error}</p>
                <p className="text-sm text-gray-600 mt-1">Please refresh the page to try again</p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Customer ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Address
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedCustomers.map((customer, index) => {
                      return (
                        <tr 
                          key={customer.customerId || index} 
                          onClick={() => navigate(`/manager/customers/${customer.customerId}`)}
                          className="hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                                <Users className="w-4 h-4 text-gray-600" />
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {customer.customerId || 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <span className="text-sm font-medium text-blue-600">{customer.name || 'N/A'}</span>
                              <div className="text-xs text-gray-500">{customer.email || 'N/A'}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{customer.phone || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-700 max-w-xs truncate" title={customer.address || 'N/A'}>
                              {customer.address || 'N/A'}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(endIndex, filteredCustomers.length)}</span> of{' '}
                    <span className="font-medium">{filteredCustomers.length}</span> customers
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </button>
                    
                    {/* Page numbers */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-1.5 text-sm rounded-lg ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      Next
                      <ChevronRightIcon className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Customers;
