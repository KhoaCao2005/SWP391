import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import Layout from '../layout/Layout';
import { 
  Users, 
  Search, 
  Plus, 
  Eye, 
  FileText, 
  Calendar,
  TrendingUp,
  UserPlus,
  RefreshCw,
  DollarSign,
  Car,
  ChevronRight,
  Filter,
  X,
  Loader2,
  ChevronLeft
} from 'lucide-react';
import { searchCustomersByName, createCustomer, getAllCustomers } from '../services/customerService';

const Customers = () => {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customersData, setCustomersData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const customersPerPage = 6;
  
  // Form state for new customer
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    address: ''
  });
  const [creating, setCreating] = useState(false);

  // Handle search - call API when user searches
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Please enter a customer name to search');
      setSearchPerformed(false);
      setCustomersData([]);
      return;
    }

    setLoading(true);
    setError(null);
    setSearchPerformed(true);

    try {
      const result = await searchCustomersByName(searchTerm.trim());
      
      if (result.success) {
        // Transform backend data to match frontend format
        const transformedData = (result.data || []).map(customer => {
          const numericId = getNumericCustomerId(customer);
          const displayId = customer.customerId || `C-${customer.customer_id || 'N/A'}`;
          
          return {
            customerId: displayId, // For display purposes
            numericCustomerId: numericId, // For navigation and API calls
            name: customer.name || '',
            email: customer.email || '',
            phone: customer.phoneNumber || customer.phone_number || '',
            phoneNumber: customer.phoneNumber || customer.phone_number || '',
            address: customer.address || '',
            // These fields are not available from BE, set defaults
            type: 'New', // Cannot determine from BE
            totalOrderForms: 0, // Not available from BE
            testDrive: '', // Not available from BE
            status: 'Active' // Cannot determine from BE
          };
        });
        
        setCustomersData(transformedData);
        
        if (transformedData.length === 0) {
          setError('No customers found with that name');
        }
      } else {
        setError(result.message || 'Failed to search customers');
        setCustomersData([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('An error occurred while searching');
      setCustomersData([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search on Enter key
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCustomer(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission - create customer via API
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newCustomer.name.trim() || !newCustomer.email.trim()) {
      alert('Name and Email are required');
      return;
    }

    setCreating(true);
    try {
      const result = await createCustomer({
        name: newCustomer.name,
        email: newCustomer.email,
        phoneNumber: newCustomer.phoneNumber || '',
        address: newCustomer.address || ''
      });

      if (result.success) {
        alert(result.message || 'Customer created successfully!');
        // Reset form and close modal
        setNewCustomer({
          name: '',
          email: '',
          phoneNumber: '',
          address: ''
        });
        setShowCreateModal(false);
        // Reload all customers to include the newly created one
        await loadAllCustomers();
      } else {
        alert(result.message || 'Failed to create customer');
      }
    } catch (err) {
      console.error('Create error:', err);
      alert('An error occurred while creating customer');
    } finally {
      setCreating(false);
    }
  };

  // Helper functions
  const maskPhone = (phone) => {
    if (!phone || phone.length < 4) return phone;
    return phone.substring(0, phone.length - 2).replace(/\d/g, (d, i) => i > 3 ? '*' : d) + phone.substring(phone.length - 2);
  };

  // Helper function to extract numeric customer ID
  // Returns the actual numeric ID from backend (customer_id) for database queries
  const getNumericCustomerId = (customer) => {
    // Prefer customer_id (from backend database)
    if (customer.customer_id) {
      return customer.customer_id;
    }
    // Fall back to id or customerId
    if (customer.id) {
      return customer.id;
    }
    if (customer.customerId) {
      // If it's a number, return it
      const numId = parseInt(customer.customerId);
      if (!isNaN(numId)) return numId;
      // If it's a string like "C-1", extract the number
      const match = String(customer.customerId).match(/(\d+)/);
      if (match && match[1]) {
        return parseInt(match[1]);
      }
    }
    return null;
  };

  // Load all customers automatically on page load
  const loadAllCustomers = async () => {
    setLoadingInitial(true);
    setError(null);
    try {
      console.log('🔄 Fetching all customers from backend...');
      const result = await getAllCustomers();
      
      console.log('📦 Backend response:', result);
      
      if (result.success && result.data) {
        // Transform backend data to match frontend format
        // Handle both empty array and array with data
        const transformedData = (result.data || []).map(customer => {
          const numericId = getNumericCustomerId(customer);
          const displayId = customer.customerId || customer.customer_id || `C-${customer.customer_id || 'N/A'}`;
          
          return {
            customerId: displayId, // For display purposes
            numericCustomerId: numericId, // For navigation and API calls
            name: customer.name || '',
            email: customer.email || '',
            phone: customer.phoneNumber || customer.phone_number || '',
            phoneNumber: customer.phoneNumber || customer.phone_number || '',
            address: customer.address || '',
            type: 'Returning',
            totalOrderForms: 0,
            testDrive: '',
            status: 'Active'
          };
        });
        
        // Sort by numeric customer ID
        transformedData.sort((a, b) => {
          const idA = a.numericCustomerId || 0;
          const idB = b.numericCustomerId || 0;
          return idA - idB;
        });
        
        setCustomersData(transformedData);
        console.log(`✅ Loaded ${transformedData.length} customers from database`);
        
        if (transformedData.length === 0) {
          console.log('ℹ️ No customers found in database');
          setError(null); // Don't show error for empty list, it's valid
        }
      } else {
        // API call succeeded but returned error status
        const errorMsg = result.message || 'Failed to load customers from server';
        console.error('❌ Error from getAllCustomers:', errorMsg);
        setError(errorMsg);
        setCustomersData([]);
      }
    } catch (err) {
      console.error('❌ Error loading customers:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load customers. Please check your connection and try again.';
      setError(errorMessage);
      setCustomersData([]);
    } finally {
      setLoadingInitial(false);
    }
  };

  // Load customers on mount
  useEffect(() => {
    loadAllCustomers();
  }, []);

  // Filter customers based on search term (client-side filtering)
  const filteredCustomers = customersData.filter(customer => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(term) ||
      customer.email?.toLowerCase().includes(term) ||
      customer.phoneNumber?.toLowerCase().includes(term) ||
      customer.address?.toLowerCase().includes(term)
    );
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);
  const startIndex = (currentPage - 1) * customersPerPage;
  const endIndex = startIndex + customersPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  // Reset to page 1 when search term changes or when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, customersData.length]);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      // Scroll to top of table
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <span className="hover:text-blue-600 cursor-pointer">Dashboard</span>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 font-medium">Customers</span>
        </div>

        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Customers</h1>
            <p className="text-sm text-gray-600 mt-1">Search and manage customer information</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center space-x-2 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>

        {/* Note: KPI Cards removed - requires getAllCustomers endpoint which doesn't exist in BE */}
        {/* Type/Status filters removed - backend doesn't support filtering by these fields */}

        {/* Search Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-gray-900">Search Customers</h3>
              {searchPerformed && (
                <span className="text-xs text-gray-500">({filteredCustomers.length} results)</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by customer name (press Enter or click Search)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Search Button */}
            <div>
              <button
                onClick={handleSearch}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {!searchPerformed && !error && customersData.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
              💡 Showing {customersData.length} customer(s). Use the search box above to filter by name, email, or phone.
            </div>
          )}
          
          {!searchPerformed && !error && customersData.length === 0 && !loadingInitial && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
              💡 No customers found. Try searching by name or create a new customer.
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Customer ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Address
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(loading || loadingInitial) && (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                      <p className="text-sm text-gray-600 mt-2">
                        {loadingInitial ? 'Loading customers...' : 'Searching customers...'}
                      </p>
                    </td>
                  </tr>
                )}
                
                {!loading && !loadingInitial && filteredCustomers.length === 0 && searchPerformed && (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                      No customers found matching "{searchTerm}". Try a different search term.
                    </td>
                  </tr>
                )}
                
                {!loading && !loadingInitial && filteredCustomers.length === 0 && !searchPerformed && (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                      No customers found. Try searching or create a new customer.
                    </td>
                  </tr>
                )}

                {!loading && !loadingInitial && paginatedCustomers.map((customer, index) => {
                  // Use numeric customer ID for navigation (required for backend queries)
                  const navigationId = customer.numericCustomerId || customer.customerId;
                  return (
                  <tr 
                    key={index} 
                    onClick={() => navigate(`/staff/customers/${navigationId}`)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                          <Users className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{customer.customerId}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-blue-600">{customer.name}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">{customer.phone ? maskPhone(customer.phone) : 'N/A'}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">{customer.email || 'N/A'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-700">{customer.address || 'N/A'}</span>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && !loadingInitial && filteredCustomers.length > 0 && (
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(endIndex, filteredCustomers.length)}
                </span>{' '}
                of <span className="font-medium">{filteredCustomers.length}</span> customer(s)
              </div>
              
              {totalPages > 1 && (
                <div className="flex items-center space-x-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                      currentPage === 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                      // Show first page, last page, current page, and pages around current
                      const showPage =
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1);

                      if (!showPage) {
                        // Show ellipsis
                        if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                          return (
                            <span key={pageNum} className="px-2 text-gray-400">
                              ...
                            </span>
                          );
                        }
                        return null;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                      currentPage === totalPages
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }`}
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Create Customer Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white bg-opacity-95 backdrop-blur-md rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto border border-white/20">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Create New Customer</h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewCustomer({ name: '', email: '', phoneNumber: '', address: '' });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newCustomer.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={newCustomer.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={newCustomer.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={newCustomer.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewCustomer({ name: '', email: '', phoneNumber: '', address: '' });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center space-x-2"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <span>Create Customer</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Customers;

