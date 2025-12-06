import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../layout/Layout';
import { CreditCard, DollarSign, Edit2, TrendingDown, Users, TrendingUp, BarChart3, Search, AlertCircle, Loader2, Info, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
import { getCustomersWithActiveInstallments, getCompletedPayments, updateInstallmentPlan } from '../services/paymentService';
import { viewAllOrders } from '../services/orderService';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const Payment = () => {
  const [activeTab, setActiveTab] = useState('installments');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isEditPaymentModalOpen, setIsEditPaymentModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [staffFilter, setStaffFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [monthsToDeduct, setMonthsToDeduct] = useState(1);
  
  // Pagination states
  const [currentPageInstallments, setCurrentPageInstallments] = useState(1);
  const [currentPageCompleted, setCurrentPageCompleted] = useState(1);
  const itemsPerPage = 10;

  // API data states
  const [installmentPayments, setInstallmentPayments] = useState([]);
  const [completedPayments, setCompletedPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  
  // Map for orderId -> staff info (dealerStaffId, staffName)
  const [orderStaffMap, setOrderStaffMap] = useState(new Map());

  // Format currency helper function
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const normalizeInterestRate = (value) => {
    if (value === null || value === undefined) return null;

    const stringValue = value.toString().trim();
    if (!stringValue) return null;

    const cleanedValue = stringValue.replace('%', '');
    if (!cleanedValue) return null;

    const numeric = Number(cleanedValue);
    if (Number.isNaN(numeric)) return null;

    // If the rate is <= 1, assume it's provided as a decimal (e.g., 0.12 -> 12%)
    const percentage = Math.abs(numeric) <= 1 && !stringValue.includes('%')
      ? numeric * 100
      : numeric;

    return Number(percentage.toFixed(2));
  };

  const formatInterestRateDisplay = (rate) => {
    if (rate === null || rate === undefined) return 'N/A';

    const numeric = Number(rate);
    if (Number.isNaN(numeric)) return 'N/A';

    const displayValue = Number.isInteger(numeric) ? numeric : numeric.toFixed(2);
    return `${displayValue}%`;
  };

  const hasInterestRate = (rate) => {
    if (rate === null || rate === undefined) return false;
    if (typeof rate === 'string' && rate.trim() === '') return false;

    const numeric = Number(rate);
    return !Number.isNaN(numeric);
  };

  const normalizeId = (value) => {
    if (value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isNaN(n) ? value : n;
  };

  // Load order-staff mapping and then fetch payments
  useEffect(() => {
    const loadData = async () => {
      // First load order-staff map
      const map = await loadOrderStaffMap();
      // Update state
      setOrderStaffMap(map);
      // Then fetch payments with the map
      await fetchActiveInstallmentsWithMap(map);
      await fetchCompletedPaymentsWithMap(map);
    };
    loadData();
  }, []);

  // Load order-staff mapping from orders and staff accounts
  const loadOrderStaffMap = async () => {
    try {
      const token = localStorage.getItem('token');
      const isNgrokUrl = API_URL?.includes('ngrok');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      if (isNgrokUrl) {
        headers['ngrok-skip-browser-warning'] = 'true';
      }

      // Fetch all orders to get orderId -> dealerStaffId mapping
      // Note: We don't fetch from EVM API as manager doesn't have access (CORS error)
      // Backend should return dealerStaffName in orders response
      const ordersResult = await viewAllOrders();
      
      const map = new Map();
      if (ordersResult.success && ordersResult.data) {
        for (const order of ordersResult.data) {
          const orderId = normalizeId(order.orderId || order.order_id);
          const staffId = normalizeId(order.dealerStaffId || order.dealer_staff_id || order.salespersonId);
          // ✅ FIX: Prioritize dealerStaffName from backend response, only show username
          // Backend GetListOrderByDealerStaffId() returns dealerStaffName field
          const staffName = order.dealerStaffName || order.username || order.salespersonName || 
                          order.staffName || order.staffUsername || null;
          
          // Only add to map if we have a valid username (not "Staff {id}")
          if (orderId && staffId && staffName && !staffName.startsWith('Staff ')) {
            map.set(orderId, {
              staffId: staffId,
              staffName: staffName
            });
          } else if (orderId && staffId && staffName) {
            // If we have staffName but it's "Staff {id}", still add it but log warning
            map.set(orderId, {
              staffId: staffId,
              staffName: staffName
            });
          }
        }
        console.log(`✅ Loaded ${map.size} order-staff mappings`);
      }
      return map;
    } catch (err) {
      console.warn('⚠️ Could not load order-staff map:', err);
      // Return empty map
      return new Map();
    }
  };

  const fetchActiveInstallmentsWithMap = async (staffMap) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📥 Fetching active installments...');
      const result = await getCustomersWithActiveInstallments();
      console.log('📥 API Response:', result);
      
      if (result.success && result.data && Array.isArray(result.data)) {
        console.log(`✅ Received ${result.data.length} customers with active installments`);
        
        // Transform backend data to frontend format (same as staff)
        const transformed = result.data.map((customer) => {
          const planId = customer.planId || null;
          const rawInterestRate = customer.interestRate ?? customer.interest_rate ?? customer.rate ??
                                  customer.installmentInterestRate ?? customer.planInterestRate ??
                                  customer.plan_rate ?? customer.InterestRate;
          const interestRate = normalizeInterestRate(rawInterestRate);
          const termMonth = customer.termMonth ? parseInt(customer.termMonth) : null;
          const monthlyPay = parseFloat(customer.monthlyPay || 0);
          const status = customer.status || 'ACTIVE';
          const outstandingAmount = parseFloat(customer.outstandingAmount || 0);
          
          const paymentId = customer.paymentId || null;
          const orderId = normalizeId(customer.orderId || customer.order_id);
          const totalAmount = parseFloat(customer.totalAmount || 0);
          const paymentDate = customer.paymentDate || null;
          const method = customer.method || 'TG';
          
          const paidAmount = totalAmount > 0 ? Math.max(0, totalAmount - outstandingAmount) : 0;
          
          // Get staff info from order-staff map based on orderId
          let salespersonId = null;
          let salesperson = 'N/A';
          
            const mapToUse = staffMap || orderStaffMap;
            if (orderId && mapToUse.has(orderId)) {
              const staffInfo = mapToUse.get(orderId);
              salespersonId = staffInfo.staffId;
              salesperson = staffInfo.staffName;
            } else {
              // Fallback: try to get from customer data directly
              salespersonId = customer.salespersonId || customer.staffId || customer.dealerStaffId || customer.dealer_staff_id || null;
              // ✅ FIX: Only show username, not "Staff {id}"
              salesperson = customer.dealerStaffName || customer.salespersonName || customer.staffName || 
                           customer.username || customer.staffUsername || 'N/A';
            }
          
          return {
            customerId: customer.customerId,
            customerName: customer.name || 'N/A',
            customerEmail: customer.email || 'N/A',
            customerPhone: customer.phoneNumber || 'N/A',
            customerAddress: customer.address || 'N/A',
            paymentId: paymentId || null,
            orderId: orderId || null,
            totalAmount: totalAmount || 0,
            paidAmount: paidAmount,
            outstandingAmount: outstandingAmount,
            paymentDate: paymentDate || null,
            method: method,
            planId: planId,
            currentTermMonth: termMonth,
            monthlyPay: monthlyPay,
            interestRate: interestRate,
            status: status,
            salesperson: salesperson,
            salespersonId: salespersonId
          };
        });
        
        console.log('✅ Transformed data:', transformed);
        setInstallmentPayments(transformed);
      } else {
        setInstallmentPayments([]);
        if (result.message) {
          setError(result.message);
        } else if (!result.success) {
          setError('Failed to retrieve installment payments');
        } else {
          setError(null);
        }
      }
    } catch (err) {
      console.error('❌ Error fetching active installments:', err);
      setError(err.message || 'Failed to load installment payments.');
      setInstallmentPayments([]);
    } finally {
      setLoading(false);
    }
  };

  // Wrapper functions for backward compatibility
  const fetchActiveInstallments = async () => {
    await fetchActiveInstallmentsWithMap(orderStaffMap);
  };

  const fetchCompletedPayments = async () => {
    await fetchCompletedPaymentsWithMap(orderStaffMap);
  };

  const fetchCompletedPaymentsWithMap = async (staffMap) => {
    try {
      console.log('📥 Fetching completed payments (TT) from backend...');
      const result = await getCompletedPayments();
      console.log('📥 Completed Payments API Response:', result);
      
      if (result.success && result.data && result.data.length > 0) {
        const transformedData = result.data.map((payment) => {
          // Get staff info from order-staff map based on orderId
          const orderId = normalizeId(payment.orderId || payment.order_id || null);
          let salespersonId = null;
          let salesperson = 'N/A';

          const rawInterestRate = payment.interestRate ?? payment.interest_rate ?? payment.rate ??
                                  payment.installmentInterestRate ?? payment.planInterestRate ??
                                  payment.ttInterestRate ?? payment.InterestRate;
          const interestRate = normalizeInterestRate(rawInterestRate);

          const mapToUse = staffMap || orderStaffMap;
          if (orderId && mapToUse.has(orderId)) {
            const staffInfo = mapToUse.get(orderId);
            salespersonId = staffInfo.staffId;
            salesperson = staffInfo.staffName;
          } else {
            // Fallback: try to get from payment data directly
            salespersonId = payment.salespersonId || payment.staffId || payment.dealerStaffId || payment.dealer_staff_id || null;
            // ✅ FIX: Only show username, not "Staff {id}"
            salesperson = payment.dealerStaffName || payment.salespersonName || payment.staffName || 
                         payment.username || payment.staffUsername || 'N/A';
          }

          // Robust amount mapping
          const rawAmount = payment.amount ?? payment.totalAmount ?? payment.total_amount ??
                            payment.price ?? payment.paymentAmount ?? payment.paidAmount ?? 0;
          const amount = Number(rawAmount) || 0;

          // Vehicle mapping across possible keys
          const vehicle = payment.vehicle || payment.vehicleName || payment.vehicle_name ||
                          payment.modelName || payment.model_name || payment.model || 'N/A';

          // Dates can come in multiple fields
          const paymentDate = payment.paymentDate || payment.payment_date || payment.date || payment.createdAt || payment.created_at || null;

          // Method normalization (TT/TG)
          const method = (payment.method || payment.paymentMethod || payment.payment_method || 'TT').toString().toUpperCase();
          
          return {
            paymentId: payment.paymentId || payment.payment_id,
            orderId: payment.orderId || payment.order_id,
            customerName: payment.name || payment.customerName || payment.customer_name || 'N/A',
            customerId: payment.customerId || payment.customer_id,
            customerAddress: payment.address || payment.customerAddress || 'N/A',
            amount: amount,
            paymentDate: paymentDate,
            method: method,
            phone: payment.phoneNumber || payment.phone || payment.customerPhone || 'N/A',
            email: payment.email || payment.customerEmail || 'N/A',
            vehicle: vehicle,
            salesperson: salesperson,
            salespersonId: salespersonId,
            interestRate: interestRate
          };
        });
        setCompletedPayments(transformedData);
        console.log(`✅ Loaded ${transformedData.length} completed payments (TT)`);
      } else {
        setCompletedPayments([]);
        console.log('ℹ️ No completed payments (TT) found');
      }
    } catch (err) {
      console.error('❌ Error fetching completed payments:', err);
      setCompletedPayments([]);
    }
  };

  // Get unique staff list from payments
  const staffList = [...new Set([
    ...installmentPayments.map(p => p.salesperson).filter(Boolean),
    ...completedPayments.map(p => p.salesperson).filter(Boolean)
  ])];

  // Filter installments
  const filteredInstallments = installmentPayments.filter(p => {
    if (staffFilter !== 'all' && p.salesperson !== staffFilter) return false;
    if (searchQuery && !p.orderId?.toString().toLowerCase().includes(searchQuery.toLowerCase()) && 
        !p.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !p.customerPhone?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Filter completed payments
  const filteredCompleted = completedPayments.filter(p => {
    if (staffFilter !== 'all' && p.salesperson !== staffFilter) return false;
    if (searchQuery && !p.orderId?.toString().toLowerCase().includes(searchQuery.toLowerCase()) && 
        !p.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !p.phone?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Pagination calculations for installments
  const totalPagesInstallments = Math.ceil(filteredInstallments.length / itemsPerPage);
  const startIndexInstallments = (currentPageInstallments - 1) * itemsPerPage;
  const endIndexInstallments = startIndexInstallments + itemsPerPage;
  const paginatedInstallments = filteredInstallments.slice(startIndexInstallments, endIndexInstallments);

  // Pagination calculations for completed
  const totalPagesCompleted = Math.ceil(filteredCompleted.length / itemsPerPage);
  const startIndexCompleted = (currentPageCompleted - 1) * itemsPerPage;
  const endIndexCompleted = startIndexCompleted + itemsPerPage;
  const paginatedCompleted = filteredCompleted.slice(startIndexCompleted, endIndexCompleted);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPageInstallments(1);
  }, [staffFilter, searchQuery, filteredInstallments.length]);

  useEffect(() => {
    setCurrentPageCompleted(1);
  }, [staffFilter, searchQuery, filteredCompleted.length]);

  // Handle page change for installments
  const handlePageChangeInstallments = (newPage) => {
    if (newPage >= 1 && newPage <= totalPagesInstallments) {
      setCurrentPageInstallments(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle page change for completed
  const handlePageChangeCompleted = (newPage) => {
    if (newPage >= 1 && newPage <= totalPagesCompleted) {
      setCurrentPageCompleted(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle view details
  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    setIsDetailsModalOpen(true);
  };

  // Handle edit payment (deduct months)
  const handleEditPayment = async (payment) => {
    setSelectedPayment(payment);
    setMonthsToDeduct(1);
    setIsEditPaymentModalOpen(true);
  };

  // Handle reduce 1 month (quick action from details modal)
  const handleReduceOneMonth = async () => {
    if (!selectedPayment) return;

    if (!selectedPayment.planId) {
      alert('⚠️ Cannot update payment: planId is missing.');
      return;
    }

    const currentTermMonth = selectedPayment.currentTermMonth;
    if (currentTermMonth === null || currentTermMonth === undefined || isNaN(currentTermMonth) || currentTermMonth <= 0) {
      alert('⚠️ Cannot reduce months: No remaining months or data is missing.');
      return;
    }

    setUpdating(true);
    
    try {
      const newTermMonth = Math.max(0, currentTermMonth - 1);
      const monthlyPay = selectedPayment.monthlyPay || 0;
      const currentOutstanding = selectedPayment.outstandingAmount || 0;
      const newOutstanding = Math.max(0, currentOutstanding - monthlyPay);
      
      let newStatus = 'ACTIVE';
      if (newTermMonth <= 0) {
        newStatus = 'PAID';
      } else {
        newStatus = selectedPayment.status === 'OVERDUE' || selectedPayment.status === 'Overdue' ? 'OVERDUE' : 'ACTIVE';
      }

      const result = await updateInstallmentPlan(
        selectedPayment.planId,
        newStatus,
        String(newTermMonth)
      );

      if (result.success) {
        const updatedPayment = {
          ...selectedPayment,
          currentTermMonth: newTermMonth,
          outstandingAmount: newOutstanding,
          status: newStatus,
          paidAmount: (selectedPayment.paidAmount || 0) + monthlyPay
        };
        setSelectedPayment(updatedPayment);
        
        setInstallmentPayments(prev => 
          prev.map(p => 
            p.customerId === selectedPayment.customerId 
              ? updatedPayment 
              : p
          )
        );

        alert(`✅ Successfully recorded 1 month payment!\n\n` +
              `Amount paid: ${formatCurrency(monthlyPay)}\n` +
              `Remaining months: ${newTermMonth > 0 ? newTermMonth : 0}\n` +
              `New outstanding: ${formatCurrency(newOutstanding)}`);
      } else {
        alert(`❌ Failed to update payment: ${result.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error reducing month:', err);
      alert('Failed to update payment. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  // Handle save payment deduction
  const handleSavePaymentDeduction = async () => {
    if (!selectedPayment) return;

    const months = parseInt(monthsToDeduct);
    if (months <= 0 || isNaN(months)) {
      alert('Please enter a valid number of months (greater than 0).');
      return;
    }

    if (!selectedPayment.planId) {
      alert('⚠️ Cannot update payment: planId is missing.');
      return;
    }

    const currentTermMonth = selectedPayment.currentTermMonth;
    if (currentTermMonth === null || currentTermMonth === undefined || isNaN(currentTermMonth)) {
      alert('⚠️ Cannot update payment: remaining months information is missing.');
      return;
    }

    if (months > currentTermMonth) {
      alert(`You cannot record more than ${currentTermMonth} months (remaining months).`);
      return;
    }

    setUpdating(true);
    
    try {
      const newTermMonth = Math.max(0, currentTermMonth - months);
      
      let newStatus = 'ACTIVE';
      if (newTermMonth <= 0) {
        newStatus = 'PAID';
      } else {
        newStatus = selectedPayment.status === 'OVERDUE' || selectedPayment.status === 'Overdue' ? 'OVERDUE' : 'ACTIVE';
      }

      const result = await updateInstallmentPlan(
        selectedPayment.planId,
        newStatus,
        String(newTermMonth)
      );

      if (result.success) {
        const monthlyPay = selectedPayment.monthlyPay || 0;
        const amountToDeduct = monthlyPay * months;
        const currentOutstanding = selectedPayment.outstandingAmount || 0;
        const newOutstanding = Math.max(0, currentOutstanding - amountToDeduct);
        
        const updatedPayment = {
          ...selectedPayment,
          currentTermMonth: newTermMonth,
          outstandingAmount: newOutstanding,
          status: newStatus,
          paidAmount: (selectedPayment.paidAmount || 0) + amountToDeduct
        };
        
        setInstallmentPayments(prev => 
          prev.map(p => 
            p.customerId === selectedPayment.customerId 
              ? updatedPayment 
              : p
          )
        );

        alert(`✅ Successfully recorded ${months} month(s) payment!\n\n` +
              `Amount paid: ${formatCurrency(amountToDeduct)}\n` +
              `Remaining months: ${newTermMonth > 0 ? newTermMonth : 0}\n` +
              `New outstanding: ${formatCurrency(newOutstanding)}`);
        
        setIsEditPaymentModalOpen(false);
        setMonthsToDeduct(1);
        setSelectedPayment(null);
        
        await fetchActiveInstallments();
      } else {
        alert(`❌ Failed to update payment: ${result.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error updating payment:', err);
      alert('Failed to update payment. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  // Calculate statistics by staff
  const staffStats = staffList.map(staff => {
    const installments = installmentPayments.filter(p => p.salesperson === staff);
    const completed = completedPayments.filter(p => p.salesperson === staff);
    return {
      staff,
      totalInstallments: installments.length,
      totalCompleted: completed.length,
      totalRevenue: completed.reduce((sum, p) => sum + (p.amount || 0), 0),
      pendingAmount: installments.reduce((sum, p) => sum + (p.outstandingAmount || 0), 0)
    };
  });

  const totalStats = {
    activeInstallments: installmentPayments.length,
    totalCompleted: completedPayments.length,
    totalRevenue: completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
    pendingAmount: installmentPayments.reduce((sum, p) => sum + (p.outstandingAmount || 0), 0)
  };

  // Pagination component
  const Pagination = ({ currentPage, totalPages, onPageChange, startIndex, endIndex, totalItems, itemName }) => {
    if (totalPages <= 1) return null;

    return (
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
          <span className="font-medium">{Math.min(endIndex, totalItems)}</span> of{' '}
          <span className="font-medium">{totalItems}</span> {itemName}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
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

          <div className="flex items-center space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
              const showPage =
                pageNum === 1 ||
                pageNum === totalPages ||
                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1);

              if (!showPage) {
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
                  onClick={() => onPageChange(pageNum)}
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

          <button
            onClick={() => onPageChange(currentPage + 1)}
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
      </div>
    );
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
                <span>Payment Management Overview</span>
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Monitor all customer payments from all staff members
              </p>
            </div>
          </div>
        </div>

        {/* Overall Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingDown className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{totalStats.activeInstallments}</p>
                <p className="text-sm text-gray-600">Active Installments</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-lg font-bold text-gray-900">{formatCurrency(totalStats.totalRevenue)}</p>
                <p className="text-sm text-gray-600">Total Revenue</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-lg font-bold text-gray-900">{formatCurrency(totalStats.pendingAmount)}</p>
                <p className="text-sm text-gray-600">Pending Amount</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{totalStats.totalCompleted}</p>
                <p className="text-sm text-gray-600">Completed Payments</p>
              </div>
            </div>
          </div>
        </div>

        {/* Staff Performance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Staff Performance</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active Installments</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {staffStats.map((stat, idx) => (
                  <tr key={idx} className="hover:bg-blue-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{stat.staff}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{stat.totalInstallments}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{stat.totalCompleted}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-600">{formatCurrency(stat.totalRevenue)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-orange-600">{formatCurrency(stat.pendingAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search payments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Staff</option>
              {staffList.map(staff => (
                <option key={staff} value={staff}>{staff}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('installments')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'installments'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              <span>Trả góp (Installment)</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'installments' ? 'bg-white/20 text-white' : 'bg-gray-300 text-gray-700'
              }`}>
                {filteredInstallments.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'completed'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Trả xong (Full Payment)</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'completed' ? 'bg-white/20 text-white' : 'bg-gray-300 text-gray-700'
              }`}>
                {filteredCompleted.length}
              </span>
            </button>
          </div>
        </div>

        {/* Installment Payments Tab */}
        {activeTab === 'installments' && (
          <div className="space-y-6">
            {loading ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading installment payments...</p>
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
                <div className="text-center text-red-600">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                  <p className="font-medium mb-2">Lỗi khi tải dữ liệu</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            ) : filteredInstallments.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
                <div className="text-center">
                  <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">No active installments found</p>
                  <p className="text-sm text-gray-500 mt-1">All customers have completed their payments</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Staff
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Paid Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Outstanding
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Monthly Pay
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Remaining Months
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Interest Rate
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
                      {paginatedInstallments.map((payment, index) => (
                        <tr 
                          key={payment.customerId || index} 
                          className="hover:bg-blue-50 transition-colors cursor-pointer"
                          onClick={() => handleViewDetails(payment)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{payment.customerName || 'N/A'}</div>
                            <div className="text-xs text-gray-500">ID: {payment.customerId}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{payment.customerEmail || 'N/A'}</div>
                            <div className="text-xs text-gray-500">{payment.customerPhone || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <Users className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-900">{payment.salesperson || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {payment.orderId ? `#${payment.orderId}` : 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">
                              {formatCurrency(payment.totalAmount || 0)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('vi-VN') : ''}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-green-600">
                              {formatCurrency(payment.paidAmount || 0)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-red-600">
                              {formatCurrency(payment.outstandingAmount || 0)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(payment.monthlyPay || 0)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {payment.currentTermMonth !== null && payment.currentTermMonth !== undefined 
                                ? `${payment.currentTermMonth} tháng`
                                : 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {formatInterestRateDisplay(payment.interestRate)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              payment.status === 'Active' || payment.status === 'ACTIVE' 
                                ? 'bg-yellow-100 text-yellow-800'
                                : payment.status === 'Overdue' || payment.status === 'OVERDUE'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {payment.status || 'Active'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDetails(payment);
                                }}
                                className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                                title="View details"
                              >
                                <Info className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditPayment(payment);
                                }}
                                className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                                title="Edit payment"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={currentPageInstallments}
                  totalPages={totalPagesInstallments}
                  onPageChange={handlePageChangeInstallments}
                  startIndex={startIndexInstallments}
                  endIndex={endIndexInstallments}
                  totalItems={filteredInstallments.length}
                  itemName="installment(s)"
                />
              </div>
            )}
          </div>
        )}

        {/* Completed Payments Tab */}
        {activeTab === 'completed' && (
          <div className="space-y-6">
            {loading && activeTab === 'completed' ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Loading completed payments...</p>
                  </div>
                </div>
              </div>
            ) : filteredCompleted.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
                <div className="text-center">
                  <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">No completed payments found</p>
                  <p className="text-sm text-gray-500 mt-1">
                    There are no completed payments (full payment - method = "TT") yet.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Staff
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vehicle
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Interest Rate
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Method
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedCompleted.map((payment, index) => (
                        <tr key={payment.paymentId || index} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{payment.customerName}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              <div>📞 {payment.phone}</div>
                              {payment.email && payment.email !== 'N/A' && (
                                <div>✉️ {payment.email}</div>
                              )}
                              {payment.customerAddress && payment.customerAddress !== 'N/A' && (
                                <div className="mt-1">📍 {payment.customerAddress}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <Users className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-900">{payment.salesperson || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">#{payment.orderId}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{payment.vehicle}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(payment.amount)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('vi-VN') : 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {formatInterestRateDisplay(payment.interestRate)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {payment.method || 'TT'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={currentPageCompleted}
                  totalPages={totalPagesCompleted}
                  onPageChange={handlePageChangeCompleted}
                  startIndex={startIndexCompleted}
                  endIndex={endIndexCompleted}
                  totalItems={filteredCompleted.length}
                  itemName="payment(s)"
                />
              </div>
            )}
          </div>
        )}

        {/* Payment Details Modal */}
        {isDetailsModalOpen && selectedPayment && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Payment Details</h2>
                  <button
                    onClick={() => {
                      setIsDetailsModalOpen(false);
                      setSelectedPayment(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Customer Information */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                      <CreditCard className="w-5 h-5" />
                      <span>Customer Information</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="text-base font-semibold text-gray-900">{selectedPayment.customerName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Customer ID</p>
                        <p className="text-base font-semibold text-gray-900">#{selectedPayment.customerId || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="text-base text-gray-900">{selectedPayment.customerEmail || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="text-base text-gray-900">{selectedPayment.customerPhone || 'N/A'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600">Address</p>
                        <p className="text-base text-gray-900">{selectedPayment.customerAddress || 'N/A'}</p>
                      </div>
                      {selectedPayment.salesperson && (
                        <div className="col-span-2">
                          <p className="text-sm text-gray-600">Staff</p>
                          <p className="text-base text-gray-900">{selectedPayment.salesperson}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                      <DollarSign className="w-5 h-5" />
                      <span>Payment Information</span>
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Order ID</span>
                        <span className="text-base font-semibold text-gray-900">#{selectedPayment.orderId || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Payment ID</span>
                        <span className="text-base font-semibold text-gray-900">#{selectedPayment.paymentId || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Amount</span>
                        <span className="text-lg font-bold text-green-600">
                          {formatCurrency(selectedPayment.totalAmount || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Paid Amount</span>
                        <span className="text-base font-semibold text-green-600">
                          {formatCurrency(selectedPayment.paidAmount || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Outstanding Amount</span>
                        <span className="text-lg font-bold text-red-600">
                          {formatCurrency(selectedPayment.outstandingAmount || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Payment Method</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          selectedPayment.method === 'TT' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {selectedPayment.method === 'TT' ? 'Full Payment' : 'Installment'}
                        </span>
                      </div>
                      {selectedPayment.paymentDate && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Payment Date</span>
                          <span className="text-base text-gray-900">
                            {new Date(selectedPayment.paymentDate).toLocaleDateString('vi-VN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Installment Plan Information */}
                  {selectedPayment.planId && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                        <TrendingDown className="w-5 h-5" />
                        <span>Installment Plan</span>
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Plan ID</span>
                          <span className="text-base font-semibold text-gray-900">#{selectedPayment.planId || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Monthly Payment</span>
                          <span className="text-lg font-bold text-purple-600">
                            {formatCurrency(selectedPayment.monthlyPay || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Remaining Months</span>
                          <span className="text-base font-semibold text-gray-900">
                            {selectedPayment.currentTermMonth !== null && selectedPayment.currentTermMonth !== undefined 
                              ? `${selectedPayment.currentTermMonth} tháng`
                              : 'N/A'}
                          </span>
                        </div>
                        {hasInterestRate(selectedPayment.interestRate) && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Interest Rate:</span>
                            <span className="text-sm text-gray-900">{formatInterestRateDisplay(selectedPayment.interestRate)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Status</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            selectedPayment.status === 'Active' || selectedPayment.status === 'ACTIVE' 
                              ? 'bg-yellow-100 text-yellow-800'
                              : selectedPayment.status === 'Overdue' || selectedPayment.status === 'OVERDUE'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedPayment.status || 'Active'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  {selectedPayment.planId && selectedPayment.currentTermMonth !== null && selectedPayment.currentTermMonth !== undefined && selectedPayment.currentTermMonth > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h3>
                      <button
                        onClick={handleReduceOneMonth}
                        disabled={updating || selectedPayment.currentTermMonth <= 0}
                        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {updating ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <Minus className="w-5 h-5" />
                            <span>Reduce 1 Month</span>
                          </>
                        )}
                      </button>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        This will deduct 1 month, reduce outstanding amount by {formatCurrency(selectedPayment.monthlyPay || 0)}, and update the database
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-end space-x-3">
                  <button
                    onClick={() => {
                      setIsDetailsModalOpen(false);
                      setSelectedPayment(null);
                    }}
                    className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
                  >
                    Close
                  </button>
                  {selectedPayment.planId && (
                    <button
                      onClick={async () => {
                        setIsDetailsModalOpen(false);
                        await handleEditPayment(selectedPayment);
                      }}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Edit Payment</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Payment Modal */}
        {isEditPaymentModalOpen && selectedPayment && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-300">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Record Payment</h2>
                
                <div className="space-y-4 mb-6">
                  {/* Customer Info */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
                    <div className="text-base text-gray-900">{selectedPayment.customerName}</div>
                    <div className="text-xs text-gray-500">Order ID: #{selectedPayment.orderId || 'N/A'}</div>
                  </div>
                  
                  {/* Payment Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                    <div className="text-sm font-semibold text-blue-900 mb-2">Payment Information</div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Amount:</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(selectedPayment.totalAmount || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Paid Amount:</span>
                      <span className="text-sm font-semibold text-green-600">
                        {formatCurrency(selectedPayment.paidAmount || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Outstanding Amount:</span>
                      <span className="text-sm font-semibold text-red-600">
                        {formatCurrency(selectedPayment.outstandingAmount || 0)}
                      </span>
                    </div>
                    {selectedPayment.paymentDate && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Payment Date:</span>
                        <span className="text-sm text-gray-900">
                          {new Date(selectedPayment.paymentDate).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* InstallmentPlan Info */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 space-y-2">
                    <div className="text-sm font-semibold text-purple-900 mb-2">Installment Plan</div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Monthly Payment:</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(selectedPayment.monthlyPay || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Số tháng còn lại:</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {selectedPayment.currentTermMonth !== null && selectedPayment.currentTermMonth !== undefined 
                          ? `${selectedPayment.currentTermMonth} tháng`
                          : 'N/A'}
                      </span>
                    </div>
                    {selectedPayment.interestRate && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Interest Rate:</span>
                        <span className="text-sm text-gray-900">{selectedPayment.interestRate}%</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        selectedPayment.status === 'Active' || selectedPayment.status === 'ACTIVE' 
                          ? 'bg-yellow-100 text-yellow-800'
                          : selectedPayment.status === 'Overdue' || selectedPayment.status === 'OVERDUE'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedPayment.status || 'Active'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Record Payment Input */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số tháng cần ghi nhận thanh toán <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={selectedPayment.currentTermMonth || undefined}
                      value={monthsToDeduct}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        const maxMonths = selectedPayment.currentTermMonth;
                        if (maxMonths && maxMonths > 0) {
                          setMonthsToDeduct(Math.min(Math.max(1, value), maxMonths));
                        } else {
                          setMonthsToDeduct(Math.max(1, value));
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={updating || !selectedPayment.currentTermMonth || selectedPayment.currentTermMonth === null || selectedPayment.currentTermMonth === undefined}
                    />
                    {selectedPayment.currentTermMonth && selectedPayment.currentTermMonth > 0 ? (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-gray-500">
                          Tối đa: {selectedPayment.currentTermMonth} tháng
                        </p>
                        {selectedPayment.monthlyPay && monthsToDeduct > 0 && (
                          <p className="text-xs font-semibold text-blue-600">
                            Số tiền sẽ ghi nhận: {formatCurrency(selectedPayment.monthlyPay * monthsToDeduct)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2">
                        <p className="text-xs text-red-600 font-medium">
                          ⚠️ Missing data: Backend needs to return termMonth (remaining months) to enable payment recording.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => {
                      setIsEditPaymentModalOpen(false);
                      setSelectedPayment(null);
                      setMonthsToDeduct(1);
                    }}
                    disabled={updating}
                    className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePaymentDeduction}
                    disabled={updating}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {updating && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Record Payment</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Modal */}
        {invoiceModal.open && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Receipt className="w-6 h-6 text-purple-600" />
                    Payment Invoice
                  </h2>
                  {invoiceModal.data?.order?.orderId && (
                    <p className="text-sm text-gray-500 mt-1">
                      Order ID: #{invoiceModal.data.order.orderId}
                    </p>
                  )}
                </div>
                <button
                  onClick={closeInvoiceModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {invoiceModal.loading ? (
                <div className="py-16 flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                  <p className="text-sm text-gray-500 mt-3">Loading invoice details...</p>
                </div>
              ) : invoiceModal.error ? (
                <div className="py-16 px-6 flex flex-col items-center justify-center space-y-3">
                  <AlertCircle className="w-10 h-10 text-red-500" />
                  <p className="text-sm text-red-600 text-center max-w-sm">{invoiceModal.error}</p>
                  <button
                    onClick={closeInvoiceModal}
                    className="px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors text-sm font-medium"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <div className="px-6 py-6 space-y-6">
                  {/* Customer & Order Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
                        Customer Information
                      </h3>
                      <div className="space-y-2 text-sm text-gray-700">
                        <div>
                          <span className="font-medium text-gray-900">Name:</span>{' '}
                          {invoiceModal.data?.customer?.name || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">Email:</span>{' '}
                          {invoiceModal.data?.customer?.email || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">Phone:</span>{' '}
                          {invoiceModal.data?.customer?.phone || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">Address:</span>{' '}
                          {invoiceModal.data?.customer?.address || 'N/A'}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
                        Vehicle Information
                      </h3>
                      <div className="space-y-2 text-sm text-gray-700">
                        <div>
                          <span className="font-medium text-gray-900">Vehicle:</span>{' '}
                          {invoiceModal.data?.vehicle?.model || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">Variant:</span>{' '}
                          {invoiceModal.data?.vehicle?.variant || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">Serial / VIN:</span>{' '}
                          {invoiceModal.data?.vehicle?.serial || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">Quantity:</span>{' '}
                          {invoiceModal.data?.vehicle?.quantity || '1'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="bg-white border border-gray-200 rounded-lg">
                    <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                        Payment Summary
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        (invoiceModal.data?.payment?.status || '').toUpperCase() === 'ACTIVE'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {invoiceModal.data?.payment?.status || 'ACTIVE'}
                      </span>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                      <div>
                        <div className="flex justify-between py-2 border-b border-dashed border-gray-200">
                          <span className="font-medium text-gray-900">Total Amount</span>
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(invoiceModal.data?.payment?.total || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-dashed border-gray-200">
                          <span>Paid Amount</span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(invoiceModal.data?.payment?.paid || 0)}
                          </span>
                        </div>
                        {invoiceModal.data?.payment?.outstanding !== undefined && (
                          <div className="flex justify-between py-2">
                            <span>Outstanding</span>
                            <span className="font-semibold text-red-600">
                              {formatCurrency(invoiceModal.data?.payment?.outstanding || 0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium text-gray-900">Payment Method:</span>{' '}
                          {invoiceModal.data?.payment?.method || (invoiceModal.data?.paymentType === 'installment' ? 'TG' : 'TT')}
                        </div>
                        {invoiceModal.data?.payment?.planId && (
                          <div>
                            <span className="font-medium text-gray-900">Plan ID:</span>{' '}
                            {invoiceModal.data?.payment?.planId}
                          </div>
                        )}
                        {invoiceModal.data?.payment?.monthlyPay != null && (
                          <div>
                            <span className="font-medium text-gray-900">Monthly Pay:</span>{' '}
                            {formatCurrency(invoiceModal.data?.payment?.monthlyPay)}
                          </div>
                        )}
                        {invoiceModal.data?.payment?.remainingMonths != null && (
                          <div>
                            <span className="font-medium text-gray-900">Remaining Months:</span>{' '}
                            {invoiceModal.data?.payment?.remainingMonths} tháng
                          </div>
                        )}
                        {invoiceModal.data?.payment?.interestRate != null && (
                          <div>
                            <span className="font-medium text-gray-900">Interest Rate:</span>{' '}
                            {invoiceModal.data?.payment?.interestRate}%
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-gray-900">Payment Date:</span>{' '}
                          {invoiceModal.data?.payment?.paymentDate
                            ? new Date(invoiceModal.data.payment.paymentDate).toLocaleDateString('vi-VN')
                            : 'N/A'}
                        </div>
                        {invoiceModal.data?.order?.salesperson && (
                          <div>
                            <span className="font-medium text-gray-900">Salesperson:</span>{' '}
                            {invoiceModal.data.order.salesperson}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
                    <p>
                      This invoice summarises the customer payment details and vehicle information.
                      Please keep a copy for dealership and customer records. For any discrepancies,
                      contact the finance department.
                    </p>
                  </div>
                </div>
              )}

              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 bg-gray-50">
                <button
                  onClick={closeInvoiceModal}
                  className="px-5 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors text-sm font-medium"
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

export default Payment;
