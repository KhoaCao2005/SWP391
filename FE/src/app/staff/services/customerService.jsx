import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Search customers by name
 * @param {string} name - Customer name to search
 * @returns {Promise} - Promise containing customers data
 */
export const searchCustomersByName = async (name) => {
  try {
    const token = localStorage.getItem('token');
    
    // Use existing searchCustomerForFeedBack endpoint which searches by name
    const response = await axios.post(
      `${API_URL}/staff/searchCustomerForFeedBack`,
      { name: name },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Backend returns { status: "success", message: "...", data: [...] }
    if (response.data && response.data.status === 'success') {
      return {
        success: true,
        data: response.data.data || []
      };
    } else {
      return {
        success: false,
        message: response.data?.message || 'Invalid response format',
        data: []
      };
    }
  } catch (error) {
    console.error('Error searching customers:', error);
    // If error response has data, return it; otherwise return empty array
    if (error.response?.data?.status === 'error') {
      return {
        success: false,
        message: error.response.data.message || 'Failed to search customers',
        data: []
      };
    }
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to search customers',
      data: []
    };
  }
};

/**
 * Get all customers from the database
 * Uses the backend endpoint /api/staff/viewAllCustomer
 * @returns {Promise} - Promise containing all customers data
 */
export const getAllCustomers = async () => {
  try {
    const token = localStorage.getItem('token');
    
    // Prepare headers with ngrok support
    const isNgrokUrl = API_URL?.includes('ngrok');
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Add ngrok-skip-browser-warning header if using ngrok
    if (isNgrokUrl) {
      headers['ngrok-skip-browser-warning'] = 'true';
    }
    
    const response = await axios.post(
      `${API_URL}/staff/viewAllCustomer`,
      {}, // Empty body
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
        message: response.data?.message || 'Failed to get all customers',
        data: []
      };
    }
  } catch (error) {
    console.error('Error getting all customers:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to get all customers',
      data: []
    };
  }
};

/**
 * Create a new customer
 * @param {Object} customerData - Customer data {name, address, email, phoneNumber}
 * @returns {Promise} - Promise containing the result
 */
export const createCustomer = async (customerData) => {
  try {
    const token = localStorage.getItem('token');
    
          const response = await axios.post(
      `${API_URL}/staff/createCustomer`,
      customerData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Backend returns status: "success" or status: "error"
    if (response.data && (response.data.status === 'success' || response.data.success)) {
      return {
        success: true,
        message: response.data.message,
        data: response.data.data
      };
    } else {
      return {
        success: false,
        message: response.data?.message || 'Failed to create customer'
      };
    }
  } catch (error) {
    console.error('Error creating customer:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to create customer'
    };
  }
};
