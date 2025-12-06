import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import Layout from '../layout/Layout';
import { viewOrdersByCustomerId } from '../services/orderService';
import { getCustomerById, getFeedbackByCustomerId, getTestDrivesByCustomerId } from '../services/customerDetailService';
import { fetchInventory, fetchAllVariants } from '../services/inventoryService';
import { createTestDrive } from '../services/testDriveService';
import {
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  FileText,
  Car,
  MessageSquare,
  Edit,
  Plus,
  Eye,
  Clock,
  CheckCircle,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';

const CustomerDetail = () => {
  const { customerId: customerIdParam } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [loadingCustomer, setLoadingCustomer] = useState(true);
  const [testDrives, setTestDrives] = useState([]);
  const [loadingTestDrives, setLoadingTestDrives] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  const [vehicleMap, setVehicleMap] = useState(new Map()); // modelId -> modelName
  const [vehiclesData, setVehiclesData] = useState([]); // Store vehicles for serialId mapping
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ serialId: '', date: '' });
  const [scheduling, setScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [availableSerials, setAvailableSerials] = useState([]);

  // Helper function to extract numeric customer ID from URL parameter
  // Handles formats like: "1", "C-1", or any string containing numbers
  const extractNumericCustomerId = (customerIdParam) => {
    if (!customerIdParam) return null;
    
    // First try direct parsing (if it's already a number)
    const directParse = parseInt(customerIdParam);
    if (!isNaN(directParse)) {
      return directParse;
    }
    
    // If direct parse failed, try to extract number from string (e.g., "C-1" -> 1)
    const match = String(customerIdParam).match(/(\d+)/);
    if (match && match[1]) {
      const extractedId = parseInt(match[1]);
      if (!isNaN(extractedId)) {
        return extractedId;
      }
    }
    
    console.warn('⚠️ Could not extract numeric customer ID from:', customerIdParam);
    return null;
  };

  // Get the numeric customer ID
  const customerId = extractNumericCustomerId(customerIdParam);

  // Fetch vehicle models for name mapping
  useEffect(() => {
    const loadVehicleMap = async () => {
      try {
        const inventoryResult = await fetchInventory();
        const vehicleNameMap = new Map();
        if (inventoryResult.success && inventoryResult.data) {
          setVehiclesData(inventoryResult.data); // Store vehicles for serialId mapping
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
      } catch (err) {
        console.error('Error loading vehicle map:', err);
      }
    };
    loadVehicleMap();
  }, []);

  // Fetch customer data when component mounts or customerId changes
  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!customerId) {
        setLoadingCustomer(false);
        return;
      }
      
      setLoadingCustomer(true);
      try {
        const result = await getCustomerById(customerId);
        if (result.success && result.data) {
          const customerData = result.data;
          // Transform backend data to frontend format
          setCustomer({
            customerId: customerData.customerId || customerData.customer_id || customerData.id || `C-${customerId}`,
            name: customerData.name || 'N/A',
            email: customerData.email || 'N/A',
            phoneNumber: customerData.phoneNumber || customerData.phone_number || 'N/A',
            address: customerData.address || 'N/A'
          });
        } else {
          setCustomer(null);
        }
      } catch (error) {
        console.error('Error fetching customer:', error);
        setCustomer(null);
      } finally {
        setLoadingCustomer(false);
      }
    };
    
    fetchCustomerData();
  }, [customerId]);

  // Fetch orders when component mounts or customerId changes
  useEffect(() => {
    const fetchOrders = async () => {
      if (!customerId) {
        setLoadingOrders(false);
        setOrders([]);
        return;
      }
      
      setLoadingOrders(true);
      try {
        const result = await viewOrdersByCustomerId(customerId);
        console.log('📦 Orders fetched for customer', customerId, '(from param:', customerIdParam, '):', result);
        console.log('📦 Raw orders data:', result.data);
        console.log('📦 Orders count:', result.data?.length);
        console.log('📦 Result success:', result.success);
        
        // Handle response - check if data exists and is an array
        const ordersData = result.data;
        const isArray = Array.isArray(ordersData);
        const hasOrders = isArray && ordersData.length > 0;
        
        console.log('📦 Is array:', isArray);
        console.log('📦 Has orders:', hasOrders);
        
        if (result.success && ordersData && isArray && hasOrders) {
          // Log each order for debugging
          ordersData.forEach((order, index) => {
            console.log(`📦 Order ${index + 1}:`, {
              orderId: order.orderId || order.order_id,
              status: order.status,
              modelId: order.modelId || order.model_id,
              hasDetail: !!order.detail,
              customerId: order.customerId || order.customer_id
            });
          });
          
          // Transform order data for display - include ALL orders regardless of status or detail
          const transformedOrders = ordersData.map(order => {
            // Get price from order detail or confirmation
            let price = 0;
            let vehicleName = 'Unknown Vehicle';
            
            // Try to get vehicle name from various sources
            const modelId = order.modelId || order.model_id;
            const serialId = order.detail?.serialId || order.detail?.serial_id;
            
            // Get vehicle name from vehicleMap (if loaded) or use fallback
            if (modelId && vehicleMap.has(modelId)) {
              vehicleName = vehicleMap.get(modelId);
              if (serialId) {
                vehicleName = `${vehicleName} (Serial: ${serialId})`;
              }
            } else if (modelId) {
              vehicleName = `Model ID: ${modelId}`;
              if (serialId) {
                vehicleName = `${vehicleName} (Serial: ${serialId})`;
              }
            } else if (serialId) {
              vehicleName = `Serial: ${serialId}`;
            }
            
            // Calculate price from order detail
            if (order.detail) {
              const quantity = parseFloat(order.detail.quantity || '1');
              const unitPrice = parseFloat(order.detail.unitPrice || order.detail.unit_price || 0);
              price = quantity * unitPrice;
            }
            
            // Override with confirmation price if available
            if (order.confirmation) {
              const confirmationPrice = order.confirmation.totalPrice || order.confirmation.total_price;
              if (confirmationPrice) {
                price = parseFloat(confirmationPrice) || price;
              }
            }
            
            // Format date
            const orderDate = order.orderDate || order.order_date || '';
            const formattedDate = orderDate ? new Date(orderDate).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            }) : '';
            
            // Format price
            const formattedPrice = price > 0 ? new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
              minimumFractionDigits: 0
            }).format(price) : '';
            
            return {
              id: `ORD-${order.orderId || order.order_id}`,
              orderId: order.orderId || order.order_id,
              vehicle: vehicleName,
              price: formattedPrice,
              status: order.status || 'Pending',
              createdDate: formattedDate,
              rawDate: orderDate
            };
          });
          
          console.log('✅ Transformed orders:', transformedOrders);
          console.log('✅ Total orders to display:', transformedOrders.length);
          setOrders(transformedOrders);
        } else if (result.success && ordersData && isArray && !hasOrders) {
          // Success but empty array - no orders found
          console.log('ℹ️ No orders found for customer ID:', customerId);
          console.log('ℹ️ Empty orders array received');
          setOrders([]);
        } else {
          // Error or invalid response format
          console.log('ℹ️ No orders found or invalid result:', result);
          console.log('ℹ️ Result success:', result.success);
          console.log('ℹ️ Result data:', result.data);
          console.log('ℹ️ Result data type:', typeof result.data);
          console.log('ℹ️ Result data is array:', Array.isArray(result.data));
          setOrders([]);
        }
      } catch (error) {
        console.error('❌ Error fetching orders:', error);
        setOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    };
    
    // Fetch orders immediately when customerId changes, don't wait for vehicleMap
    // Vehicle names will be updated when vehicleMap loads
      fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, customerIdParam]); // vehicleMap intentionally excluded - orders fetched immediately, names updated later

  // Refresh orders when page becomes visible (e.g., returning from order form)
  useEffect(() => {
    if (!customerId) return;
    
    const fetchOrdersOnVisible = async () => {
      try {
        console.log('🔄 Refreshing orders on visibility change...');
        const result = await viewOrdersByCustomerId(customerId);
        const ordersData = result.data;
        const isArray = Array.isArray(ordersData);
        const hasOrders = isArray && ordersData && ordersData.length > 0;
        
        if (result.success && hasOrders) {
          // Transform orders with the same logic as main fetch
          const transformedOrders = ordersData.map(order => {
            const modelId = order.modelId || order.model_id;
            const serialId = order.detail?.serialId || order.detail?.serial_id;
            let vehicleName = 'Unknown Vehicle';
            
            if (modelId && vehicleMap.has(modelId)) {
              vehicleName = vehicleMap.get(modelId);
              if (serialId) {
                vehicleName = `${vehicleName} (Serial: ${serialId})`;
              }
            } else if (modelId) {
              vehicleName = `Model ID: ${modelId}`;
              if (serialId) {
                vehicleName = `${vehicleName} (Serial: ${serialId})`;
              }
            } else if (serialId) {
              vehicleName = `Serial: ${serialId}`;
            }
            
            let price = 0;
            if (order.detail) {
              const quantity = parseFloat(order.detail.quantity || '1');
              const unitPrice = parseFloat(order.detail.unitPrice || order.detail.unit_price || 0);
              price = quantity * unitPrice;
            }
            
            if (order.confirmation) {
              const confirmationPrice = order.confirmation.totalPrice || order.confirmation.total_price;
              if (confirmationPrice) {
                price = parseFloat(confirmationPrice) || price;
              }
            }
            
            const orderDate = order.orderDate || order.order_date || '';
            const formattedDate = orderDate ? new Date(orderDate).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            }) : '';
            
            const formattedPrice = price > 0 ? new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
              minimumFractionDigits: 0
            }).format(price) : '';
            
            return {
              id: `ORD-${order.orderId || order.order_id}`,
              orderId: order.orderId || order.order_id,
              vehicle: vehicleName,
              price: formattedPrice,
              status: order.status || 'Pending',
              createdDate: formattedDate,
              rawDate: orderDate
            };
          });
          
          console.log(`✅ Refreshed orders: ${transformedOrders.length} orders found`);
          setOrders(transformedOrders);
        } else if (result.success && isArray && !hasOrders) {
          // Empty array - no orders
          console.log('ℹ️ No orders found on refresh');
          setOrders([]);
        }
      } catch (error) {
        console.error('❌ Error refreshing orders on visibility change:', error);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && customerId && !loadingOrders) {
        // Small delay to ensure page is fully loaded
        setTimeout(fetchOrdersOnVisible, 500);
      }
    };

    // Also listen for focus event (when user switches back to the tab)
    const handleFocus = () => {
      if (customerId && !loadingOrders && document.visibilityState === 'visible') {
        console.log('🔄 Window focused, refreshing orders...');
        setTimeout(fetchOrdersOnVisible, 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [customerId, loadingOrders, vehicleMap]);
  
  // Update vehicle names when vehicleMap loads (re-fetch orders to get proper names)
  useEffect(() => {
    if (vehicleMap.size > 0 && customerId) {
      // Re-fetch orders to update vehicle names with the loaded vehicleMap
      const updateVehicleNames = async () => {
        try {
          const result = await viewOrdersByCustomerId(customerId);
          const ordersData = result.data;
          const isArray = Array.isArray(ordersData);
          const hasOrders = isArray && ordersData && ordersData.length > 0;
          
          if (result.success && hasOrders) {
            const transformedOrders = ordersData.map(order => {
              const modelId = order.modelId || order.model_id;
              const serialId = order.detail?.serialId || order.detail?.serial_id;
              let vehicleName = 'Unknown Vehicle';
              
              if (modelId && vehicleMap.has(modelId)) {
                vehicleName = vehicleMap.get(modelId);
                if (serialId) {
                  vehicleName = `${vehicleName} (Serial: ${serialId})`;
                }
              } else if (modelId) {
                vehicleName = `Model ID: ${modelId}`;
                if (serialId) {
                  vehicleName = `${vehicleName} (Serial: ${serialId})`;
                }
              } else if (serialId) {
                vehicleName = `Serial: ${serialId}`;
              }
              
              let price = 0;
              if (order.detail) {
                const quantity = parseFloat(order.detail.quantity || '1');
                const unitPrice = parseFloat(order.detail.unitPrice || order.detail.unit_price || 0);
                price = quantity * unitPrice;
              }
              
              if (order.confirmation) {
                const confirmationPrice = order.confirmation.totalPrice || order.confirmation.total_price;
                if (confirmationPrice) {
                  price = parseFloat(confirmationPrice) || price;
                }
              }
              
              const orderDate = order.orderDate || order.order_date || '';
              const formattedDate = orderDate ? new Date(orderDate).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              }) : '';
              
              const formattedPrice = price > 0 ? new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
                minimumFractionDigits: 0
              }).format(price) : '';
              
              return {
                id: `ORD-${order.orderId || order.order_id}`,
                orderId: order.orderId || order.order_id,
                vehicle: vehicleName,
                price: formattedPrice,
                status: order.status || 'Pending',
                createdDate: formattedDate,
                rawDate: orderDate
              };
            });
            
            setOrders(transformedOrders);
          }
        } catch (error) {
          console.error('Error updating vehicle names:', error);
        }
      };
      
      updateVehicleNames();
    }
  }, [vehicleMap, customerId]);

  // Fetch test drives and map serialId to vehicle names
  useEffect(() => {
    const fetchTestDrives = async () => {
      if (!customerId) {
        setLoadingTestDrives(false);
        setTestDrives([]);
        return;
      }
      
      setLoadingTestDrives(true);
      try {
        const result = await getTestDrivesByCustomerId(customerId);
        if (result.success && result.data) {
          // Transform test drives to include vehicle names
          const transformedTestDrives = result.data.map((drive) => {
            const serialId = drive.serialId || drive.serial_id;
            let vehicleName = 'N/A';
            
            // Try to map serialId to vehicle name using vehiclesData
            if (serialId && serialId.length >= 3 && vehiclesData.length > 0) {
              const prefix = serialId.substring(0, 3).toUpperCase();
              // Try to find matching model by prefix (e.g., FAL -> EV Falcon, HAW -> EV Hawk)
              const matchedModel = vehiclesData.find(model => {
                const modelName = (model.modelName || model.name || '').toUpperCase();
                // Extract first 3 chars from model name and compare
                const modelPrefix = modelName.substring(0, Math.min(3, modelName.length)).replace(/\s/g, '');
                // Check if model name contains the prefix or prefix matches model prefix
                return modelName.includes(prefix) || 
                       prefix.includes(modelPrefix) ||
                       modelPrefix === prefix;
              });
              
              if (matchedModel) {
                vehicleName = matchedModel.modelName || matchedModel.name || `Model (${prefix})`;
              } else {
                vehicleName = `Serial: ${serialId}`;
              }
            } else if (serialId) {
              vehicleName = `Serial: ${serialId}`;
            }
            
            return {
              appointmentId: drive.appointmentId || drive.appointment_id || drive.id || 'N/A',
              serialId: serialId || 'N/A',
              vehicleName: vehicleName,
              date: drive.date || drive.scheduleDate || drive.schedule_at || 'N/A',
              status: drive.status || 'Pending',
              customerId: drive.customerId || drive.customer_id
            };
          });
          
          setTestDrives(transformedTestDrives);
        } else {
          setTestDrives([]);
        }
      } catch {
        // Error is already handled in the service, just set empty array
        // Don't log as error since 404 is expected if endpoint doesn't exist
        setTestDrives([]);
      } finally {
        setLoadingTestDrives(false);
      }
    };
    
    fetchTestDrives();
  }, [customerId, vehiclesData]);

  // Fetch feedbacks
  useEffect(() => {
    const fetchFeedbacks = async () => {
      if (!customerId) {
        setLoadingFeedbacks(false);
        setFeedbacks([]);
        return;
      }
      
      setLoadingFeedbacks(true);
      try {
        const result = await getFeedbackByCustomerId(customerId);
        if (result.success && result.data) {
          setFeedbacks(result.data || []);
        } else {
          setFeedbacks([]);
        }
      } catch (error) {
        console.error('Error fetching feedbacks:', error);
        setFeedbacks([]);
      } finally {
        setLoadingFeedbacks(false);
      }
    };
    
    fetchFeedbacks();
  }, [customerId]);

  const getQuoteStatusBadge = (status) => {
    // Normalize status to handle case-insensitive matching
    const normalizedStatus = status?.toLowerCase() || '';

    const configs = {
      'approved': 'bg-green-100 text-green-700 border-green-200',
      'draft': 'bg-gray-100 text-gray-700 border-gray-200',
      'pending': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'rejected': 'bg-red-100 text-red-700 border-red-200',
      'delivered': 'bg-blue-100 text-blue-700 border-blue-200',
      'cancelled': 'bg-gray-100 text-gray-700 border-gray-200',
      'canceled': 'bg-gray-100 text-gray-700 border-gray-200'
    };
    
    const config = configs[normalizedStatus] || configs['draft'];
    const displayStatus = status || 'Unknown';
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${config}`}>
        {displayStatus}
      </span>
    );
  };

  const getTestDriveStatusBadge = (status) => {
    if (status === 'Completed') {
      return (
        <span className="inline-flex items-center text-green-600 text-sm">
          <CheckCircle className="w-4 h-4 mr-1" />
          Completed
        </span>
      );
    } else if (status === 'Scheduled') {
      return (
        <span className="inline-flex items-center text-blue-600 text-sm">
          <Clock className="w-4 h-4 mr-1" />
          Scheduled
        </span>
      );
    }
    return status;
  };

  // Customer detail is read-only for schedules; no inline status edits here

  // Helper function to mask phone number
  const maskPhone = (phone) => {
    if (!phone || phone.length < 4) return phone || 'N/A';
    return phone.substring(0, phone.length - 2).replace(/\d/g, (d, i) => i > 3 ? '*' : d) + phone.substring(phone.length - 2);
  };

  // Show loading state
  if (loadingCustomer) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-gray-600">Loading customer data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Show error state if customer not found
  if (!customer) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-600">Customer not found</p>
            <button
              onClick={() => navigate('/staff/customers')}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              Back to Customer List
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-3">
        {/* Breadcrumb */}
        <div className="flex items-center text-xs text-gray-600">
          <button onClick={() => navigate('/staff')} className="hover:text-blue-600">
            Dashboard
          </button>
          <ChevronRight className="w-3 h-3 mx-1" />
          <button onClick={() => navigate('/staff/customers')} className="hover:text-blue-600">
            Customers
          </button>
          <ChevronRight className="w-3 h-3 mx-1" />
          <span className="text-gray-900 font-medium">Customer Detail</span>
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate('/staff/customers')}
          className="flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm"
        >
          <ArrowLeft className="w-3 h-3 mr-1" />
          Back to Customer List
        </button>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Panel - Customer Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-4">
              {/* Header */}
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">{customer.name}</h2>
                <p className="text-xs text-gray-600">{customer.customerId}</p>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center text-xs">
                  <Phone className="w-3 h-3 text-gray-400 mr-2" />
                  <span className="text-gray-700">{maskPhone(customer.phoneNumber)}</span>
                </div>
                <div className="flex items-center text-xs">
                  <Mail className="w-3 h-3 text-gray-400 mr-2" />
                  <span className="text-gray-700 truncate">{customer.email}</span>
                </div>
                <div className="flex items-start text-xs">
                  <MapPin className="w-3 h-3 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 line-clamp-2">{customer.address}</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-1.5">
              <button onClick={async ()=>{
                  setScheduleError('');
                  const serialsFromModels = Array.from(new Set(
                    vehiclesData.flatMap(m => (Array.isArray(m.lists)? m.lists: []).map(v => v.serialId || v.serial_id).filter(Boolean))
                  ));
                  if (serialsFromModels.length > 0) {
                    setAvailableSerials(serialsFromModels);
                  } else {
                    const variants = await fetchAllVariants();
                    const serials = Array.from(new Set((variants || []).map(v => v.serialId || v.serial_id).filter(Boolean)));
                    setAvailableSerials(serials);
                  }
                  setShowScheduleModal(true);
                }} className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>Schedule Test Drive</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Tabbed Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200">
              {/* Tabs */}
              <div className="border-b border-gray-200">
                <div className="flex overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('info')}
                    className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === 'info'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <User className="w-4 h-4 inline mr-2" />
                    Customer Info
                  </button>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === 'orders'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <FileText className="w-4 h-4 inline mr-2" />
                    Order Form
                  </button>
                  <button
                    onClick={() => setActiveTab('testdrives')}
                    className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === 'testdrives'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Car className="w-4 h-4 inline mr-2" />
                    Test Drives
                  </button>
                  <button
                    onClick={() => setActiveTab('feedback')}
                    className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === 'feedback'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 inline mr-2" />
                    Feedback
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-4">
                {/* Customer Info Tab */}
                {activeTab === 'info' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-gray-900">Customer Information</h3>
                      <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-800">
                        <Edit className="w-3 h-3" />
                        <span className="text-xs font-medium">Edit Info</span>
                      </button>
                    </div>

                    {/* Personal Info */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="font-medium text-sm text-gray-900 mb-2">Personal Information</h4>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                        <div>
                          <label className="text-xs text-gray-600">Full Name</label>
                          <p className="text-xs font-medium text-gray-900">{customer.name}</p>
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Customer ID</label>
                          <p className="text-xs font-medium text-gray-900">{customer.customerId}</p>
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Email</label>
                          <p className="text-xs font-medium text-gray-900">{customer.email}</p>
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Phone</label>
                          <p className="text-xs font-medium text-gray-900">{customer.phoneNumber}</p>
                        </div>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="font-medium text-sm text-gray-900 mb-2">Address</h4>
                      <div className="grid grid-cols-1 gap-y-2">
                        <div>
                          <label className="text-xs text-gray-600">Full Address</label>
                          <p className="text-xs font-medium text-gray-900">{customer.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Schedule Test Drive Modal */}
                {showScheduleModal && (
                  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                        <h4 className="text-base font-semibold text-gray-900">Schedule Test Drive</h4>
                        <button onClick={()=>setShowScheduleModal(false)} className="text-gray-500 hover:text-gray-700">&times;</button>
                      </div>
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!customerId) return;
                          if (!scheduleForm.serialId || !scheduleForm.date) {
                            setScheduleError('Please select serial and date.');
                            return;
                          }
                          setScheduling(true);
                          setScheduleError('');
                          try {
                            const res = await createTestDrive({
                              customer_id: customerId,
                              serial_id: scheduleForm.serialId,
                              date: scheduleForm.date,
                              status: 'Pending'
                            });
                            if (res.success) {
                              setShowScheduleModal(false);
                              setScheduleForm({ serialId: '', date: '' });
                              // refresh list
                              try {
                                const r = await getTestDrivesByCustomerId(customerId);
                                if (r.success && r.data) {
                                  const td = r.data.map((drive) => ({
                                    appointmentId: drive.appointmentId || drive.appointment_id || drive.id || 'N/A',
                                    serialId: drive.serialId || drive.serial_id,
                                    vehicleName: drive.serialId || drive.serial_id,
                                    date: drive.date || drive.scheduleDate || drive.schedule_at || 'N/A',
                                    status: drive.status || 'Pending',
                                    customerId: drive.customerId || drive.customer_id
                                  }));
                                  setTestDrives(td);
                                }
                              } catch {
                                // Ignore refresh errors
                              }
                            } else {
                              setScheduleError(res.message || 'Failed to create test drive.');
                            }
                          } catch {
                            setScheduleError('Failed to create test drive. Make sure serial and date are selected.');
                          } finally {
                            setScheduling(false);
                          }
                        }}
                        className="p-5 space-y-4"
                      >
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Vehicle Serial ID</label>
                          <select
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            value={scheduleForm.serialId}
                            onChange={(e)=>setScheduleForm(f=>({...f, serialId: e.target.value}))}
                            required
                          >
                            <option value="">Select serial...</option>
                            {availableSerials.map((serial, idx)=>(
                              <option key={idx} value={serial}>{serial}</option>
                            ))}
                          </select>
                          {availableSerials.length === 0 && (
                            <p className="text-xs text-yellow-700 mt-1">No serials available. Please check inventory or try again later.</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                          <input
                            type="date"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            value={scheduleForm.date}
                            onChange={(e)=>setScheduleForm(f=>({...f, date: e.target.value}))}
                            min={new Date().toISOString().slice(0,10)}
                            required
                          />
                        </div>
                        {scheduleError && <div className="text-xs text-red-600">{scheduleError}</div>}
                        <div className="pt-2 flex justify-end space-x-2">
                          <button type="button" onClick={()=>setShowScheduleModal(false)} className="px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200">Cancel</button>
                          <button type="submit" disabled={scheduling || !scheduleForm.serialId || !scheduleForm.date} className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60">
                            {scheduling ? 'Creating...' : 'Create'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Order Form Tab */}
                {activeTab === 'orders' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Orders</h3>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={async () => {
                            if (!customerId) return;
                            setLoadingOrders(true);
                            try {
                              const result = await viewOrdersByCustomerId(customerId);
                              console.log('🔄 Refreshed orders:', result);
                              const ordersData = result.data;
                              const isArray = Array.isArray(ordersData);
                              const hasOrders = isArray && ordersData && ordersData.length > 0;
                              
                              if (result.success && hasOrders) {
                                const transformedOrders = ordersData.map(order => {
                                  const modelId = order.modelId || order.model_id;
                                  const serialId = order.detail?.serialId || order.detail?.serial_id;
                                  let vehicleName = 'Unknown Vehicle';
                                  
                                  if (modelId && vehicleMap.has(modelId)) {
                                    vehicleName = vehicleMap.get(modelId);
                                    if (serialId) {
                                      vehicleName = `${vehicleName} (Serial: ${serialId})`;
                                    }
                                  } else if (modelId) {
                                    vehicleName = `Model ID: ${modelId}`;
                                    if (serialId) {
                                      vehicleName = `${vehicleName} (Serial: ${serialId})`;
                                    }
                                  } else if (serialId) {
                                    vehicleName = `Serial: ${serialId}`;
                                  }
                                  
                                  let price = 0;
                                  if (order.detail) {
                                    const quantity = parseFloat(order.detail.quantity || '1');
                                    const unitPrice = parseFloat(order.detail.unitPrice || order.detail.unit_price || 0);
                                    price = quantity * unitPrice;
                                  }
                                  
                                  if (order.confirmation) {
                                    const confirmationPrice = order.confirmation.totalPrice || order.confirmation.total_price;
                                    if (confirmationPrice) {
                                      price = parseFloat(confirmationPrice) || price;
                                    }
                                  }
                                  
                                  const orderDate = order.orderDate || order.order_date || '';
                                  const formattedDate = orderDate ? new Date(orderDate).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  }) : '';
                                  
                                  const formattedPrice = price > 0 ? new Intl.NumberFormat('vi-VN', {
                                    style: 'currency',
                                    currency: 'VND',
                                    minimumFractionDigits: 0
                                  }).format(price) : '';
                                  
                                  return {
                                    id: `ORD-${order.orderId || order.order_id}`,
                                    orderId: order.orderId || order.order_id,
                                    vehicle: vehicleName,
                                    price: formattedPrice,
                                    status: order.status || 'Pending',
                                    createdDate: formattedDate,
                                    rawDate: orderDate
                                  };
                                });
                                setOrders(transformedOrders);
                              } else {
                                setOrders([]);
                              }
                            } catch (error) {
                              console.error('Error refreshing orders:', error);
                            } finally {
                              setLoadingOrders(false);
                            }
                          }}
                          disabled={loadingOrders}
                          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                          title="Refresh orders"
                        >
                          <RefreshCw className={`w-4 h-4 ${loadingOrders ? 'animate-spin' : ''}`} />
                          <span className="text-sm">Refresh</span>
                        </button>
                        <button 
                          onClick={() => {
                            if (!customerId || !customer) {
                              alert('Customer information is not available. Please refresh the page.');
                              return;
                            }
                            // Navigate to order form with customer pre-filled
                            navigate('/staff/sales/order-form', {
                              state: {
                                fromCustomerDetail: true,
                                customerId: customerId,
                                customer: {
                                  customerId: customer.customerId || customerId,
                                  name: customer.name,
                                  email: customer.email,
                                  phone: customer.phoneNumber || customer.phone,
                                  phoneNumber: customer.phoneNumber || customer.phone,
                                  address: customer.address
                                },
                                returnUrl: `/staff/customers/${customerIdParam}` // Return to this page after creating order
                              }
                            });
                          }}
                          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm font-medium">Create New Order</span>
                      </button>
                      </div>
                    </div>

                    {loadingOrders ? (
                      <div className="text-center py-8">
                        <p className="text-gray-600">Loading orders...</p>
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-600">No orders found for this customer.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Order ID</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Vehicle</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Created</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Action</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {orders.map((order) => (
                              <tr key={order.id} className="hover:bg-gray-50">
                                <td className="px-4 py-4 text-sm font-medium text-gray-900">{order.id}</td>
                                <td className="px-4 py-4 text-sm text-gray-700">{order.vehicle}</td>
                                <td className="px-4 py-4">{getQuoteStatusBadge(order.status)}</td>
                                <td className="px-4 py-4 text-sm text-gray-700">{order.createdDate}</td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center space-x-2">
                                    <button className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors">
                                      <Eye className="w-4 h-4 text-blue-600" />
                                    </button>
                                    {(order.status === 'Pending' || order.status === 'pending') && (
                                      <button className="p-1.5 hover:bg-green-50 rounded-lg transition-colors">
                                        <Edit className="w-4 h-4 text-green-600" />
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
                )}

                {/* Test Drives Tab */}
                {activeTab === 'testdrives' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Test Drive Schedule</h3>
                      <button onClick={async ()=>{
                        setScheduleError('');
                        const serialsFromModels = Array.from(new Set(
                          vehiclesData.flatMap(m => (Array.isArray(m.lists)? m.lists: []).map(v => v.serialId || v.serial_id).filter(Boolean))
                        ));
                        if (serialsFromModels.length > 0) {
                          setAvailableSerials(serialsFromModels);
                        } else {
                          const variants = await fetchAllVariants();
                          const serials = Array.from(new Set((variants || []).map(v => v.serialId || v.serial_id).filter(Boolean)));
                          setAvailableSerials(serials);
                        }
                        setShowScheduleModal(true);
                      }} className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
                        <Plus className="w-4 h-4" />
                        <span className="text-sm font-medium">Schedule Test Drive</span>
                      </button>
                    </div>

                    {loadingTestDrives ? (
                      <div className="text-center py-8">
                        <p className="text-gray-600">Loading test drives...</p>
                      </div>
                    ) : testDrives.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-600">No test drives scheduled for this customer.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">TestDrive ID</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Serial</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Vehicle</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Date</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                              {/* Read-only in Customer Detail; no actions column */}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {testDrives.map((drive, index) => (
                              <tr key={drive.appointmentId || index} className="hover:bg-gray-50">
                                <td className="px-4 py-4 text-sm font-medium text-gray-900">
                                  {drive.appointmentId !== 'N/A' ? `TD-${drive.appointmentId}` : 'N/A'}
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-700">{drive.serialId || 'N/A'}</td>
                                <td className="px-4 py-4 text-sm text-gray-700">{drive.vehicleName || 'N/A'}</td>
                                <td className="px-4 py-4 text-sm text-gray-700">{drive.date || 'N/A'}</td>
                                <td className="px-4 py-4">{getTestDriveStatusBadge(drive.status || 'Scheduled')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Feedback Tab */}
                {activeTab === 'feedback' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Feedback & Complaints</h3>
                    </div>

                    {loadingFeedbacks ? (
                      <div className="text-center py-8">
                        <p className="text-gray-600">Loading feedback...</p>
                      </div>
                    ) : feedbacks.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-600">No feedback found for this customer.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Date</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Type</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Feedback</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Rating</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Category</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {feedbacks.map((feedback, index) => {
                              const feedbackDate = feedback.date || feedback.feedbackDate || 'N/A';
                              const feedbackType = feedback.type || 'Feedback';
                              const feedbackContent = feedback.content || feedback.feedbackContent || 'N/A';
                              const feedbackRating = feedback.rating || 0;
                              const feedbackCategory = feedback.category || 'N/A';
                              
                              return (
                                <tr key={feedback.id || index} className="hover:bg-gray-50">
                                  <td className="px-4 py-4 text-sm text-gray-700">{feedbackDate}</td>
                                  <td className="px-4 py-4">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                                      feedbackType === 'Feedback' 
                                        ? 'bg-blue-100 text-blue-700 border-blue-200'
                                        : 'bg-red-100 text-red-700 border-red-200'
                                    }`}>
                                      {feedbackType}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700">{feedbackContent}</td>
                                  <td className="px-4 py-4">
                                    <div className="flex items-center">
                                      {[...Array(5)].map((_, i) => (
                                        <svg
                                          key={i}
                                          className={`w-4 h-4 ${
                                            i < feedbackRating ? 'text-yellow-400' : 'text-gray-300'
                                          }`}
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                      ))}
                                      <span className="ml-2 text-sm text-gray-600">({feedbackRating})</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700">{feedbackCategory}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                    </div>
                        </div>
                      </div>
        </div>
      </div>
    </Layout>
  );
};

export default CustomerDetail;

