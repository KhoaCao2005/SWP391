import axios from 'axios';
import { getAllCustomers } from './customerService';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Get customer by ID
 * Uses getAllCustomers and filters by customer ID
 * @param {number} customerId - Customer ID
 * @returns {Promise} - Promise containing customer data
 */
export const getCustomerById = async (customerId) => {
  try {
    // Use getAllCustomers to get all customers, then filter by ID
    const result = await getAllCustomers();
    
    if (result.success && result.data && Array.isArray(result.data)) {
      const customer = result.data.find(c => {
        const id = c.customerId || c.customer_id || c.id;
        return id === customerId || String(id) === String(customerId);
      });
      
      if (customer) {
        return {
          success: true,
          data: customer
        };
      }
    }
    
    return {
      success: false,
      message: 'Customer not found',
      data: null
    };
  } catch (error) {
    console.error('Error getting customer by ID:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to get customer',
      data: null
    };
  }
};

/**
 * Get feedback by customer ID
 * Uses the searchCustomerForFeedBack endpoint which returns customers with their feedback
 * @param {number} customerId - Customer ID
 * @returns {Promise} - Promise containing feedback data
 */
export const getFeedbackByCustomerId = async (customerId) => {
  try {
    const token = localStorage.getItem('token');
    
    // First get customer to know their name
    const customerResult = await getCustomerById(customerId);
    
    if (!customerResult.success || !customerResult.data) {
      return {
        success: true,
        data: []
      };
    }
    
    const customerName = customerResult.data.name;
    
    // Use searchCustomerForFeedBack to get customer with feedback
    const response = await axios.post(
      `${API_URL}/staff/searchCustomerForFeedBack`,
      { name: customerName },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data && response.data.status === 'success' && response.data.data) {
      // Find customer by ID (in case multiple customers have same name)
      const customer = response.data.data.find(c => {
        const id = c.customerId || c.customer_id || c.id;
        return id === customerId || String(id) === String(customerId);
      });
      
      if (customer) {
        const feedbackList = customer.feedBackList || 
                            customer.feedbackList || 
                            customer.feedbacks || [];
        
        return {
          success: true,
          data: Array.isArray(feedbackList) ? feedbackList : []
        };
      }
    }
    
    return {
      success: true,
      data: []
    };
  } catch (error) {
    console.error('Error getting feedback by customer ID:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to get feedback',
      data: []
    };
  }
};

/**
 * Get test drive schedules by customer ID
 * Uses the existing getTestDriveScheduleByCustomer endpoint
 * Note: Backend returns only ONE test drive per customer (filtered by dealer)
 * @param {number} customerId - Customer ID
 * @returns {Promise} - Promise containing test drive data (array with 0 or 1 item)
 */
export const getTestDrivesByCustomerId = async (customerId) => {
  try {
    const token = localStorage.getItem('token');
    
    // Use existing endpoint that returns ONE test drive for the customer (filtered by dealer)
    // Backend endpoint: /api/staff/getTestDriveScheduleByCustomer
    // Backend now uses RequestUtils.extractParams which supports JSON bodies
    const response = await axios.post(
      `${API_URL}/staff/getTestDriveScheduleByCustomer`,
      { customer_id: String(customerId) },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data && response.data.status === 'success') {
      const payload = response.data.data;

      if (Array.isArray(payload)) {
        return {
          success: true,
          data: payload
        };
      }

      if (payload) {
        return {
          success: true,
          data: [payload]
        };
      }

      return {
        success: true,
        data: []
      };
    }

    // If backend returns error with "not found" message, return empty array (not an error)
    const message = response.data?.message;
    const normalizedMessage = typeof message === 'string' ? message.toLowerCase() : '';
    if (normalizedMessage.includes('not found') || normalizedMessage.includes('no test drive')) {
      return {
        success: true,
        data: []
      };
    }

    return {
      success: true,
      data: []
    };
  } catch (error) {
    // Handle 400/404 or error gracefully - customer may not have test drives
    // Backend returns 400 when no test drive is found (this is expected for many customers)
    const errorMessage = error.response?.data?.message || '';
    const isNotFound = error.response?.status === 404 || 
        error.response?.status === 400 ||
        errorMessage.includes('not found') ||
        errorMessage.includes('No test drive') ||
        errorMessage.includes('Customer ID is required') ||
        errorMessage.includes('Invalid customer ID');
    
    if (isNotFound) {
      // Return empty array - this is expected if customer has no test drives or orders
      // Backend requires: test drive + order + order from same dealer
      return {
        success: true,
        data: []
      };
    }
    
    // For other errors, log but don't show to user
    console.debug('Error getting test drives by customer ID:', customerId, error.response?.status);
    
    return {
      success: true, // Return success with empty data so UI doesn't break
      data: [],
      message: errorMessage || 'Test drives not available'
    };
  }
};

