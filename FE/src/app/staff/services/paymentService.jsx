import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Create a payment
 * NOTE: Backend tự động tính totalAmount = unitPrice * quantity và apply discount trong PaymentService.processPayment()
 * Chỉ cần truyền orderId và method, không cần truyền totalAmount
 * 
 * @param {Object} paymentData - Payment data:
 *   - orderId (required): Order ID
 *   - method (required): "TT" (Full Payment) hoặc "TG" (Installment)
 *   - interestRate (optional): Lãi suất cho trả góp (default: "0")
 *   - termMonth (optional): Số tháng trả góp (default: "12")
 *   - monthlyPay (optional): Số tiền trả hàng tháng (default: "0" - backend tự tính)
 *   - status (optional): Status cho installment plan (default: "Active")
 * @returns {Promise} - Promise containing the result
 */
export const createPayment = async (paymentData) => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await axios.post(
      `${API_URL}/staff/createPayment`,
      paymentData,
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
        message: response.data.message || 'Payment created successfully',
        data: response.data.data
      };
    } else {
      return {
        success: false,
        message: response.data?.message || 'Failed to create payment'
      };
    }
  } catch (error) {
    console.error('Error creating payment:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to create payment'
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

/**
 * Get customers with active installments
 * Backend automatically filters by staff ID from JWT token
 * @returns {Promise} - Promise containing customers with active installments (filtered by staff ID)
 */
export const getCustomersWithActiveInstallments = async () => {
  try {
    const token = localStorage.getItem('token');
    // ✅ Backend endpoint filters payments by staff ID extracted from JWT token
    const url = `${API_URL}/staff/viewCustomerWithActiveInstallments`;
    
    // Kiểm tra xem có phải ngrok URL không và chuẩn bị headers
    const isNgrokUrl = API_URL?.includes('ngrok');
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // ✅ Nếu backend đã cập nhật CORS để allow ngrok-skip-browser-warning,
    // thì thêm header này để tự động bypass ngrok warning
    // Backend cần cập nhật: resp.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, ngrok-skip-browser-warning");
    if (isNgrokUrl) {
      headers['ngrok-skip-browser-warning'] = 'true';
      console.log('🔍 Detected ngrok URL, adding ngrok-skip-browser-warning header');
      console.log('⚠️ Note: Nếu backend chưa allow header này trong CORS, sẽ bị lỗi 405');
      console.log('⚠️ Backend cần cập nhật CorsFilter.java line 28:');
      console.log('⚠️ resp.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, ngrok-skip-browser-warning");');
    }
    
    // Thử POST trước (theo đúng BE - doPost)
    let response;
    let method = 'POST';
    
    try {
      console.log('🔍 API Call: POST', url);
      response = await axios.post(
        url,
        {}, // Empty body vì backend không cần params
        { headers }
      );
    } catch (postError) {
      // Nếu POST bị 405 (Method Not Allowed), thử GET
      if (postError.response?.status === 405 || postError.message?.includes('405')) {
        console.warn('⚠️ POST failed with 405, trying GET instead...');
        method = 'GET';
        try {
          console.log('🔍 API Call: GET (fallback)', url);
          response = await axios.get(
            url,
            { headers }
          );
          // Nếu GET thành công, tiếp tục với response
          console.log('✅ GET fallback successful');
        } catch (getError) {
          // Nếu cả GET cũng lỗi, throw error GET để có thông tin mới nhất
          console.error('❌ Both POST and GET failed');
          throw getError;
        }
      } else {
        // Nếu không phải 405, throw error POST
        throw postError;
      }
    }

    console.log(`📦 API Response (${method}):`, response);
    console.log('📦 Response Data:', response.data);
    console.log('📦 Response Data Type:', typeof response.data);
    
    // Check if response is HTML (ngrok warning page or error page)
    const isHtmlResponse = typeof response.data === 'string' && 
                          (response.data.includes('<!DOCTYPE html>') || 
                           response.data.includes('<html') ||
                           response.data.includes('ngrok') ||
                           response.data.includes('Warning'));
    
    if (isHtmlResponse) {
      console.error('❌ Received HTML instead of JSON - ngrok warning page detected');
      console.error('❌ HTML Response Preview:', response.data.substring(0, 500));
      
      // Extract ngrok URL từ API_URL
      const ngrokBaseUrl = API_URL?.replace('/api', '') || 'https://your-ngrok-url.com';
      
      return {
        success: false,
        message: '⚠️ NGROK WARNING PAGE ĐANG CHẶN REQUEST!\n\n' +
                 'Ngrok free tier đang chặn request và trả về HTML warning page thay vì JSON.\n\n' +
                 '🔧 GIẢI PHÁP (Làm theo thứ tự):\n\n' +
                 '1. ⭐ BƯỚC QUAN TRỌNG - Bypass ngrok warning:\n' +
                 `   → Mở URL này trong browser: ${ngrokBaseUrl}\n` +
                 '   → Click vào nút "Visit Site" để bypass warning\n' +
                 '   → Đợi trang load xong (có thể thấy JSON error - đó là OK, vì không có token)\n' +
                 '   → ĐÓNG tab đó lại\n' +
                 '   → Quay lại tab Payment này và REFRESH lại (F5 hoặc Ctrl+R)\n\n' +
                 '2. ⚠️ LƯU Ý: Response bạn thấy khi mở URL trực tiếp:\n' +
                 '   {"status":"error","message":"Missing or invalid Authorization header"}\n' +
                 '   → Đây là BÌNH THƯỜNG vì mở trực tiếp không có token\n' +
                 '   → Quan trọng là đã bypass được ngrok warning\n\n' +
                 '3. Sau khi refresh trang Payment, request từ frontend (có token) sẽ đi qua\n\n' +
                 '4. Nếu vẫn không được, thử:\n' +
                 '   → Clear browser cache và cookies\n' +
                 '   → Đăng nhập lại\n' +
                 '   → Refresh trang Payment\n\n' +
                 '5. Hoặc sử dụng ngrok paid plan để không bị warning',
        data: []
      };
    }
    
    // Log chi tiết structure của data
    if (response.data && response.data.data) {
      console.log('📦 Response Data Array:', response.data.data);
      if (Array.isArray(response.data.data) && response.data.data.length > 0) {
        console.log('📦 First Item Structure:', response.data.data[0]);
        console.log('📦 First Item Keys:', Object.keys(response.data.data[0]));
      }
    }

    if (response.data && response.data.status === 'success') {
      return {
        success: true,
        message: response.data.message,
        data: response.data.data || []
      };
    } else {
      console.warn('⚠️ API returned non-success status:', response.data);
      return {
        success: false,
        message: response.data?.message || 'Failed to retrieve customers',      
        data: response.data?.data || []
      };
    }
  } catch (error) {
    console.error('❌ Error getting customers with active installments:', error);
    
    // Check if error response is HTML (ngrok warning page)
    const errorData = error.response?.data;
    const isErrorHtml = typeof errorData === 'string' && 
                        (errorData.includes('<!DOCTYPE html>') || 
                         errorData.includes('<html') ||
                         errorData.includes('ngrok') ||
                         errorData.includes('Warning'));
    
    if (isErrorHtml) {
      const ngrokBaseUrl = API_URL?.replace('/api', '') || 'https://your-ngrok-url.com';
      return {
        success: false,
        message: '⚠️ Ngrok Warning Page Detected\n\n' +
                 `Open ${ngrokBaseUrl} in browser and click "Visit Site", then refresh this page.`,
        data: []
      };
    }
    
    // Handle CORS error
    if (error.message && (error.message.includes('CORS') || error.message.includes('Access-Control'))) {
      return {
        success: false,
        message: '🚫 CORS Error: Backend does not allow this origin/header.\n\n' +
                 'Please check backend CORS configuration.',
        data: []
      };
    }
    
    // Handle 405 Method Not Allowed
    if (error.response?.status === 405) {
      return {
        success: false,
        message: '❌ 405 Method Not Allowed\n\n' +
                 'Backend may not support this HTTP method or CORS needs configuration.',
        data: []
      };
    }
    
    // Handle network error
    if (error.code === 'ERR_NETWORK' || error.message.includes('Failed to fetch') || error.message.includes('ERR_FAILED')) {
      const isNgrokUrl = API_URL?.includes('ngrok');
      return {
        success: false,
        message: '🌐 Network Error: Cannot connect to server.\n\n' +
                 (isNgrokUrl ? 
                   'If using ngrok, try accessing the ngrok URL in browser first to bypass warning.\n\n' :
                   '') +
                 'Please check:\n' +
                 '1. Backend server is running\n' +
                 '2. API URL is correct\n' +
                 '3. Network connection',
        data: []
      };
    }
    
    // Extract error message from response
    const errorMessage = error.response?.data?.message || error.message || 'Failed to retrieve customers';
    
    return {
      success: false,
      message: errorMessage,
      data: []
    };
  }
};

/**
 * Get completed payments (payments with method = "TT")
 * Backend endpoint: POST /api/staff/viewCustomerWithTTStatus
 * Backend automatically filters by staff ID from JWT token
 * @returns {Promise} - Promise containing completed payments data
 */
export const getCompletedPayments = async () => {
  try {
    const token = localStorage.getItem('token');
    // ✅ Use the correct endpoint that exists in backend
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
      response = await axios.post(
        url,
        {}, // Empty body - backend extracts staff ID from JWT token
        { headers }
      );
    } catch (postError) {
      if (postError.response?.status === 405 || postError.message?.includes('405')) {
        console.warn('⚠️ POST failed with 405, trying GET instead...');
        try {
          console.log('🔍 API Call: GET (fallback)', url);
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
    
    console.log('📦 TT Payments API Response:', response.data);
    
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
    
    // Handle authentication errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      return {
        success: false,
        message: 'Authentication failed. Please log in again.',
        data: []
      };
    }
    
    // If endpoint doesn't exist (404), return empty data with helpful message
    if (error.response?.status === 404 || error.response?.status === 405) {
      return {
        success: false,
        message: 'Backend endpoint /api/staff/viewCustomerWithTTStatus not found.\n\n' +
                 'Please ensure the backend is running and the endpoint is properly configured.',
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
 * Get all payments (full payment and installments)
 * NOTE: Backend endpoint does not exist - only active installments endpoint is available
 * @returns {Promise} - Promise containing all payments data
 */
export const getAllPayments = async () => {
  // TODO: Implement when backend endpoint is available
  return {
    success: false,
    message: 'Backend endpoint for viewing all payments is not available yet',
    data: []
  };
};
