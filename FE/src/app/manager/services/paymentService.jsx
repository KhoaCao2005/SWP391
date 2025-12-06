import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Get customers with active installments (for manager - all staff)
 * @returns {Promise} - Promise containing customers with active installments from all staff
 */
export const getCustomersWithActiveInstallments = async () => {
  try {
    const token = localStorage.getItem('token');
    const url = `${API_URL}/staff/viewCustomerWithActiveInstallments`;
    
    const isNgrokUrl = API_URL?.includes('ngrok');
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    if (isNgrokUrl) {
      headers['ngrok-skip-browser-warning'] = 'true';
    }
    
    let response;
    
    try {
      console.log('🔍 API Call: POST', url);
      response = await axios.post(url, {}, { headers });
    } catch (postError) {
      if (postError.response?.status === 405) {
        console.warn('⚠️ POST failed with 405, trying GET instead...');
        try {
          response = await axios.get(url, { headers });
          console.log('✅ GET fallback successful');
        } catch (getError) {
          console.error('❌ Both POST and GET failed');
          throw getError;
        }
      } else {
        throw postError;
      }
    }

    if (response.data && response.data.status === 'success') {
      return {
        success: true,
        message: response.data.message,
        data: response.data.data || []
      };
    } else {
      return {
        success: false,
        message: response.data?.message || 'Failed to retrieve customers',
        data: response.data?.data || []
      };
    }
  } catch (error) {
    console.error('❌ Error getting customers with active installments:', error);
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      return {
        success: false,
        message: 'Authentication failed. Please log in again.',
        data: []
      };
    }
    
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to retrieve customers',
      data: []
    };
  }
};

/**
 * Get completed payments (payments with method = "TT") (for manager - all staff)
 * @returns {Promise} - Promise containing completed payments from all staff
 */
export const getCompletedPayments = async () => {
  try {
    const token = localStorage.getItem('token');
    const url = `${API_URL}/staff/viewCustomerWithTTStatus`;
    
    const isNgrokUrl = API_URL?.includes('ngrok');
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    if (isNgrokUrl) {
      headers['ngrok-skip-browser-warning'] = 'true';
    }
    
    let response;
    
    try {
      console.log('🔍 API Call: POST', url);
      response = await axios.post(url, {}, { headers });
    } catch (postError) {
      if (postError.response?.status === 405) {
        console.warn('⚠️ POST failed with 405, trying GET instead...');
        try {
          response = await axios.get(url, { headers });
          console.log('✅ GET fallback successful');
        } catch (getError) {
          console.error('❌ Both POST and GET failed');
          throw getError;
        }
      } else {
        throw postError;
      }
    }
    
    if (response.data && response.data.status === 'success') {
      return {
        success: true,
        message: response.data.message,
        data: response.data.data || []
      };
    } else {
      return {
        success: false,
        message: response.data?.message || 'Failed to retrieve completed payments',
        data: response.data?.data || []
      };
    }
  } catch (error) {
    console.error('❌ Error getting completed payments:', error);
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      return {
        success: false,
        message: 'Authentication failed. Please log in again.',
        data: []
      };
    }
    
    if (error.response?.status === 404 || error.response?.status === 405) {
      return {
        success: false,
        message: 'Backend endpoint not found.',
        data: []
      };
    }
    
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to retrieve completed payments',
      data: []
    };
  }
};

/**
 * Update installment plan status (reduce months paid)
 * @param {number} planId - Installment plan ID
 * @param {string} status - New status (ACTIVE, PAID, OVERDUE)
 * @param {string} termMonth - New term month (remaining months)
 * @returns {Promise} - Promise containing the result
 */
export const updateInstallmentPlan = async (planId, status, termMonth) => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await axios.post(
      `${API_URL}/staff/updateInstallmentPlan`,
      { planId, status, termMonth },
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
        message: response.data.message || 'Installment plan updated successfully',
        data: response.data.data
      };
    } else {
      return {
        success: false,
        message: response.data?.message || 'Failed to update installment plan'
      };
    }
  } catch (error) {
    console.error('Error updating installment plan:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to update installment plan'
    };
  }
};

