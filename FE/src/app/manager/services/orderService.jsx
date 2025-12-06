import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Get all orders from all staff in the dealer (for manager)
 * Backend endpoint: POST /api/staff/viewOrdersByStaffId
 * Note: This endpoint works for both manager (roleId=2) and staff (roleId=3)
 * For manager, it returns all orders from the dealer
 * @returns {Promise} - Promise containing all orders from all staff
 */
export const viewAllOrders = async () => {
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
      { headers }
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
    console.error('Error viewing all orders:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to retrieve orders',
      data: []
    };
  }
};

/**
 * Update order status
 * Backend endpoint: POST /api/staff/updateOrderStatuss
 * @param {number} orderId - Order ID
 * @param {string} status - New status: "Pending", "Delivered", or "Cancel"
 * @returns {Promise} - Promise containing the result
 */
export const updateOrderStatus = async (orderId, status) => {
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
    
    // Normalize status to backend format
    let normalizedStatus = status;
    if (status === 'Cancel') {
      normalizedStatus = 'Cancel';
    } else if (status === 'Delivered') {
      normalizedStatus = 'Delivered';
    } else if (status === 'Pending') {
      normalizedStatus = 'Pending';
    }
    
    const response = await axios.post(
      `${API_URL}/staff/updateOrderStatuss`,
      { orderId, status: normalizedStatus },
      { headers }
    );

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
    console.error('Error updating order status:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to update order status'
    };
  }
};

