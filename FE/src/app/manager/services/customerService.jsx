import axios from 'axios';
import { getAllCustomers } from '../../staff/services/customerService';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Get all customers for manager view
 * @returns {Promise} - Promise containing all customers data
 */
export const getAllCustomersForManager = async () => {
  return await getAllCustomers();
};

/**
 * Get customer debt/outstanding balance
 * NOTE: This endpoint may not exist. Use getCustomerOutstandingFromInstallments instead.
 * @param {number} customerId - Customer ID
 * @returns {Promise} - Promise containing debt amount (always returns 0 if endpoint doesn't exist)
 */
export const getCustomerDebt = async (customerId) => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await axios.post(
      `${API_URL}/staff/debt`,
      { customerId: customerId },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data && response.data.status === 'success') {
      return {
        success: true,
        data: response.data.data || 0
      };
    } else {
      return {
        success: false,
        message: response.data?.message || 'Failed to get customer debt',
        data: 0
      };
    }
  } catch {
    // Endpoint doesn't exist - return 0 gracefully
    console.warn('⚠️ [Manager] Debt endpoint not available, using installments data instead');
    return {
      success: false,
      message: 'Debt endpoint not available',
      data: 0
    };
  }
};

/**
 * Get orders by customer ID
 * Uses the same endpoint as staff viewOrdersByCustomerId
 * Backend automatically filters by dealerId from JWT token
 * @param {number} customerId - Customer ID
 * @returns {Promise} - Promise containing orders data
 */
export const getOrdersByCustomerId = async (customerId) => {
  try {
    const token = localStorage.getItem('token');
    
    // Use the same endpoint as staff - backend handles dealer filtering via JWT
    const response = await axios.post(
      `${API_URL}/staff/viewOrdersByCustomerId`,
      { customerId: customerId },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`📦 [Manager] API Response for customer ${customerId}:`, {
      status: response.data?.status,
      message: response.data?.message,
      dataCount: response.data?.data?.length || 0,
      data: response.data?.data
    });

    if (response.data && response.data.status === 'success') {
      const orders = response.data.data || [];
      console.log(`✅ [Manager] Found ${orders.length} orders for customer ${customerId}`);
      
      // Log each order for debugging
      if (orders.length > 0) {
        orders.forEach((order, index) => {
          console.log(`📦 [Manager] Order ${index + 1}:`, {
            orderId: order.orderId || order.order_id,
            customerId: order.customerId || order.customer_id,
            status: order.status,
            modelId: order.modelId || order.model_id,
            hasDetail: !!order.detail,
            dealerStaffId: order.dealerStaffId || order.dealer_staff_id
          });
        });
      }
      
      return {
        success: true,
        data: orders
      };
    } else {
      console.warn(`⚠️ [Manager] API returned non-success status:`, response.data);
      return {
        success: false,
        message: response.data?.message || 'Failed to get orders',
        data: []
      };
    }
  } catch (error) {
    console.error('❌ [Manager] Error getting orders by customer ID:', error);
    console.error('❌ [Manager] Error response:', error.response?.data);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to get orders',
      data: []
    };
  }
};

/**
 * Get customers with active installments (provides partial outstanding balance data)
 * @returns {Promise} - Promise containing customers with installments
 */
export const getCustomersWithActiveInstallments = async () => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await axios.post(
      `${API_URL}/staff/viewCustomerWithActiveInstallments`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data && response.data.status === 'success') {
      return {
        success: true,
        data: response.data.data || []
      };
    } else {
      return {
        success: false,
        message: response.data?.message || 'Failed to get customers with installments',
        data: []
      };
    }
  } catch (error) {
    console.error('Error getting customers with active installments:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to get customers with installments',
      data: []
    };
  }
};

/**
 * Get customers with TT status (full payment customers)
 * @returns {Promise} - Promise containing customers with TT status
 */
export const getCustomersWithTTStatus = async () => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await axios.post(
      `${API_URL}/staff/viewCustomerWithTTStatus`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data && response.data.status === 'success') {
      return {
        success: true,
        data: response.data.data || []
      };
    } else {
      return {
        success: false,
        message: response.data?.message || 'Failed to get customers with TT status',
        data: []
      };
    }
  } catch (error) {
    console.error('Error getting customers with TT status:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to get customers with TT status',
      data: []
    };
  }
};

