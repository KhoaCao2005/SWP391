import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../layout/Layout';
import {
  Calendar,
  Search,
  Filter,
  X,
  XCircle,
  CheckCircle,
  ChevronRight,
  Users,
  Car,
  Plus
} from 'lucide-react';
import axios from 'axios';
import { createTestDrive, updateTestDriveStatus, getDealerTestDrives } from '../../staff/services/testDriveService';
import { getAllCustomers } from '../../staff/services/customerService';
import { fetchInventory, fetchVariantsForModel, fetchAvailableSerialsByVariant } from '../../staff/services/inventoryService';

const API_URL = import.meta.env.VITE_API_URL;

const TestDriveSchedule = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [rawSchedules, setRawSchedules] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [availableSerials, setAvailableSerials] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState('');
  const [availableVariants, setAvailableVariants] = useState([]);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({ customerId: '', serialId: '', date: '' });

  useEffect(() => {
    (async () => {
      try {
        const [cust, inv] = await Promise.all([getAllCustomers(), fetchInventory()]);
        if (cust.success) setCustomers(cust.data || []);
        if (inv.success) setVehicles(inv.data || []);
        // Initial load: fetch all dealer schedules
        const dealer = await getDealerTestDrives();
        if (dealer.success && Array.isArray(dealer.data) && dealer.data.length > 0) {
          setRawSchedules(dealer.data);
        } else if (cust.success) {
          setRawSchedules(cust.data || []);
        } else {
          setRawSchedules([]);
        }
      } catch (e) {
        console.warn('Manager preload failed', e);
        setRawSchedules([]);
      }
    })();
  }, []);

  // Helper functions
  const formatDate = (date) => {
    try {
      return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return date;
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      'Pending': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Pending' },
      'Confirmed': { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Confirmed' },
      'Completed': { color: 'bg-green-100 text-green-800 border-green-200', label: 'Completed' },
      'Cancelled': { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Cancelled' }
    };
    const config = configs[status] || configs['Pending'];

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const customerMap = useMemo(() => {
    const map = new Map();
    customers.forEach((customer) => {
      const id = customer.customerId || customer.customer_id || customer.id;
      if (id !== undefined && id !== null) {
        map.set(id, customer);
        map.set(String(id), customer);
        const numericId = Number(id);
        if (!Number.isNaN(numericId)) {
          map.set(numericId, customer);
        }
      }
    });
    return map;
  }, [customers]);

  const normalizeStatus = (status) => {
    if (!status) return 'Pending';
    const base = status.includes('_') ? status.substring(0, status.lastIndexOf('_')) : status;
    const normalized = base.toLowerCase();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

  const scheduleRows = useMemo(() => {
    const baseEntries =
      Array.isArray(rawSchedules) && rawSchedules.length > 0
        ? rawSchedules
        : Array.isArray(customers)
        ? customers
        : [];

    return baseEntries
      .map((entry) => {
        const schedule =
          entry?.testDriveSchedule ||
          entry?.test_drive_schedule ||
          entry?.schedule ||
          (Array.isArray(entry?.testDriveSchedules) ? entry.testDriveSchedules[0] : null) ||
          (Array.isArray(entry?.schedules) ? entry.schedules[0] : null) ||
          entry;
        if (!schedule) return null;

        const appointmentId = schedule.appointmentId || schedule.appointment_id || schedule.id;
        const customerId =
          schedule.customerId ||
          schedule.customer_id ||
          entry?.customerId ||
          entry?.customer_id ||
          entry?.id ||
          null;
        const customer =
          (entry && (entry.name || entry.customerName)) ? entry : customerMap.get(customerId) || customerMap.get(String(customerId));
        const customerName =
          customer?.name ||
          customer?.customerName ||
          (customerId != null ? `Customer ${customerId}` : 'Unknown Customer');

        return {
          appointmentId,
          customerId,
          customerName,
          serialId: schedule.serialId || schedule.serial_id || '',
          date: schedule.date || schedule.scheduleDate || schedule.schedule_at || schedule.test_drive_date || '',
          status: normalizeStatus(schedule.status || schedule.statusName || 'Pending'),
          rawStatus: schedule.status,
        };
      })
      .filter(Boolean);
  }, [customerMap, rawSchedules]);

  const filteredRows = useMemo(() => {
    return scheduleRows.filter((row) =>
      statusFilter === 'all'
        ? true
        : (row.status || '').toLowerCase() === statusFilter.toLowerCase()
    );
  }, [scheduleRows, statusFilter]);

  // Handle cancel appointment
  const handleCancelAppointment = () => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      updateTestDriveStatus(selectedAppointment.appointmentId, 'Cancelled').then(() => {
        setIsDrawerOpen(false);
        handleSearch();
      });
    }
  };

  // Handle mark as completed
  const handleMarkCompleted = () => {
    updateTestDriveStatus(selectedAppointment.appointmentId, 'Completed').then(() => {
      setIsDrawerOpen(false);
      handleSearch();
    });
  };

  // Search customers and schedules by name
  const handleSearch = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_URL}/staff/searchCustomerForSchedule`,
        { name: String(searchQuery || '').trim() },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      if (res.data?.status === 'success') {
        const payload = Array.isArray(res.data.data) ? res.data.data : [];
        setRawSchedules(payload.length > 0 ? payload : customers);
      } else {
        setRawSchedules(customers);
      }
    } catch {
      setRawSchedules(customers);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableSerialIds = () => {
    const serials = [];
    vehicles.forEach(model => {
      if (Array.isArray(model.lists)) {
        model.lists.forEach(v => {
          const s = v.serialId || v.serial_id;
          if (s) serials.push(s);
        });
      }
    });
    return [...new Set(serials)].sort();
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <span className="hover:text-blue-600 cursor-pointer">Dashboard</span>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 font-medium">Test Drive Schedule</span>
        </div>

        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Test Drive Schedule</h1>
            <p className="text-sm text-gray-600 mt-1">Search and manage customer test drive schedules</p>
          </div>
          <button
            onClick={async () => {
              // Preload serials for dropdown
              const fromInventory = getAvailableSerialIds();
              setAvailableSerials(fromInventory);
              setSelectedModelId('');
              setSelectedVariantId('');
              setAvailableVariants([]);
              setShowCreateModal(true);
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg flex items-center space-x-2 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Test Drive</span>
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Search by Customer Name</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Enter customer name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={async () => {
                setLoading(true);
                const dealer = await getDealerTestDrives();
                if (dealer.success && Array.isArray(dealer.data) && dealer.data.length > 0) {
                  setRawSchedules(dealer.data);
                } else {
                  const allCustomers = await getAllCustomers();
                  if (allCustomers.success) {
                    setCustomers(allCustomers.data || []);
                    setRawSchedules(allCustomers.data || []);
                  } else {
                    setRawSchedules([]);
                  }
                }
                setLoading(false);
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Refresh All
            </button>
            <button
              onClick={handleSearch}
              disabled={loading || !searchQuery.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Serial
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRows.map((row) => (
                  <tr key={row.appointmentId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatDate(row.date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{row.customerName}</div>
                        <div className="text-xs text-gray-500">ID: {row.customerId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">{row.serialId || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(row.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedAppointment(row);
                            setIsDrawerOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 text-xs font-medium"
                        >
                          View
                        </button>
                        {row.status && row.status.toLowerCase() !== 'completed' && row.status.toLowerCase() !== 'cancelled' && (
                          <button
                            onClick={() => {
                              setSelectedAppointment(row);
                              handleCancelAppointment();
                            }}
                            className="text-red-600 hover:text-red-900 text-xs font-medium"
                          >
                            Cancel
                          </button>
                        )}
                        {row.status && row.status.toLowerCase() === 'confirmed' && (
                          <button
                            onClick={() => {
                              setSelectedAppointment(row);
                              handleMarkCompleted();
                            }}
                            className="text-green-600 hover:text-green-900 text-xs font-medium"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Drawer */}
      {isDrawerOpen && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white w-full max-w-2xl h-full overflow-y-auto shadow-2xl">
            {/* Drawer Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Test Drive Detail</h2>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Appointment ID: {selectedAppointment.appointmentId}</div>
            </div>

            {/* Drawer Content */}
            <div className="p-4 md:p-6 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  {/* Appointment Info */}
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center text-xs font-semibold text-gray-700 uppercase space-x-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Appointment</span>
                    </div>
                    <div className="text-sm font-medium text-gray-900">{formatDate(selectedAppointment.date)}</div>
                  </div>

                  {/* Customer Info */}
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                    <div className="flex items-center text-xs font-semibold text-gray-700 uppercase space-x-2">
                      <Users className="w-3.5 h-3.5" />
                      <span>Customer</span>
                    </div>
                    <div className="text-sm font-medium text-gray-900">{selectedAppointment.customerName}</div>
                    <div className="text-xs text-gray-500">ID: {selectedAppointment.customerId}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Vehicle Info */}
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                    <div className="flex items-center text-xs font-semibold text-gray-700 uppercase space-x-2">
                      <Car className="w-3.5 h-3.5" />
                      <span>Vehicle Serial</span>
                    </div>
                    <div className="text-sm font-medium text-gray-900">{selectedAppointment.serialId || '—'}</div>
                  </div>

                  {/* Status */}
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <label className="block text-xs font-semibold text-gray-700 uppercase">Status</label>
                    <select
                      value={selectedAppointment.status}
                      onChange={(e) => setSelectedAppointment({ ...selectedAppointment, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex items-center justify-between space-x-3">
              <div className="flex items-center space-x-2">
                {selectedAppointment.status !== 'Completed' && selectedAppointment.status !== 'Cancelled' && (
                  <button
                    onClick={handleCancelAppointment}
                    className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors flex items-center space-x-2"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Cancel Appointment</span>
                  </button>
                )}
                {selectedAppointment.status === 'Pending' && (
                  <button
                    onClick={handleMarkCompleted}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Mark Completed</span>
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={async () => {
                    await updateTestDriveStatus(selectedAppointment.appointmentId, selectedAppointment.status);
                    setIsDrawerOpen(false);
                    handleSearch();
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white p-6 border-b border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Create Test Drive</h2>
                  <p className="text-green-100 text-sm mt-1">Manager can create schedules</p>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-all duration-200">
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!formData.customerId || !formData.serialId || !formData.date) return;
                setCreating(true);
                const res = await createTestDrive({
                  customer_id: parseInt(formData.customerId),
                  serial_id: formData.serialId,
                  date: formData.date,
                  status: 'Pending'
                });
                setCreating(false);
                if (res.success) {
                  setShowCreateModal(false);
                  setFormData({ customerId: '', serialId: '', date: '' });
                  await handleSearch();
                } else {
                  alert(res.message || 'Failed to create schedule');
                }
              }}
              className="p-6 space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select a customer...</option>
                  {customers.map((c) => {
                    const id = c.customerId || c.customer_id || c.id;
                    return (
                      <option key={id} value={id}>
                        {c.name || `Customer ${id}`} {c.email ? `(${c.email})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Model */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Model</label>
                <select
                  value={selectedModelId}
                  onChange={async (e) => {
                    const id = e.target.value;
                    setSelectedModelId(id);
                    setSelectedVariantId('');
                    setAvailableVariants([]);
                    setAvailableSerials([]);
                    if (!id) return;
                    let variants = [];
                    const model = vehicles.find(m => String(m.modelId) === String(id));
                    if (model && Array.isArray(model.lists) && model.lists.length > 0) {
                      variants = model.lists;
                    } else {
                      variants = await fetchVariantsForModel(parseInt(id));
                    }
                    setAvailableVariants(variants || []);
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

              {/* Variant */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Variant</label>
                <select
                  value={selectedVariantId}
                  onChange={async (e) => {
                    const vid = e.target.value;
                    setSelectedVariantId(vid);

                    // Ask BE for unordered serials for this variant at dealer
                    let serials = await fetchAvailableSerialsByVariant(parseInt(vid));
                    serials = (serials || []).map(s => s.serialId || s.serial_id || s.serial).filter(Boolean);

                    // Fallbacks if BE returns none
                    if (serials.length === 0) {
                      const model = vehicles.find(m => String(m.modelId) === String(selectedModelId));
                      if (model && Array.isArray(model.lists)) {
                        serials = [...new Set(model.lists.map(v => v.serialId || v.serial_id).filter(Boolean))];
                      }
                      if (serials.length === 0) {
                        serials = [...new Set(availableVariants.map(v => v.serialId || v.serial_id).filter(Boolean))];
                      }
                    }

                    setAvailableSerials(serials.sort());
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

              {/* Serial */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Serial ID</label>
                <select
                  value={formData.serialId}
                  onChange={(e) => setFormData({ ...formData, serialId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select a vehicle serial ID...</option>
                  {(availableSerials.length > 0 ? availableSerials : getAvailableSerialIds()).map((s, idx) => (
                    <option key={idx} value={s}>{s}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Manager sees all serials from inventory/variants.</p>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Test Drive Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

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
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default TestDriveSchedule;
