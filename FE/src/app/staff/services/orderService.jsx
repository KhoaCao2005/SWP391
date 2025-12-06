import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Create a new order
 * @param {Object} orderData - Order data
 * @returns {Promise} - Promise containing the result
 */
export const createOrder = async (orderData) => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await axios.post(
      `${API_URL}/staff/createOrder`,
      orderData,
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
        message: response.data.message || 'Order created successfully',
        data: response.data.data
      };
    } else {
      return {
        success: false,
        message: response.data?.message || 'Failed to create order'
      };
    }
  } catch (error) {
    console.error('Error creating order:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to create order'
    };
  }
};

/**
 * Create a dealer custom order (special request to manufacturer/EVM)
 * Backend endpoint: POST /api/staff/createOrderFromDealer
 * @param {Object} payload - { modelId, quantity, variantId?, status?, isCustom? }
 * @returns {Promise<{success:boolean,message:string,data?:any}>}
 */
export const createDealerCustomOrder = async (payload) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return { success: false, message: 'Authentication token not found. Please log in again.' };
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    if (API_URL?.includes('ngrok')) {
      headers['ngrok-skip-browser-warning'] = 'true';
    }

    const body = {
      status: 'Pending',
      isCustom: true,
      ...payload,
    };

    // Ensure numeric fields are numbers
    if (body.modelId != null) body.modelId = Number(body.modelId);
    if (body.variantId != null && body.variantId !== '') body.variantId = Number(body.variantId);
    else delete body.variantId;
    if (body.quantity != null) body.quantity = Number(body.quantity);

    const response = await axios.post(
      `${API_URL}/staff/createOrderFromDealer`,
      body,
      { headers }
    );

    if (response.data && response.data.status === 'success') {
      return {
        success: true,
        message: response.data.message || 'Custom order submitted successfully',
        data: response.data.data
      };
    }

    return {
      success: false,
      message: response.data?.message || 'Failed to create custom order'
    };
  } catch (error) {
    console.error('Error creating custom dealer order:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Failed to create custom order'
    };
  }
};

/**
 * View orders by customer ID
 * Backend endpoint: POST /api/staff/viewOrdersByCustomerId
 * Gets orders for a specific customer, filtered by the logged-in staff's dealer
 * @param {number} customerId - Customer ID
 * @returns {Promise} - Promise containing orders data
 */
export const viewOrdersByCustomerId = async (customerId) => {
  try {
    const token = localStorage.getItem('token');
    
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

    if (response.data && response.data.status === 'success') {
      return {
        success: true,
        data: response.data.data || []
      };
    } else {
      return {
        success: false,
        message: response.data?.message || 'Failed to retrieve orders',
        data: []
      };
    }
  } catch (error) {
    console.error('Error viewing orders by customer ID:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to retrieve orders',
      data: []
    };
  }
};

/**
 * Approve custom order
 * @param {number} orderId - Order ID
 * @param {boolean} isAgree - Whether to approve or disagree
 * @param {number} unitPrice - Unit price
 * @returns {Promise} - Promise containing the result
 */
export const approveCustomOrder = async (orderId, isAgree, unitPrice) => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await axios.post(
      `${API_URL}/staff/approveCustomOrder`,
      { orderId, isAgree, unitPrice },
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
        message: response.data.message || 'Custom order processed successfully'
      };
    } else {
      return {
        success: false,
        message: response.data?.message || 'Failed to process custom order'
      };
    }
  } catch (error) {
    console.error('Error approving custom order:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to process custom order'
    };
  }
};

/**
 * View orders by dealer staff ID
 * Backend endpoint: POST /api/staff/viewOrdersByStaffId
 * Gets orders for the logged-in staff member (extracted from JWT token)
 * @returns {Promise} - Promise containing orders data
 */
export const viewOrdersByStaffId = async () => {
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
    
    const response = await axios.post(
      `${API_URL}/staff/viewOrdersByStaffId`,
      {},
      {
        headers
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
        message: response.data?.message || 'Failed to retrieve orders',
        data: []
      };
    }
  } catch (error) {
    console.error('Error viewing orders by staff ID:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to retrieve orders',
      data: []
    };
  }
};

/**
 * Update order status
 * Backend endpoint: POST /api/staff/updateOrderStatuss (note: double 's' in the URL)
 * @param {number} orderId - Order ID
 * @param {string} status - New status: "Pending", "Delivered", or "Cancel" (will be normalized to backend format)
 * @returns {Promise} - Promise containing the result
 */
export const updateOrderStatus = async (orderId, status) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return {
        success: false,
        message: 'Authentication token not found. Please log in again.'
      };
    }
    
    // Validate status values (accept frontend format)
    const validStatuses = ['Pending', 'Delivered', 'Cancel'];
    if (!validStatuses.includes(status)) {
      return {
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      };
    }
    
    // Normalize status to backend format: "Cancel" -> "cancelled" (backend expects lowercase)
    // Backend uses equalsIgnoreCase, but sending exact format for consistency
    let backendStatus = status;
    if (status === 'Cancel') {
      backendStatus = 'cancelled'; // Backend expects "cancelled" (see OrderService.java line 292)
    } else {
      backendStatus = status.toLowerCase(); // "Pending" -> "pending", "Delivered" -> "delivered"
    }
    
    const isNgrokUrl = API_URL?.includes('ngrok');
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    if (isNgrokUrl) {
      headers['ngrok-skip-browser-warning'] = 'true';
    }
    
    console.log(`🔄 Updating order ${orderId} status: ${status} -> ${backendStatus}`);
    
    const response = await axios.post(
      `${API_URL}/staff/updateOrderStatuss`, // Note: double 's' in the endpoint URL
      {
        order_id: orderId,
        status: backendStatus
      },
      { headers }
    );
    
    console.log('📦 Update status response:', response.data);
    
    if (response.data && response.data.status === 'success') {
      return {
        success: true,
        message: response.data.message || 'Order status updated successfully'
      };
    } else {
      return {
        success: false,
        message: response.data?.message || 'Failed to update order status'
      };
    }
  } catch (error) {
    console.error('❌ Error updating order status:', error);
    console.error('❌ Error response:', error.response?.data);
    console.error('❌ Error status:', error.response?.status);
    
    // Handle authentication errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      return {
        success: false,
        message: 'Authentication failed. Your session may have expired. Please log in again.'
      };
    }
    
    // Handle validation errors
    if (error.response?.status === 400) {
      return {
        success: false,
        message: error.response?.data?.message || 'Invalid request. Please check the order ID and status.'
      };
    }
    
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to update order status. Please try again.'
    };
  }
};
