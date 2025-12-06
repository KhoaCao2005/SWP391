import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Get sales records for the authenticated staff within a date range.
 * Backend endpoint: /api/staff/salesRecords
 * Requires JSON body: { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' }
 */
export const getStaffSalesRecords = async (startDate, endDate) => {
	try {
		const token = localStorage.getItem('token');
		const response = await axios.post(
			`${API_URL}/staff/salesRecords`,
			{ startDate, endDate },
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
				data: Array.isArray(response.data.data) ? response.data.data : []
			};
		}

		return {
			success: true,
			data: []
		};
	} catch (error) {
		// If no records for the period, backend may still return success with empty list
		// For other errors, surface a friendly message
		return {
			success: false,
			message: error.response?.data?.message || 'Failed to fetch sales records',
			data: []
		};
	}
};


