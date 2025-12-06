import React, { useState, useEffect } from 'react';
import Layout from '../layout/Layout';
import {
  Calendar,
  Plus,
  Eye,
  Edit,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Filter,
  Car,
  User,
  Search
} from 'lucide-react';
import { useLocation } from 'react-router';
import { getAllCustomers } from '../services/customerService';
import { fetchInventory, fetchVariantsForModel, fetchAvailableSerialsByVariant } from '../services/inventoryService';
import { createTestDrive, updateTestDriveStatus, getTestDrivesByCustomerId, getDealerTestDrives } from '../services/testDriveService';

const TestDrives = () => {
  const location = useLocation();
  const vehicleData = location.state?.vehicleData;
  const [testDrives, setTestDrives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, completed, cancelled
  const [searchTerm, setSearchTerm] = useState('');
  
  // Create modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [availableSerials, setAvailableSerials] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState('');
  const [availableVariants, setAvailableVariants] = useState([]);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [existingSchedule, setExistingSchedule] = useState(null);
  const [allowReplace, setAllowReplace] = useState(false);
  const [duplicateError, setDuplicateError] = useState('');

  const parseStatus = useCallback((status) => {
    if (!status) {
      return { baseStatus: 'PENDING', encodedStatus: '', dealerId: null };
    }
    const statusStr = String(status).trim();
    if (!statusStr.includes('_')) {
      return {
        baseStatus: statusStr.toUpperCase(),
        encodedStatus: statusStr,
        dealerId: null
      };
    }
    const lastUnderscore = statusStr.lastIndexOf('_');
    const baseStatus = statusStr.substring(0, lastUnderscore).toUpperCase();
    const dealerIdPart = statusStr.substring(lastUnderscore + 1);
    const dealerId = dealerIdPart && !Number.isNaN(Number(dealerIdPart)) ? Number(dealerIdPart) : null;
    return {
      baseStatus,
      encodedStatus: statusStr,
      dealerId
    };
  }, []);
  
  const fetchAllTestDrives = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getDealerTestDrives();
      const items = Array.isArray(result.data) ? result.data : [];

      const allTestDrives = items.map((entry) => {
        if (!entry) return null;

        let schedule = entry;
        let customerId = entry.customerId || entry.customer_id;
        let customerName = entry.customerName || entry.customer_name || entry.name;

        if (entry.testDriveSchedule || entry.test_drive_schedule || entry.schedule) {
          schedule = entry.testDriveSchedule || entry.test_drive_schedule || entry.schedule;
          customerId = entry.customerId || entry.customer_id || entry.id || customerId;
          customerName = entry.name || customerName;
        }

        if (!schedule) return null;

        let resolvedName = customerName;
        if (!resolvedName && customerId) {
          const foundCustomer = customers.find(c => {
            const id = c.customerId || c.customer_id || c.id;
            return String(id) === String(customerId);
          });
          if (foundCustomer) {
            resolvedName = foundCustomer.name || `Customer ${customerId}`;
          }
        }

        if (!resolvedName) {
          resolvedName = customerId ? `Customer ${customerId}` : 'Customer';
        }

        const serialId = schedule.serialId || schedule.serial_id;
        const { baseStatus, encodedStatus, dealerId } = parseStatus(schedule.status || '');
        const dateValue = schedule.date || schedule.scheduleDate || schedule.schedule_at || 'N/A';

        return {
          appointmentId: schedule.appointmentId || schedule.appointment_id || schedule.id,
          customerId: customerId || 'N/A',
          customerName: resolvedName,
          serialId: serialId || 'N/A',
          date: dateValue,
          status: baseStatus || 'PENDING',
          rawStatus: encodedStatus || schedule.status || 'PENDING',
          dealerId,
        };
      }).filter(Boolean);

      allTestDrives.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA;
      });
      
      setTestDrives(allTestDrives);
      console.log(`✅ Loaded ${allTestDrives.length} test drives from dealer endpoint`);
    } catch (err) {
      console.error('Error fetching test drives:', err);
      setError('Failed to load test drives');
    } finally {
      setLoading(false);
    }
  }, [parseStatus, customers]);
  
  // Form state
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    serialId: '',
    date: '',
    status: 'Pending'
  });

  // Fetch all customers and vehicles on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load customers
        const customersResult = await getAllCustomers();
        if (customersResult.success && customersResult.data) {
          setCustomers(customersResult.data);
        }

        // Load vehicles for serial ID selection and mapping
        const inventoryResult = await fetchInventory();
        if (inventoryResult.success && inventoryResult.data) {
          setVehicles(inventoryResult.data);
        }

      } catch (err) {
        console.error('Error loading data:', err);
      }
    };
    
    loadData();
  }, []);

  // Fetch all test drives for dealer (new backend endpoint)
  useEffect(() => {
    const loadTestDrives = async () => {
      if (vehicles.length > 0) await fetchAllTestDrives();
    };
    loadTestDrives();
  }, [vehicles.length]);

  // Auto-open create modal and pre-fill vehicle data when coming from Inventory
  useEffect(() => {
    if (vehicleData && customers.length > 0) {
      // Pre-fill form with vehicle data
      if (vehicleData.serialId) {
        setFormData(prev => ({
          ...prev,
          serialId: vehicleData.serialId,
        }));
      }
      // Auto-open the create modal
      setShowCreateModal(true);
    }
  }, [vehicleData, customers]);

  const fetchAllTestDrives = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getDealerTestDrives();
      const items = Array.isArray(result.data) ? result.data : [];

      const allTestDrives = items.map((customer) => {
        const schedule = customer.testDriveSchedule || customer.test_drive_schedule || customer.schedule;
        if (!schedule) return null;
        const customerId = customer.customerId || customer.customer_id || customer.id;
        const customerName = customer.name || `Customer ${customerId}`;
        const serialId = schedule.serialId || schedule.serial_id;

        // No model/variant mapping required anymore

        return {
          appointmentId: schedule.appointmentId || schedule.appointment_id || schedule.id,
          customerId,
          customerName,
          serialId: serialId || 'N/A',
          date: schedule.date || schedule.scheduleDate || schedule.schedule_at || 'N/A',
          status: schedule.status || 'PENDING',
        };
      }).filter(Boolean);

      // Sort by date (most recent first)
      allTestDrives.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA;
      });
      
      setTestDrives(allTestDrives);
      console.log(`✅ Loaded ${allTestDrives.length} test drives from dealer endpoint`);
    } catch (err) {
      console.error('Error fetching test drives:', err);
      setError('Failed to load test drives');
    } finally {
      setLoading(false);
    }
  };

  // Filter test drives
  const filteredTestDrives = testDrives.filter(drive => {
    // Status filter (handle both uppercase and lowercase)
    if (statusFilter !== 'all') {
      const driveStatus = (drive.status || '').toLowerCase();
      if (statusFilter === 'pending' && driveStatus !== 'pending') return false;
      if (statusFilter === 'completed' && driveStatus !== 'completed') return false;
      if (statusFilter === 'cancelled' && driveStatus !== 'cancelled' && driveStatus !== 'canceled') return false;
    }
    
    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return (
        (drive.customerName || '').toLowerCase().includes(term) ||
        (drive.vehicleName || '').toLowerCase().includes(term) ||
        (drive.serialId || '').toLowerCase().includes(term) ||
        (drive.date || '').toLowerCase().includes(term) ||
        String(drive.appointmentId || '').includes(term)
      );
    }
    
    return true;
  });

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // If customer selected, get customer name
    if (name === 'customerId' && value) {
      const customer = customers.find(c => {
        const id = c.customerId || c.customer_id || c.id;
        return String(id) === String(value);
      });
      if (customer) {
        setFormData(prev => ({
          ...prev,
          customerName: customer.name || ''
        }));
      }

      // Fetch existing schedule for this customer to warn about replacement
      (async () => {
        try {
          const res = await getTestDrivesByCustomerId(parseInt(value));
          const schedule = res.success && res.data && res.data.length > 0 ? res.data[0] : null;
          setExistingSchedule(schedule);
          setAllowReplace(false);
        } catch {
          setExistingSchedule(null);
          setAllowReplace(false);
        }
      })();
    }

    // Clear duplicate error on any relevant change and re-check below
    if (name === 'serialId' || name === 'date') {
      setDuplicateError('');
    }
  };

  // Handle create test drive
  const handleCreateTestDrive = async (e) => {
    e.preventDefault();
    
    if (!formData.customerId || !formData.serialId || !formData.date) {
      alert('Please fill in all required fields');
      return;
    }

    // If an existing schedule is present, require explicit replace confirmation
    if (existingSchedule && !allowReplace) {
      alert('This customer already has a test drive schedule. Please check "Replace existing schedule" to proceed.');
      return;
    }

    // Client-side duplicate check (same serial + date already listed)
    const hasDuplicate = testDrives.some(d =>
      String(d.serialId) === String(formData.serialId) &&
      new Date(d.date).toISOString().slice(0,10) === new Date(formData.date).toISOString().slice(0,10)
    );
    if (hasDuplicate) {
      setDuplicateError('A test drive with this serial ID and date already exists. Choose a different date or serial.');
      return;
    }

    setCreating(true);
    try {
      const result = await createTestDrive({
        customer_id: parseInt(formData.customerId),
        serial_id: formData.serialId,
        date: formData.date,
        status: formData.status || 'Pending'
      });

      if (result.success) {
        alert('✅ Test drive scheduled successfully!');
        setShowCreateModal(false);
        setFormData({
          customerId: '',
          customerName: '',
          serialId: '',
          date: '',
          status: 'Pending'
        });
        setExistingSchedule(null);
        setAllowReplace(false);
        setDuplicateError('');
        // Refresh test drives after a short delay to allow backend to process
        setTimeout(async () => {
          await fetchAllTestDrives();
        }, 500);
      } else {
        alert(`❌ Failed to schedule test drive: ${result.message}`);
      }
    } catch (err) {
      console.error('Error creating test drive:', err);
      alert('Failed to create test drive. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  // Handle update status
  const handleUpdateStatus = async (appointmentId, newStatus) => {
    if (!window.confirm(`Are you sure you want to update test drive #${appointmentId} status to "${newStatus}"?`)) {
      return;
    }

    try {
      // Backend expects uppercase status
      const statusToSend = newStatus.toUpperCase();
      const result = await updateTestDriveStatus(appointmentId, statusToSend);
      
      if (result.success) {
        alert(`✅ Test drive status updated successfully!`);
        // Refresh test drives to get updated data
        await fetchAllTestDrives();
      } else {
        alert(`❌ Failed to update status: ${result.message}`);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status. Please try again.');
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusLower = (status || '').toLowerCase().trim();
    
    if (statusLower === 'completed') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </span>
      );
    } else if (statusLower === 'pending') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </span>
      );
    } else if (statusLower === 'cancelled' || statusLower === 'canceled') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Cancelled
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        {status || 'Unknown'}
      </span>
    );
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString || dateString === 'N/A') return 'N/A';
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

  // Get available serial IDs from inventory vehicles
  const getAvailableSerialIds = () => {
    const serials = [];
    vehicles.forEach(model => {
      if (model.lists && Array.isArray(model.lists)) {
        model.lists.forEach(list => {
          const serialId = list.serialId || list.serial_id;
          if (serialId) {
            serials.push(serialId);
          }
        });
      }
    });
    // Remove duplicates
    return [...new Set(serials)].sort();
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 flex items-center space-x-2">
                <Calendar className="w-7 h-7" />
                <span>Test Drive Management</span>
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Schedule and manage test drive appointments
              </p>
            </div>
            <button
              onClick={async () => {
                const fromInventory = getAvailableSerialIds();
                if (fromInventory.length > 0) {
                  setAvailableSerials(fromInventory);
                } else {
                  // Fallback: collect serials from existing dealer schedules
                  const dealerRes = await getDealerTestDrives();
                  const serials = [...new Set((dealerRes.data || [])
                    .map(c => (c.testDriveSchedule || c.schedule || {}).serialId || (c.testDriveSchedule || c.schedule || {}).serial_id)
                    .filter(Boolean))].sort();
                  setAvailableSerials(serials);
                }
                setSelectedModelId('');
                setSelectedVariantId('');
                setAvailableVariants([]);
                setShowCreateModal(true);
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg flex items-center space-x-2 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Test Drive</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by customer name, vehicle, or serial ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
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
                onClick={() => setStatusFilter('completed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === 'completed'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => setStatusFilter('cancelled')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === 'cancelled'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancelled
              </button>
            </div>
          </div>
        </div>

        {/* Test Drives Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-gray-600">Loading test drives...</p>
              </div>
            </div>
          ) : filteredTestDrives.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No test drives found</p>
                <p className="text-sm text-gray-500 mt-1">
                  {searchTerm || statusFilter !== 'all'
                    ? 'No test drives match the selected filters'
                    : 'Schedule a test drive to get started'}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Appointment ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
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
                  {filteredTestDrives.map((drive, index) => (
                    <tr key={drive.appointmentId || index} className="hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          TD-{drive.appointmentId || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{drive.customerName}</div>
                        <div className="text-xs text-gray-500">ID: {drive.customerId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{drive.serialId}</div></td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(drive.date)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(drive.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {drive.status && drive.status.toLowerCase() !== 'completed' && (
                            <button
                              onClick={() => handleUpdateStatus(drive.appointmentId, 'Completed')}
                              className="p-1.5 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition-colors"
                              title="Mark as Completed"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {drive.status && drive.status.toLowerCase() !== 'cancelled' && drive.status.toLowerCase() !== 'canceled' && (
                            <button
                              onClick={() => handleUpdateStatus(drive.appointmentId, 'Cancelled')}
                              className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                              title="Cancel"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Test Drive Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white p-6 border-b border-green-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Schedule Test Drive</h2>
                    <p className="text-green-100 text-sm mt-1">
                      Create a new test drive appointment
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition-all duration-200"
                  >
                    <span className="text-2xl">&times;</span>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <form onSubmit={handleCreateTestDrive} className="p-6 space-y-6">
                {/* Existing schedule warning */}
                {existingSchedule && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-yellow-900 font-medium">
                          This customer already has a scheduled test drive:
                        </p>
                        <p className="text-sm text-yellow-800 mt-1">
                          Serial: <span className="font-semibold">{existingSchedule.serialId || existingSchedule.serial_id}</span> •
                          Date: <span className="font-semibold">{formatDate(existingSchedule.date)}</span> •
                          Status: <span className="font-semibold">{existingSchedule.status}</span>
                        </p>
                        <label className="inline-flex items-center mt-3 text-sm text-yellow-900">
                          <input
                            type="checkbox"
                            className="mr-2 rounded border-yellow-400 text-yellow-600 focus:ring-yellow-500"
                            checked={allowReplace}
                            onChange={(e) => setAllowReplace(e.target.checked)}
                          />
                          Replace existing schedule with the new one
                        </label>
                      </div>
                    </div>
                  </div>
                )}
                {/* Vehicle Info Banner (if coming from inventory) */}
                {vehicleData && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Car className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          Vehicle Selected: {vehicleData.title || vehicleData.modelName || 'Vehicle'}
                        </p>
                        {vehicleData.serialId && (
                          <p className="text-xs text-blue-700 mt-1">
                            Serial ID: {vehicleData.serialId}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Customer Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="customerId"
                    value={formData.customerId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select a customer...</option>
                    {customers.map((customer) => {
                      const id = customer.customerId || customer.customer_id || customer.id;
                      return (
                        <option key={id} value={id}>
                          {customer.name || `Customer ${id}`} {customer.email ? `(${customer.email})` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Model and Variant selections removed as requested */}
                {/* Model Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Model <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedModelId}
                    onChange={async (e) => {
                      const id = e.target.value;
                      setSelectedModelId(id);
                      setSelectedVariantId('');
                      setAvailableVariants([]);
                      setAvailableSerials([]);
                      if (!id) return;

                      // Prefer variants from inventory lists for this model; fallback to API
                      let variants = [];
                      const model = vehicles.find(m => String(m.modelId) === String(id));
                      if (model && Array.isArray(model.lists) && model.lists.length > 0) {
                        variants = model.lists;
                      } else {
                        variants = await fetchVariantsForModel(parseInt(id));
                      }
                      setAvailableVariants(Array.isArray(variants) ? variants : []);

                      // Pre-populate serials list based on model lists or variants
                      let serials = [];
                      if (model && Array.isArray(model.lists) && model.lists.length > 0) {
                        serials = [...new Set(model.lists.map(v => v.serialId || v.serial_id).filter(Boolean))];
                      }
                      if (serials.length === 0) {
                        serials = [...new Set((variants || []).map(v => v.serialId || v.serial_id).filter(Boolean))];
                      }
                      setAvailableSerials(serials.sort());
                      setFormData(prev => ({ ...prev, serialId: '' }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">{vehicles.length ? 'Select model...' : 'Loading models...'}</option>
                    {vehicles.map(m => (
                      <option key={m.modelId} value={m.modelId}>
                        {m.modelName || m.name || `Model ${m.modelId}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Variant Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Variant <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedVariantId}
                    onChange={async (e) => {
                      const vid = e.target.value;
                      setSelectedVariantId(vid);

                      // Query BE for available serials for this variant
                      let serials = await fetchAvailableSerialsByVariant(parseInt(vid));
                      serials = (serials || []).map(s => s.serialId || s.serial_id || s.serial).filter(Boolean);

                      // Fallback to local lists if BE returns none
                      if (serials.length === 0) {
                        const model = vehicles.find(m => String(m.modelId) === String(selectedModelId));
                        if (model && Array.isArray(model.lists)) {
                          serials = [...new Set(model.lists.map(v => v.serialId || v.serial_id).filter(Boolean))];
                        }
                        if (serials.length === 0) {
                          serials = [...new Set(availableVariants.map(v => v.serialId || v.serial_id).filter(Boolean))];
                        }
                      }

                      setAvailableSerials(serials);
                      setFormData(prev => ({ ...prev, serialId: '' }));
                    }}
                    disabled={!selectedModelId}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                    required
                  >
                    <option value="">{selectedModelId ? 'Select variant...' : 'Select model first'}</option>
                    {availableVariants.map(v => (
                      <option key={v.variantId} value={v.variantId}>
                        {v.versionName || v.variantName || 'Standard'} {v.color ? `- ${v.color}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Serial ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Serial ID <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="serialId"
                    value={formData.serialId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select a vehicle serial ID...</option>
                    {(availableSerials.length > 0 ? availableSerials : getAvailableSerialIds()).map((serial, index) => {
                      // Try to find vehicle name for this serial
                      let vehicleInfo = serial;
                      vehicles.forEach(model => {
                        if (model.lists) {
                          const variant = model.lists.find(list => 
                            (list.serialId || list.serial_id) === serial
                          );
                          if (variant) {
                            const modelName = model.modelName || model.name || 'Unknown';
                            const variantName = variant.variantName || '';
                            vehicleInfo = variantName 
                              ? `${serial} - ${modelName} ${variantName}`
                              : `${serial} - ${modelName}`;
                          }
                        }
                      });
                      return (
                        <option key={index} value={serial}>
                          {vehicleInfo}
                        </option>
                      );
                    })}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Select the serial ID of the vehicle for test drive
                  </p>
                  {duplicateError && (
                    <p className="text-xs text-red-600 mt-1">{duplicateError}</p>
                  )}
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Drive Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  {duplicateError && (
                    <p className="text-xs text-red-600 mt-1">{duplicateError}</p>
                  )}
                </div>

                {/* Status - Backend sets to PENDING by default, but we'll keep the field for consistency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status <span className="text-xs text-gray-500">(Note: Backend sets to "Pending" by default)</span>
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  >
                    <option value="Pending">Pending</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Status will be set to "Pending" when created. You can update it later.
                  </p>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    disabled={creating}
                    className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Calendar className="w-4 h-4" />
                        <span>Schedule Test Drive</span>
                      </>
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

export default TestDrives;