/**
 * Calculate lifetime value from orders
 * @param {Array} orders - Array of order objects
 * @returns {number} - Total lifetime value
 */
export const calculateLifetimeValue = (orders) => {
  if (!orders || orders.length === 0) return 0;
  
  let total = 0;
  for (const order of orders) {
    // Calculate order total from order details
    // Handle both camelCase (detail, unitPrice, quantity) and snake_case (detail, unit_price, quantity)
    if (order.detail) {
      const detail = order.detail;
      const quantity = parseFloat(detail.quantity || detail.Quantity || '1');
      const unitPrice = parseFloat(detail.unitPrice || detail.unit_price || detail.UnitPrice || 0);
      if (!isNaN(quantity) && !isNaN(unitPrice)) {
        total += quantity * unitPrice;
      }
    } else if (order.unitPrice || order.unit_price) {
      // Fallback if detail is not available but order has direct price fields
      const quantity = parseFloat(order.quantity || '1');
      const unitPrice = parseFloat(order.unitPrice || order.unit_price || 0);
      if (!isNaN(quantity) && !isNaN(unitPrice)) {
        total += quantity * unitPrice;
      }
    }
  }
  
  return total;
};

/**
 * Get assigned staff ID from orders (most frequent or most recent)
 * @param {Array} orders - Array of order objects
 * @returns {number|null} - Staff ID or null
 */
export const getAssignedStaffId = (orders) => {
  if (!orders || orders.length === 0) return null;
  
  // Count frequency of each staff ID
  // Handle both camelCase and snake_case property names
  const staffCounts = {};
  for (const order of orders) {
    const staffId = order.dealerStaffId || order.dealer_staff_id || order.dealerStaff_id;
    if (staffId != null && staffId !== undefined) {
      const id = parseInt(staffId);
      if (!isNaN(id)) {
        staffCounts[id] = (staffCounts[id] || 0) + 1;
      }
    }
  }
  
  // Return most frequent staff ID
  let maxCount = 0;
  let assignedStaffId = null;
  for (const [staffId, count] of Object.entries(staffCounts)) {
    const id = parseInt(staffId);
    if (!isNaN(id) && count > maxCount) {
      maxCount = count;
      assignedStaffId = id;
    }
  }
  
  // If no frequency found, return the most recent order's staff ID
  if (!assignedStaffId && orders.length > 0) {
    const firstOrder = orders[0];
    const staffId = firstOrder.dealerStaffId || firstOrder.dealer_staff_id || firstOrder.dealerStaff_id;
    if (staffId != null && staffId !== undefined) {
      const id = parseInt(staffId);
      if (!isNaN(id)) {
        assignedStaffId = id;
      }
    }
  }
  
  return assignedStaffId;
};

/**
 * Determine customer type based on orders and lifetime value
 * @param {number} totalOrders - Total number of orders
 * @param {number} lifetimeValue - Lifetime value
 * @param {string} lastOrderDate - Last order date (optional)
 * @returns {string} - Customer type: 'VIP', 'Returning', 'New', 'Lost'
 */
export const determineCustomerType = (totalOrders, lifetimeValue, lastOrderDate = null) => {
  if (totalOrders === 0) {
    return 'New';
  }
  
  // VIP: High lifetime value (>= 1 billion VND) or many orders (>= 5)
  if (lifetimeValue >= 1000000000 || totalOrders >= 5) {
    return 'VIP';
  }
  
  // Returning: 2+ orders
  if (totalOrders >= 2) {
    return 'Returning';
  }
  
  // New: 1 order
  if (totalOrders === 1) {
    return 'New';
  }
  
  // Lost: Check if last order is old (more than 6 months)
  if (lastOrderDate) {
    const lastOrder = new Date(lastOrderDate);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    if (lastOrder < sixMonthsAgo) {
      return 'Lost';
    }
  }
  
  return 'Returning';
};

/**
 * Determine customer status based on orders
 * @param {number} totalOrders - Total number of orders
 * @param {string} lastOrderDate - Last order date (optional)
 * @returns {string} - Status: 'Active' or 'Inactive'
 */
