import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const searchCustomersForFeedback = async (name) => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.post(
      `${API_URL}/staff/searchCustomerForFeedBack`,
      { name: String(name || '').trim() },
      { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );
    if (res.data?.status === 'success') {
      return { success: true, data: Array.isArray(res.data.data) ? res.data.data : [] };
    }
    return { success: true, data: [] };
  } catch {
    return { success: false, data: [] };
  }
};

export const getFeedbackByCustomer = async (customerId) => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.post(
      `${API_URL}/staff/getFeedbackByDealer`,
      { customer_id: String(customerId) },
      { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );
    if (res.data?.status === 'success') {
      return { success: true, data: Array.isArray(res.data.data) ? res.data.data : [] };
    }
    // Treat not-found as empty list
    return { success: true, data: [] };
  } catch {
    return { success: false, data: [] };
  }
};

export const createFeedback = async ({ customer_id, order_id, type, content, status = 'New' }) => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.post(
      `${API_URL}/staff/createFeedBack`,
      { customer_id: String(customer_id), order_id: String(order_id), type, content, status },
      { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );
    if (res.data?.status === 'success') {
      return { success: true, data: res.data.data };
    }
    return { success: false, message: res.data?.message || 'Failed to create feedback' };
  } catch (e) {
    return { success: false, message: e.response?.data?.message || 'Failed to create feedback' };
  }
};

export const deleteFeedback = async (feedbackId) => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.post(
      `${API_URL}/staff/deleteFeedBackByFeedBackId`,
      { id: String(feedbackId) },
      { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );
    if (res.data?.status === 'success') {
      return { success: true, message: res.data.message || 'Feedback deleted successfully' };
    }
    return { success: false, message: res.data?.message || 'Failed to delete feedback' };
  } catch (e) {
    return { success: false, message: e.response?.data?.message || 'Failed to delete feedback' };
  }
};


