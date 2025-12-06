import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Get all test drive schedules
 * Note: This fetches all test drives - backend needs to filter by staff ID if needed
 * @returns {Promise} - Promise containing test drive schedules
 */
export const getAllTestDrives = async () => {
  // Since there's no direct endpoint to get all test drives,
  // we'll need to get all customers first, then get their test drives
  // OR create a new backend endpoint
  // For now, we'll return empty array and show a message
  return {
    success: false,
    message: 'Backend endpoint for getting all test drives not available yet',
    data: []
  };
};

/**
 * Get all test drive schedules for the current staff's dealer
 * Backend: /api/staff/getTestDriveScheduleByDealerId
 * Returns a list of CustomerDTO where each item may contain testDriveSchedule
 */
export const getDealerTestDrives = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/staff/getTestDriveScheduleByDealerId`,
      {}, // body not required
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data?.status === 'success') {
      return { success: true, data: response.data.data || [] };
    }

    // If BE returns error when empty, still normalize to []
    return { success: true, data: [] };
  } catch (error) {
    // Treat not-found style errors as empty for UX
    if (error.response?.status === 400 || error.response?.status === 404) {
      return { success: true, data: [] };
    }
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch dealer test drives',
      data: []
    };
  }
};

/**
 * Get test drives by customer ID
 * Uses the existing getTestDriveScheduleByCustomer endpoint
 * Note: Backend returns only ONE test drive per customer (latest/first one)
 * @param {number} customerId - Customer ID
 * @returns {Promise} - Promise containing test drive data (array with 0 or 1 item)
 */
export const getTestDrivesByCustomerId = async (customerId) => {
  try {
    const token = localStorage.getItem('token');
    
    // Send JSON body (backend now uses RequestUtils.extractParams which supports JSON)
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
      // Backend returns a single test drive object, convert to array
      const testDrive = response.data.data;
      
      if (testDrive) {
        return {
          success: true,
          data: [testDrive] // Return as array for consistency
        };
      }
    }
    
    // If backend returns error with "not found" message, return empty array (not an error)
    if (response.data?.message?.includes('not found') || response.data?.message?.includes('No test drive')) {
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
    
    // Log unexpected errors
    console.error('Error getting test drives by customer ID:', customerId, error.response?.status);
    console.error('Error response:', error.response?.data);
    
    return {
      success: false,
      message: errorMessage || 'Failed to get test drives',
      data: []
    };
  }
};

/**
 * Create a new test drive schedule
 * @param {Object} testDriveData - Test drive data {customer_id, serial_id, date, status}
 * @returns {Promise} - Promise containing the result
 */
export const createTestDrive = async (testDriveData) => {
  try {
    const token = localStorage.getItem('token');
    
    // Backend expects: customer_id, serial_id, schedule_id, date, status
    // Note: Backend reads schedule_id and status but doesn't use them - service only uses customer_id, serial_id, date
    // Backend service always sets status to "PENDING" regardless of what we send
    // IMPORTANT: Backend calls .toString() on all params, so we must provide all fields (even if empty)
    
    // Format date to YYYY-MM-DD if it's in a different format
    let formattedDate = testDriveData.date;
    if (formattedDate && formattedDate.includes('/')) {
      // Convert MM/DD/YYYY to YYYY-MM-DD
      const parts = formattedDate.split('/');
      if (parts.length === 3) {
        const month = parts[0].padStart(2, '0');
        const day = parts[1].padStart(2, '0');
        const year = parts[2];
        formattedDate = `${year}-${month}-${day}`;
      }
    }
    
    const requestData = {
      customer_id: String(testDriveData.customer_id || ''),
      serial_id: String(testDriveData.serial_id || ''),
      date: formattedDate || '',
      status: String(testDriveData.status || 'Pending'),
      schedule_id: '' // Backend reads this but doesn't use it - provide empty string to avoid NPE
    };
    
    console.log('📅 Creating test drive with data:', requestData);
    
    const response = await axios.post(
      `${API_URL}/staff/createSchedule`,
      requestData,
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
        message: response.data.message || 'Test drive scheduled successfully',
        data: response.data.data
      };
    } else {
      // Backend returns error if schedule already exists (duplicate serial_id + date)
      const errorMessage = response.data?.message || 'Failed to create test drive schedule';
      return {
        success: false,
        message: errorMessage.includes('duplicate') || errorMessage.includes('already exists')
          ? 'A test drive with this serial ID and date already exists. Please choose a different date or serial ID.'
          : errorMessage
      };
    }
  } catch (error) {
    console.error('Error creating test drive:', error);
    
    // Provide more specific error messages
    if (error.response?.data?.message) {
      const backendMessage = error.response.data.message;
      if (backendMessage.includes('duplicate') || backendMessage.includes('already exists')) {
        return {
          success: false,
          message: 'A test drive with this serial ID and date already exists. Please choose a different date or serial ID.'
        };
      }
      if (backendMessage.includes('required') || backendMessage.includes('Customer ID')) {
        return {
          success: false,
          message: 'Please fill in all required fields (Customer, Serial ID, and Date).'
        };
      }
      return {
        success: false,
        message: backendMessage
      };
    }
    
    return {
      success: false,
      message: error.message || 'Failed to create test drive schedule. Please check your connection and try again.'
    };
  }
};

/**
 * Update test drive status
 * @param {number} appointmentId - Appointment ID
 * @param {string} status - New status
 * @returns {Promise} - Promise containing the result
 */
export const updateTestDriveStatus = async (appointmentId, status) => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await axios.post(
      `${API_URL}/staff/updateScheduleStatus`,
      { appointment_id: appointmentId, new_status: status },
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
        message: response.data.message || 'Test drive status updated successfully',
        data: response.data.data
      };
    } else {
      return {
        success: false,
        message: response.data?.message || 'Failed to update test drive status'
      };
    }
  } catch (error) {
    console.error('Error updating test drive status:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to update test drive status'
    };
  }
};

