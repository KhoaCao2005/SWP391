import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const buildHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  if (API_URL?.includes('ngrok')) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }
  return headers;
};

/**
 * Fetch promotions assigned to the currently logged in dealer staff.
 * BE endpoint: /api/staff/viewPromotionDealerId
 * Returns { success, data, message }
 */
export async function fetchDealerPromotions() {
  try {
    const response = await axios.post(
      `${API_URL}/staff/viewPromotionDealerId`,
      {},
      { headers: buildHeaders() }
    );

    const payload = response?.data;
    const dealerData = payload?.data || {};
    const promotionList = dealerData?.promotion || [];

    const normalized = promotionList.map((promo) => ({
      promoId: promo?.promoId ?? promo?.promo_id ?? promo?.id,
      description: promo?.description || '',
      startDate: promo?.startDate || promo?.start_date || null,
      endDate: promo?.endDate || promo?.end_date || null,
      discountRate: Number(promo?.discountRate ?? promo?.discount_rate ?? 0),
      type: (promo?.type || '').toString(),
    }));

    return { success: true, data: normalized };
  } catch (error) {
    console.error('Error fetching dealer promotions:', error);
    return {
      success: false,
      message: error?.response?.data?.message || error.message || 'Failed to fetch promotions',
      data: [],
    };
  }
}