export const determineCustomerStatus = (totalOrders, lastOrderDate = null) => {
  if (totalOrders === 0) {
    return 'Inactive';
  }
  
  // If no last order date, assume active if they have orders
  if (!lastOrderDate) {
    return 'Active';
  }
  
  // Active if last order is within last 6 months
  const lastOrder = new Date(lastOrderDate);
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  return lastOrder >= sixMonthsAgo ? 'Active' : 'Inactive';
};

/**
 * Get last order date from orders array
 * @param {Array} orders - Array of order objects
 * @returns {string|null} - Last order date or null
 */
export const getLastOrderDate = (orders) => {
  if (!orders || orders.length === 0) return null;
  
  // Sort by order date (most recent first)
  // Handle both camelCase and snake_case property names
  const sortedOrders = [...orders].sort((a, b) => {
    const dateA = new Date(a.orderDate || a.order_date || a.OrderDate || 0);
    const dateB = new Date(b.orderDate || b.order_date || b.OrderDate || 0);
    return dateB - dateA;
  });
  
  const firstOrder = sortedOrders[0];
  return firstOrder.orderDate || firstOrder.order_date || firstOrder.OrderDate || null;
};

/**
 * Get test drive schedules by customer ID
 * Uses the new getTestDrivesByCustomerId endpoint which returns ALL test drives for a customer
 * @param {number} customerId - Customer ID
 * @returns {Promise} - Promise containing test drive data
 */
export const getTestDrivesByCustomerId = async (customerId) => {
  try {
    const token = localStorage.getItem('token');
    
    // Use new endpoint that returns ALL test drives for the customer
    const response = await axios.post(
      `${API_URL}/staff/getTestDrivesByCustomerId`,
      { customerId: customerId },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data && response.data.status === 'success') {
      // Backend now returns a list of all test drives
      const testDrives = response.data.data || [];
      
      return {
        success: true,
        data: Array.isArray(testDrives) ? testDrives : []
      };
    }
    
    return {
      success: true,
      data: []
    };
  } catch (error) {
    console.error('Error getting test drives by customer ID:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to get test drives',
      data: []
    };
  }
};

/**
 * Get outstanding amount from active installment plans for a customer
 * Uses viewCustomerWithActiveInstallments and filters by customerId on frontend
 * @param {number} customerId - Customer ID
 * @returns {Promise} - Promise containing outstanding amount
 */
export const getCustomerOutstandingFromInstallments = async (customerId) => {
  try {
    const token = localStorage.getItem('token');
    
    console.log(`🔍 [Manager] Fetching outstanding for customer ID: ${customerId}`);
    
    // Use existing endpoint that returns all customers with installments for this dealer
    const response = await axios.post(
      `${API_URL}/staff/viewCustomerWithActiveInstallments`,
      {}, // Empty body - backend extracts staff/dealer from JWT
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`📥 [Manager] API Response:`, {
      status: response.data?.status,
      message: response.data?.message,
      dataCount: response.data?.data?.length || 0
    });

    if (response.data && response.data.status === 'success') {
      const allInstallments = response.data.data || [];
      
      // Find this customer's installment
      const customerInstallment = allInstallments.find(
        item => (item.customerId || item.customer_id) === customerId || 
                (item.customerId || item.customer_id) === parseInt(customerId)
      );
      
      if (customerInstallment) {
        const outstanding = parseFloat(customerInstallment.outstandingAmount || customerInstallment.outstanding_amount || 0);
        console.log(`💰 [Manager] Outstanding amount: ${outstanding}`);
        return {
          success: true,
          data: outstanding
        };
      } else {
        // Customer has no active installments
        console.log(`💰 [Manager] No active installments for customer ${customerId}`);
        return {
          success: true,
          data: 0
        };
      }
    }
    
    return {
      success: false,
      message: response.data?.message || 'Failed to get outstanding amount',
      data: 0
    };
  } catch (error) {
    console.error('❌ [Manager] Error getting outstanding:', error);
    console.error('❌ [Manager] Error response:', error.response?.data);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to get outstanding amount',
      data: 0
    };
  }
};

