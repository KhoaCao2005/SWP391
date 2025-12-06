import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import Layout from '../layout/Layout';
import { viewOrdersByCustomerId } from '../../staff/services/orderService';
import { getCustomerById, getTestDrivesByCustomerId } from '../../staff/services/customerDetailService';
import { getFeedbackByCustomer, createFeedback } from '../services/feedbackService';
import { fetchInventory } from '../../staff/services/inventoryService';
import { getCompletedPayments, getCustomersWithActiveInstallments } from '../../staff/services/paymentService';
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
  RefreshCw,
  Users,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  X
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
  const [paymentMap, setPaymentMap] = useState(new Map()); // orderId -> amount
  const [showCreateFeedbackModal, setShowCreateFeedbackModal] = useState(false);
  const [creatingFeedback, setCreatingFeedback] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ orderId: '', type: 'Feedback', status: 'New', content: '' });

  const normalizeTestDriveStatus = (status) => {
    if (!status) return 'Pending';
    const base = status.includes('_') ? status.substring(0, status.lastIndexOf('_')) : status;
    const normalized = base.toLowerCase();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

  const formatTestDriveDate = (value) => {
    if (!value) return 'N/A';
    try {
      return new Date(value).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return value;
    }
  };

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

  // Fetch payments to get order amounts
  useEffect(() => {
    const fetchPayments = async () => {
      if (!customerId) return;
      
      try {
        console.log('💰 Fetching payments for customer:', customerId);
        const paymentAmountMap = new Map();
        
        // Fetch completed payments (TT - full payments)
        const completedPaymentsResult = await getCompletedPayments();
        if (completedPaymentsResult.success && completedPaymentsResult.data) {
          console.log('💰 Completed payments result:', completedPaymentsResult.data);
          completedPaymentsResult.data.forEach(payment => {
            const orderId = payment.orderId || payment.order_id;
            const customerIdFromPayment = payment.customerId || payment.customer_id;
            
            // Only add if it matches our customer
            if (orderId && customerIdFromPayment === customerId) {
              const amount = parseFloat(payment.totalAmount || payment.amount || 0);
              if (amount > 0) {
                paymentAmountMap.set(orderId, amount);
                console.log(`💰 Added payment for order ${orderId}: ${amount}`);
              }
            }
          });
        }
        
        // Fetch installment payments
        const installmentsResult = await getCustomersWithActiveInstallments();
        if (installmentsResult.success && installmentsResult.data) {
          console.log('💰 Installment payments result:', installmentsResult.data);
          installmentsResult.data.forEach(payment => {
            const orderId = payment.orderId || payment.order_id;
            const customerIdFromPayment = payment.customerId || payment.customer_id;
            
            // Only add if it matches our customer
            if (orderId && customerIdFromPayment === customerId) {
              const amount = parseFloat(payment.totalAmount || payment.amount || 0);
              if (amount > 0) {
                // Use existing amount or add if not exists
                if (!paymentAmountMap.has(orderId)) {
                  paymentAmountMap.set(orderId, amount);
                  console.log(`💰 Added installment payment for order ${orderId}: ${amount}`);
                }
              }
            }
          });
        }
        
        console.log(`✅ Payment map created with ${paymentAmountMap.size} entries:`, Array.from(paymentAmountMap.entries()));
        setPaymentMap(paymentAmountMap);
      } catch (error) {
        console.error('❌ Error fetching payments:', error);
      }
    };
    
    fetchPayments();
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
        console.log('📦 Customer Detail - Orders fetched:', {
          customerId: customerIdParam,
          ordersCount: result.data?.length || 0,
          orders: result.data
        });
        
        // Handle response - check if data exists and is an array
        const ordersData = result.data;
        const isArray = Array.isArray(ordersData);
        const hasOrders = isArray && ordersData && ordersData.length > 0;
        
        if (result.success && hasOrders) {
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
            
            // Use payment amount from order.payment if available
            if ((price === 0 || !price) && order.payment) {
              const paymentAmount = parseFloat(order.payment.amount || order.payment.totalAmount || 0);
              if (paymentAmount > 0) {
                price = paymentAmount;
                console.log(`💰 Using payment.amount from order ${order.orderId || order.order_id}: ${price}`);
              }
            }
            
            // Use payment map if detail/confirmation/payment price is not available
            if (price === 0 || !price) {
              const orderId = order.orderId || order.order_id;
              if (orderId && paymentMap.has(orderId)) {
                price = paymentMap.get(orderId);
                console.log(`💰 Using payment map amount for order ${orderId}: ${price}`);
              }
            }
            
            // Get order status
            const orderStatus = order.status || 'Pending';
            const isCancelled = isCancelledOrder(orderStatus);
            
            // If order is cancelled, set amount to 0 for revenue calculations
            // but still show the price in the display if it exists
            const displayPrice = price; // Keep original price for display
            const revenueAmount = isCancelled ? 0 : price; // Use 0 for cancelled orders in calculations
            
            // Format date
            const orderDate = order.orderDate || order.order_date || '';
            const formattedDate = orderDate ? new Date(orderDate).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            }) : '';
            
            // Format price for display (show price even for cancelled orders)
            const formattedPrice = displayPrice > 0 ? new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
              minimumFractionDigits: 0
            }).format(displayPrice) : '';
            
            return {
              id: `ORD-${order.orderId || order.order_id}`,
              orderId: order.orderId || order.order_id,
              vehicle: vehicleName,
              price: formattedPrice,
              amount: revenueAmount, // Use 0 for cancelled orders in revenue calculations
              status: orderStatus,
              createdDate: formattedDate,
              rawDate: orderDate,
              dealerStaffId: order.dealerStaffId || order.dealer_staff_id || null,
              rawOrder: order // Keep raw order for reference
            };
          });
          
          console.log('✅ Transformed orders with amounts:', transformedOrders.map(o => ({ id: o.id, amount: o.amount })));
          setOrders(transformedOrders);
          } else {
          setOrders([]);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        setOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    };
    
    // Fetch orders immediately when customerId changes, don't wait for vehicleMap
    // Vehicle names will be updated when vehicleMap loads
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, customerIdParam, paymentMap]); // Include paymentMap so orders update when payments are loaded

  // Update vehicle names when vehicleMap loads
  useEffect(() => {
    if (vehicleMap.size > 0 && customerId && orders.length > 0) {
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
              
              // Use payment amount from order.payment if available
              if ((price === 0 || !price) && order.payment) {
                const paymentAmount = parseFloat(order.payment.amount || order.payment.totalAmount || 0);
                if (paymentAmount > 0) {
                  price = paymentAmount;
                }
              }
              
              // Use payment map if detail/confirmation/payment price is not available
              if (price === 0 || !price) {
                const orderId = order.orderId || order.order_id;
                if (orderId && paymentMap.has(orderId)) {
                  price = paymentMap.get(orderId);
                }
              }
              
              // Get order status
              const orderStatus = order.status || 'Pending';
              const isCancelled = isCancelledOrder(orderStatus);
              
              // If order is cancelled, set amount to 0 for revenue calculations
              const displayPrice = price;
              const revenueAmount = isCancelled ? 0 : price;
              
              const orderDate = order.orderDate || order.order_date || '';
              const formattedDate = orderDate ? new Date(orderDate).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              }) : '';
              
              const formattedPrice = displayPrice > 0 ? new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
                minimumFractionDigits: 0
              }).format(displayPrice) : '';
              
          return {
                id: `ORD-${order.orderId || order.order_id}`,
            orderId: order.orderId || order.order_id,
            vehicle: vehicleName,
                price: formattedPrice,
                amount: revenueAmount, // Use 0 for cancelled orders
                status: orderStatus,
                createdDate: formattedDate,
                rawDate: orderDate,
            dealerStaffId: order.dealerStaffId || order.dealer_staff_id || null,
                rawOrder: order // Keep raw order for reference
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleMap, customerId, paymentMap]);

  // Update order amounts when paymentMap is loaded/updated
  useEffect(() => {
    if (paymentMap.size > 0 && orders.length > 0) {
      console.log('💰 Updating order amounts from payment map...');
      const updatedOrders = orders.map(order => {
        // Skip cancelled orders - they should have 0 amount for revenue calculations
        if (isCancelledOrder(order.status)) {
          // Ensure cancelled orders have 0 amount
          if (order.amount !== 0) {
            return {
              ...order,
              amount: 0
            };
          }
          return order;
        }
        
        // If order has no amount or amount is 0, try to get from paymentMap
        if (!order.amount || order.amount === 0) {
          const orderId = order.orderId;
          if (orderId && paymentMap.has(orderId)) {
            const amount = paymentMap.get(orderId);
            const formattedPrice = amount > 0 ? new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
              minimumFractionDigits: 0
            }).format(amount) : '';
            
            return {
              ...order,
              amount: amount,
              price: formattedPrice
            };
          }
        }
        return order;
      });
      
      // Only update if there are changes
      const hasChanges = updatedOrders.some((order, index) => 
        order.amount !== orders[index].amount
      );
      
      if (hasChanges) {
        console.log('✅ Updated orders with payment amounts');
        setOrders(updatedOrders);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMap]);

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
              date: formatTestDriveDate(
                drive.date || drive.scheduleDate || drive.schedule_at || drive.test_drive_date || ''
              ),
              status: normalizeTestDriveStatus(drive.status || drive.statusName || 'Pending'),
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
        const result = await getFeedbackByCustomer(customerId);
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

  // Helper function to mask phone number
  const maskPhone = (phone) => {
    if (!phone || phone.length < 4) return phone || 'N/A';
    return phone.substring(0, phone.length - 2).replace(/\d/g, (d, i) => i > 3 ? '*' : d) + phone.substring(phone.length - 2);
  };

  // Helper function to check if order is cancelled
  const isCancelledOrder = (status) => {
    if (!status) return false;
    const statusLower = status.toLowerCase().trim();
    return statusLower === 'cancelled' || statusLower === 'canceled' || statusLower === 'cancel';
  };

  // Helper functions for customer analytics
  const getCustomerAnalytics = () => {
    if (!orders || orders.length === 0) {
      return {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        staffCount: 0,
        staffList: [],
        staffStats: {},
        firstOrderDate: null,
        lastOrderDate: null,
        customerSegment: 'New'
      };
    }

    // Filter out cancelled orders for revenue calculations
    const activeOrders = orders.filter(order => !isCancelledOrder(order.status));
    
    const totalOrders = orders.length; // Total orders includes cancelled
    const totalRevenue = activeOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
    const activeOrderCount = activeOrders.length;
    const averageOrderValue = activeOrderCount > 0 ? totalRevenue / activeOrderCount : 0;

    // Get unique staff members (from active orders only for revenue, but count all orders for staff assignment)
    const staffSet = new Set();
    const staffStats = {};
    orders.forEach(order => {
      const staffId = order.dealerStaffId;
      if (staffId) {
        staffSet.add(staffId);
        if (!staffStats[staffId]) {
          staffStats[staffId] = { orderCount: 0, revenue: 0 };
        }
        // Count all orders for staff (including cancelled)
        staffStats[staffId].orderCount += 1;
        // Only add revenue from non-cancelled orders
        if (!isCancelledOrder(order.status)) {
          staffStats[staffId].revenue += (order.amount || 0);
        }
      }
    });

    const staffList = Array.from(staffSet).map(staffId => ({
      staffId: staffId,
      orderCount: staffStats[staffId].orderCount,
      revenue: staffStats[staffId].revenue
    })).sort((a, b) => b.orderCount - a.orderCount); // Sort by order count

    // Get first and last order dates (from active orders only)
    const activeDates = activeOrders
      .map(order => order.rawDate)
      .filter(date => date)
      .sort();
    const firstOrderDate = activeDates.length > 0 ? activeDates[0] : null;
    const lastOrderDate = activeDates.length > 0 ? activeDates[activeDates.length - 1] : null;

    // Determine customer segment based on active orders only
    let customerSegment = 'New';
    if (activeOrderCount >= 5) {
      customerSegment = 'VIP';
    } else if (activeOrderCount >= 2) {
      customerSegment = 'Regular';
    }

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      staffCount: staffSet.size,
      staffList,
      staffStats,
      firstOrderDate,
      lastOrderDate,
      customerSegment
    };
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '₫0';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const analytics = getCustomerAnalytics();

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
              onClick={() => navigate('/manager/customers/list')}
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
          <button onClick={() => navigate('/manager/dashboard')} className="hover:text-blue-600">
            Dashboard
          </button>
          <ChevronRight className="w-3 h-3 mx-1" />
          <button onClick={() => navigate('/manager/customers/list')} className="hover:text-blue-600">
            Customers
          </button>
          <ChevronRight className="w-3 h-3 mx-1" />
          <span className="text-gray-900 font-medium">Customer Detail</span>
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate('/manager/customers/list')}
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

              {/* Quick Stats */}
              <div className="mb-4 pb-4 border-b border-gray-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Total Orders</span>
                  <span className="font-semibold text-gray-900">{analytics.totalOrders}</span>
                    </div>
                {analytics.staffCount > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Staff Members</span>
                    <span className="font-semibold text-gray-900">{analytics.staffCount}</span>
                    </div>
                  )}
                {analytics.lastOrderDate && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Last Order</span>
                    <span className="font-semibold text-gray-900">{formatDate(analytics.lastOrderDate)}</span>
                </div>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Segment</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    analytics.customerSegment === 'VIP' 
                      ? 'bg-yellow-100 text-yellow-800'
                      : analytics.customerSegment === 'Regular'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {analytics.customerSegment}
                  </span>
                </div>
                  </div>

              {/* Quick Actions */}
              <div className="space-y-1.5">
                <button className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors text-sm">
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
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-gray-900">Customer Information</h3>
                      <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-800">
                        <Edit className="w-3 h-3" />
                        <span className="text-xs font-medium">Edit Info</span>
                      </button>
                    </div>

                    {/* Customer Analytics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Total Orders</p>
                            <p className="text-2xl font-bold text-blue-900">{analytics.totalOrders}</p>
                          </div>
                          <ShoppingCart className="w-8 h-8 text-blue-600 opacity-50" />
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Total Revenue</p>
                            <p className="text-lg font-bold text-green-900">{formatCurrency(analytics.totalRevenue)}</p>
                          </div>
                          <DollarSign className="w-8 h-8 text-green-600 opacity-50" />
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Avg Order Value</p>
                            <p className="text-lg font-bold text-purple-900">{formatCurrency(analytics.averageOrderValue)}</p>
                          </div>
                          <TrendingUp className="w-8 h-8 text-purple-600 opacity-50" />
                        </div>
                      </div>
                    </div>

                    {/* Customer Segment Badge */}
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-600">Customer Segment:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        analytics.customerSegment === 'VIP' 
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                          : analytics.customerSegment === 'Regular'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-gray-100 text-gray-800 border border-gray-300'
                      }`}>
                        {analytics.customerSegment}
                      </span>
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

                    {/* Staff Overview */}
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center space-x-2 mb-3">
                        <Users className="w-4 h-4 text-blue-600" />
                        <h4 className="font-medium text-sm text-gray-900">Staff Overview</h4>
                        </div>
                      <div className="space-y-2">
                        {analytics.staffCount > 0 ? (
                          <>
                            <p className="text-xs text-gray-600">
                              This customer has been served by <strong>{analytics.staffCount}</strong> staff member{analytics.staffCount !== 1 ? 's' : ''}:
                            </p>
                            <div className="grid grid-cols-1 gap-2">
                              {analytics.staffList.map((staff, index) => (
                                <div key={staff.staffId} className="bg-white rounded-lg p-2 border border-blue-100">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-xs font-semibold text-blue-700">{index + 1}</span>
                                      </div>
                                      <span className="text-sm font-medium text-gray-900">Staff #{staff.staffId}</span>
                                    </div>
                                    <div className="flex items-center space-x-3 text-xs text-gray-600">
                                      <span>{staff.orderCount} order{staff.orderCount !== 1 ? 's' : ''}</span>
                                      <span className="text-green-600 font-medium">{formatCurrency(staff.revenue)}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <p className="text-xs text-gray-500">No staff assigned yet</p>
                        )}
                      </div>
                    </div>

                    {/* Order Timeline */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="font-medium text-sm text-gray-900 mb-2">Order Timeline</h4>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                        <div>
                          <label className="text-xs text-gray-600">First Order</label>
                          <p className="text-xs font-medium text-gray-900">
                            {analytics.firstOrderDate ? formatDate(analytics.firstOrderDate) : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Last Order</label>
                          <p className="text-xs font-medium text-gray-900">
                            {analytics.lastOrderDate ? formatDate(analytics.lastOrderDate) : 'N/A'}
                          </p>
                        </div>
                      </div>
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
                              // Refresh payments first to get latest amounts
                              console.log('💰 Refreshing payments...');
                              const paymentAmountMap = new Map();
                              
                              // Fetch completed payments (TT - full payments)
                              const completedPaymentsResult = await getCompletedPayments();
                              if (completedPaymentsResult.success && completedPaymentsResult.data) {
                                completedPaymentsResult.data.forEach(payment => {
                                  const orderId = payment.orderId || payment.order_id;
                                  const customerIdFromPayment = payment.customerId || payment.customer_id;
                                  if (orderId && customerIdFromPayment === customerId) {
                                    const amount = parseFloat(payment.totalAmount || payment.amount || 0);
                                    if (amount > 0) {
                                      paymentAmountMap.set(orderId, amount);
                                    }
                                  }
                                });
                              }
                              
                              // Fetch installment payments
                              const installmentsResult = await getCustomersWithActiveInstallments();
                              if (installmentsResult.success && installmentsResult.data) {
                                installmentsResult.data.forEach(payment => {
                                  const orderId = payment.orderId || payment.order_id;
                                  const customerIdFromPayment = payment.customerId || payment.customer_id;
                                  if (orderId && customerIdFromPayment === customerId) {
                                    const amount = parseFloat(payment.totalAmount || payment.amount || 0);
                                    if (amount > 0 && !paymentAmountMap.has(orderId)) {
                                      paymentAmountMap.set(orderId, amount);
                                    }
                                  }
                                });
                              }
                              
                              setPaymentMap(paymentAmountMap);
                              console.log(`✅ Refreshed payment map with ${paymentAmountMap.size} entries`);
                              
                              // Then refresh orders
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
                                  
                                  // Use payment amount from order.payment if available
                                  if ((price === 0 || !price) && order.payment) {
                                    const paymentAmount = parseFloat(order.payment.amount || order.payment.totalAmount || 0);
                                    if (paymentAmount > 0) {
                                      price = paymentAmount;
                                    }
                                  }
                                  
                                  // Use payment map if detail/confirmation/payment price is not available
                                  if (price === 0 || !price) {
                                    const orderId = order.orderId || order.order_id;
                                    if (orderId && paymentAmountMap.has(orderId)) {
                                      price = paymentAmountMap.get(orderId);
                                      console.log(`💰 Refresh: Using payment map amount for order ${orderId}: ${price}`);
                                    }
                                  }
                                  
                                  // Get order status
                                  const orderStatus = order.status || 'Pending';
                                  const isCancelled = isCancelledOrder(orderStatus);
                                  
                                  // If order is cancelled, set amount to 0 for revenue calculations
                                  const displayPrice = price;
                                  const revenueAmount = isCancelled ? 0 : price;
                                  
                                  const orderDate = order.orderDate || order.order_date || '';
                                  const formattedDate = orderDate ? new Date(orderDate).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  }) : '';
                                  
                                  const formattedPrice = displayPrice > 0 ? new Intl.NumberFormat('vi-VN', {
                                    style: 'currency',
                                    currency: 'VND',
                                    minimumFractionDigits: 0
                                  }).format(displayPrice) : '';
                                  
                                  return {
                                    id: `ORD-${order.orderId || order.order_id}`,
                                    orderId: order.orderId || order.order_id,
                                    vehicle: vehicleName,
                                    price: formattedPrice,
                                    amount: revenueAmount, // Use 0 for cancelled orders
                                    status: orderStatus,
                                    createdDate: formattedDate,
                                    rawDate: orderDate,
                                    dealerStaffId: order.dealerStaffId || order.dealer_staff_id || null,
                                    rawOrder: order // Keep raw order for reference
                                  };
                                });
                                console.log('✅ Refreshed orders with amounts:', transformedOrders.map(o => ({ id: o.id, amount: o.amount })));
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
                            navigate('/manager/sales/order-form', {
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
                                returnUrl: `/manager/customers/${customerIdParam}` // Return to this page after creating order
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
                      <>
                        {/* Staff Overview Summary */}
                        {analytics.staffCount > 0 && (
                          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Users className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium text-gray-900">
                                  Orders from {analytics.staffCount} staff member{analytics.staffCount !== 1 ? 's' : ''}:
                                </span>
                                <span className="text-xs text-gray-600">
                                  {analytics.staffList.map(s => `Staff #${s.staffId}`).join(', ')}
                                </span>
                                </div>
                              <span className="text-xs text-gray-500">
                                Total: {analytics.totalOrders} orders • {formatCurrency(analytics.totalRevenue)}
                              </span>
                              </div>
                            </div>
                        )}

                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Order ID</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Vehicle</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Created</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Staff</th>
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
                                    {order.dealerStaffId ? (
                                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                        Staff #{order.dealerStaffId}
                                    </span>
                                    ) : (
                                      <span className="text-xs text-gray-400">N/A</span>
                                  )}
                                </td>
                                  <td className="px-4 py-4">
                                    <button
                                      onClick={() => {
                                        // Navigate to order detail or open modal
                                        console.log('View order:', order);
                                      }}
                                      className="text-blue-600 hover:text-blue-900 p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                                      title="View order details"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      </>
                    )}
                  </div>
                )}

                {/* Test Drives Tab */}
                {activeTab === 'testdrives' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Test Drive Schedule</h3>
                      <button className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
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
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Vehicle</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Date</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {testDrives.map((drive, index) => (
                              <tr key={drive.appointmentId || index} className="hover:bg-gray-50">
                                <td className="px-4 py-4 text-sm font-medium text-gray-900">
                                  {drive.appointmentId !== 'N/A' ? `TD-${drive.appointmentId}` : 'N/A'}
                                </td>
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
                      <button
                        onClick={() => {
                          setFeedbackForm({ orderId: '', type: 'Feedback', status: 'New', content: '' });
                          setShowCreateFeedbackModal(true);
                        }}
                        className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm font-medium">Create Feedback</span>
                      </button>
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
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Feedback ID</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Order ID</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Type</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Content</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Date</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {feedbacks.map((feedback, index) => {
                              const feedbackId = feedback.feedbackId || feedback.feedback_id || feedback.id || `FB-${index + 1}`;
                              const orderId = feedback.orderId || feedback.order_id || 'N/A';
                              const feedbackType = feedback.type || 'Feedback';
                              const feedbackStatus = feedback.status || 'New';
                              const feedbackContent = feedback.content || 'N/A';
                              const feedbackDate = feedback.createdAt || feedback.created_at || feedback.date || 'N/A';
                              
                              return (
                                <tr key={feedbackId} className="hover:bg-gray-50">
                                  <td className="px-4 py-4 text-sm font-medium text-gray-900">{feedbackId}</td>
                                  <td className="px-4 py-4 text-sm text-gray-700">{orderId}</td>
                                  <td className="px-4 py-4">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                                      feedbackType === 'Feedback' 
                                        ? 'bg-blue-100 text-blue-700 border-blue-200'
                                        : 'bg-red-100 text-red-700 border-red-200'
                                    }`}>
                                      {feedbackType}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                                      feedbackStatus === 'Resolved' 
                                        ? 'bg-green-100 text-green-700 border-green-200'
                                        : feedbackStatus === 'Assigned'
                                        ? 'bg-blue-100 text-blue-700 border-blue-200'
                                        : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                    }`}>
                                      {feedbackStatus}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700 max-w-xs truncate" title={feedbackContent}>
                                    {feedbackContent}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700">
                                    {feedbackDate !== 'N/A' ? formatDate(feedbackDate) : 'N/A'}
                                  </td>
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

      {/* Create Feedback Modal */}
      {showCreateFeedbackModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Create Feedback</h3>
              <button 
                onClick={() => setShowCreateFeedbackModal(false)} 
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!customerId || !feedbackForm.orderId || !feedbackForm.content) {
                  alert('Please fill in all required fields');
                  return;
                }
                setCreatingFeedback(true);
                try {
                  const res = await createFeedback({
                    customer_id: customerId,
                    order_id: feedbackForm.orderId,
                    type: feedbackForm.type,
                    content: feedbackForm.content,
                    status: feedbackForm.status
                  });
                  if (res.success) {
                    setShowCreateFeedbackModal(false);
                    setFeedbackForm({ orderId: '', type: 'Feedback', status: 'New', content: '' });
                    // Refresh feedback list
                    const result = await getFeedbackByCustomer(customerId);
                    if (result.success && result.data) {
                      setFeedbacks(result.data || []);
                    }
                  } else {
                    alert(res.message || 'Failed to create feedback');
                  }
                } catch (error) {
                  console.error('Error creating feedback:', error);
                  alert('Failed to create feedback');
                } finally {
                  setCreatingFeedback(false);
                }
              }}
              className="p-4 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                <div className="px-3 py-2 border border-gray-200 rounded bg-gray-50 text-sm">
                  {customer?.name || `Customer ${customerId}`} (ID: {customerId})
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order <span className="text-red-500">*</span></label>
                <select
                  value={feedbackForm.orderId}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, orderId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select order...</option>
                  {orders.map(order => {
                    const id = order.orderId || order.id?.replace('ORD-', '');
                    return (
                      <option key={id} value={id}>
                        Order #{id} - {order.vehicle} - {order.price}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={feedbackForm.type}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Feedback">Feedback</option>
                    <option value="Complaint">Complaint</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={feedbackForm.status}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="New">New</option>
                    <option value="Assigned">Assigned</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content <span className="text-red-500">*</span></label>
                <textarea
                  rows={4}
                  value={feedbackForm.content}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, content: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Write customer feedback/complaint..."
                />
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateFeedbackModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingFeedback}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-50 transition-colors"
                >
                  {creatingFeedback ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default CustomerDetail;
