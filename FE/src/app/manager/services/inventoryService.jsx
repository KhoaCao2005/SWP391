import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Centralized auth error handling for token expiry/invalid
export const handleAuthError = (error) => {
  const status = error?.response?.status;
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    '';
  const isAuthError =
    status === 401 ||
    status === 403 ||
    status === 400 && /invalid|expired token/i.test(message || '');

  if (isAuthError) {
    try {
      localStorage.removeItem('token');
    } catch {}
    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
};

/**
 * Fix image URL - Thêm base URL nếu cần
 */
const fixImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  if (imageUrl.startsWith('/')) {
    const baseUrl = API_URL.replace('/api', '');
    return `${baseUrl}${imageUrl}`;
  }
  
  const baseUrl = API_URL.replace('/api', '');
  return `${baseUrl}/images/${imageUrl}`;
};

/**
 * Fetch all dealers from API
 */
export const getDealers = async () => {
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
      `${API_URL}/EVM/viewAllDealer`,
      {},
      { headers }
    );

    if (response.data && response.data.data) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching dealers:', error);
    return [];
  }
};

/**
 * Fetch all vehicles from API - only real data from database
 * Returns models and variants with actual data only
 */
export const getVehicles = async (filters = {}) => {
  try {
    const token = localStorage.getItem('token');
    const { search = '' } = filters;
    
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
    
    // Call API to get all vehicles (models and variants)
    const response = await axios.post(
      `${API_URL}/staff/viewVehicle`,
      {},
      { headers }
    );

    if (!response.data || !response.data.data) {
      return [];
    }

    const models = response.data.data;
    const vehicles = [];

    // Transform models and variants to vehicle list - only real data
    models.forEach((model) => {
      if (!model.isActive) return;
      
      const variants = model.lists || [];
      variants.forEach((variant) => {
        if (!variant.isActive) return;
        
        // Only use real data from database
        const modelName = `${model.modelName} ${variant.versionName || ''}`.trim();
        
        vehicles.push({
          modelId: model.modelId,
          variantId: variant.variantId,
          model: modelName,
          modelName: model.modelName,
          versionName: variant.versionName || '',
          color: variant.color || 'N/A',
          price: variant.price || 0,
          image: variant.image ? fixImageUrl(variant.image) : null,
          isActive: variant.isActive,
          description: model.description || '',
        });
      });
    });

    // Apply search filter only (no status/dealer filters since we don't have that data)
    if (search) {
      const term = String(search || '').toLowerCase();
      return vehicles.filter((v) => {
        return v.model.toLowerCase().includes(term) || 
               v.modelName.toLowerCase().includes(term) ||
               v.versionName.toLowerCase().includes(term) ||
               v.color.toLowerCase().includes(term);
      });
    }

    return vehicles;
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    handleAuthError(error);
    
    // Log chi tiết lỗi để debug
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      console.error('Response headers:', error.response.headers);
      
      // Check if response is HTML (ngrok warning page)
      const responseData = error.response.data;
      const isHtmlResponse = typeof responseData === 'string' && 
                            (responseData.includes('<!DOCTYPE html>') || 
                             responseData.includes('<html') ||
                             responseData.includes('ngrok') ||
                             responseData.includes('Warning'));
      
      if (isHtmlResponse) {
        console.error('❌ Received HTML instead of JSON - ngrok warning page detected');
        const ngrokBaseUrl = API_URL?.replace('/api', '') || 'https://your-ngrok-url.com';
        console.error(`⚠️ Please open ${ngrokBaseUrl} in browser and click "Visit Site" to bypass ngrok warning`);
      }
      
      // Log error message from backend if available
      if (error.response.data && error.response.data.message) {
        console.error('Backend error message:', error.response.data.message);
      }
    } else if (error.request) {
      console.error('Request was made but no response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    
    return [];
  }
};

/**
 * Update vehicle variant information
 * @param {number} variantId - Variant ID
 * @param {number} modelId - Model ID
 * @param {string} versionName - Version name
 * @param {string} color - Color
 * @param {string} image - Image URL (optional)
 * @param {number} price - Price
 * @returns {Promise<boolean>} - Success status
 */
export const updateVehicleVariant = async (variantId, modelId, versionName, color, image, price) => {
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
      `${API_URL}/staff/updateVehicleVariant`,
      {
        variant_id: variantId,
        model_id: modelId,
        version_name: versionName,
        color: color,
        image: image || null,
        price: price
      },
      { headers }
    );

    if (response.data && response.data.status === 'success') {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating vehicle variant:', error);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    return false;
  }
};

/**
 * Calculate stock overview from vehicles list - only real data
 */
export const getStockOverview = (vehicles = []) => {
  const total = vehicles.length;

  // Group by model
  const byModelMap = new Map();
  vehicles.forEach((v) => {
    const key = v.modelId;
    const modelName = v.modelName || v.model.split(' ').slice(0, -1).join(' ') || v.model;
    const entry = byModelMap.get(key) || { 
      modelId: v.modelId, 
      modelName, 
      total: 0,
      variants: []
    };
    entry.total += 1;
    entry.variants.push({
      variantId: v.variantId,
      versionName: v.versionName,
      color: v.color,
      price: v.price
    });
    byModelMap.set(key, entry);
  });
  const byModel = Array.from(byModelMap.values());

  return {
    totals: { total },
    byModel,
  };
};

/**
 * Get model detail data for a specific model
 * This can be enhanced to call API if needed
 */
export const getModelDetail = async (modelId, vehicles = []) => {
  const modelVehicles = vehicles.filter(v => v.modelId === modelId);
  
  if (modelVehicles.length === 0) return null;
  
  // Get model name from first vehicle
  const modelName = modelVehicles[0].model.split(' ').slice(0, -1).join(' ') || modelVehicles[0].model;
  const total = modelVehicles.length;
  const available = modelVehicles.filter(v => v.status === 'Available').length;
  const reserved = modelVehicles.filter(v => v.status === 'Reserved').length;
  const sold = modelVehicles.filter(v => v.status === 'Sold').length;
  
  // Determine stock status
  let stockStatus = 'High';
  if (available < 3) stockStatus = 'Low';
  else if (available < 5) stockStatus = 'Medium';
  
  // Generate demand trend data (last 6 months)
  const demandTrend = [
    { month: 'Jul', reserved: 2, sold: 3 },
    { month: 'Aug', reserved: 3, sold: 4 },
    { month: 'Sep', reserved: 4, sold: 5 },
    { month: 'Oct', reserved: 3, sold: 6 },
    { month: 'Nov', reserved: 5, sold: 7 },
    { month: 'Dec', reserved: reserved, sold: sold },
  ];
  
  // History data
  const history = modelVehicles.map(v => ({
    vin: v.vin,
    color: v.color,
    status: v.status,
    date: v.status === 'Sold' ? v.importDate : null,
    price: v.price
  }));
  
  // Forecast (next 3 months based on trend)
  const avgSold = sold > 0 ? Math.round(sold / 6) : 0;
  const forecast = [
    { month: 'Jan', predicted: Math.max(0, available - avgSold * 1) },
    { month: 'Feb', predicted: Math.max(0, available - avgSold * 2) },
    { month: 'Mar', predicted: Math.max(0, available - avgSold * 3) },
  ];
  
  return {
    modelId,
    modelName,
    description: '',
    total,
    available,
    reserved,
    sold,
    stockStatus,
    demandTrend,
    history,
    forecast
  };
};

/**
 * Create stock request (reorder from manufacturer)
 */
export const createStockRequest = async (modelId, quantity, notes = '') => {
  try {
    const token = localStorage.getItem('token');
    // TODO: Replace with actual API endpoint when available
    const request = {
      requestId: `REQ-${Date.now()}`,
      modelId,
      quantity,
      notes,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };
    
    console.log('Stock Request Created:', request);
    return { success: true, data: request };
  } catch (error) {
    console.error('Error creating stock request:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Get brands, models, colors from API
 * These can be enhanced to call actual API endpoints when available
 */
// In-memory cache for models to support brand/model/color lookups
let cachedModels = null;
let modelsPromise = null;
const ensureModels = async (options = {}) => {
  const force = typeof options === 'boolean' ? options : options?.force;

  if (!force && Array.isArray(cachedModels) && cachedModels.length > 0) {
    return cachedModels;
  }

  if (!force && modelsPromise) {
    return modelsPromise;
  }

  const token = localStorage.getItem('token');
  const isNgrokUrl = API_URL?.includes('ngrok');
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  if (isNgrokUrl) headers['ngrok-skip-browser-warning'] = 'true';

  const request = axios
    .post(`${API_URL}/staff/viewVehicle`, {}, { headers })
    .then((res) => {
      const incoming = Array.isArray(res.data?.data) ? res.data.data : [];
      const hasExisting = Array.isArray(cachedModels) && cachedModels.length > 0;
      if (incoming.length > 0) {
        cachedModels = incoming;
      } else if (!hasExisting) {
        cachedModels = [];
      }
      return cachedModels || [];
    })
    .catch((error) => {
      handleAuthError(error);
      if (!cachedModels) cachedModels = [];
      throw error;
    })
    .finally(() => {
      if (modelsPromise === request) {
        modelsPromise = null;
      }
    });

  modelsPromise = request;
  return request;
};

export const refreshVehicleModelsCache = async () => {
  const previous = cachedModels;
  cachedModels = null;
  try {
    const result = await ensureModels({ force: true });
    if (Array.isArray(result) && result.length === 0 && Array.isArray(previous) && previous.length > 0) {
      cachedModels = previous;
      return previous;
    }
    return result;
  } catch (error) {
    if (Array.isArray(previous) && previous.length > 0) {
      cachedModels = previous;
    }
    return cachedModels || [];
  }
};

export const getCachedVehicleModels = async () => {
  return ensureModels().catch(() => cachedModels || []);
};

export const getBrands = async () => {
  const models = await ensureModels().catch(() => cachedModels || []);
  // Assuming `brandName` may exist on model; if not, deduce from modelName prefix
  const brandSet = new Map();
  models.forEach(m => {
    const brand = m.brandName || (m.modelName ? m.modelName.split(' ')[0] : 'Unknown');
    if (!brandSet.has(brand)) {
      brandSet.set(brand, { brandId: brandSet.size + 1, brandName: brand });
    }
  });
  return Array.from(brandSet.values());
};

export const getModelsByBrand = async (brandName) => {
  if (!brandName || brandName === '') return [];
  const models = await ensureModels().catch(() => cachedModels || []);
  if (!Array.isArray(models)) return [];
  // Filter by brandName (simple startsWith match against modelName if brand field absent)
  const normalizedBrand = brandName.trim().toLowerCase();
  const filtered = models.filter(m => {
    const brand = m.brandName || (m.modelName ? m.modelName.split(' ')[0] : '');
    const normalizedModelBrand = String(brand || '').trim().toLowerCase();
    if (normalizedBrand && normalizedModelBrand) {
      return (
        normalizedModelBrand === normalizedBrand ||
        normalizedModelBrand.startsWith(normalizedBrand)
      );
    }
    return false;
  });
  const source = filtered.length > 0 ? filtered : models;
  return source.map(m => ({
    modelId: m.modelId,
    modelName: m.modelName,
    lists: m.lists || []
  }));
};

export const getColorsByBrandAndModel = async (brandName, modelName) => {
  if (!brandName || !modelName) return [];
  const models = await getModelsByBrand(brandName);
  const model = models.find(m => m.modelName === modelName);
  if (!model) return [];
  const colors = (model.lists || []).filter(v => v.isActive).map(v => v.color).filter(Boolean);
  // Unique
  return Array.from(new Set(colors));
};

export const getPriceByModelAndColor = async (brandName, modelName, color) => {
  if (!brandName || !modelName || !color) return null;
  const models = await getModelsByBrand(brandName);
  const model = models.find(m => m.modelName === modelName);
  if (!model) return null;
  const variant = (model.lists || []).find(v => v.isActive && v.color === color);
  return variant ? variant.price : null;
};

export const createManufacturerRequest = async (requestData) => {
  try {
    const token = localStorage.getItem('token');
    const isNgrokUrl = API_URL?.includes('ngrok');
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    if (isNgrokUrl) headers['ngrok-skip-browser-warning'] = 'true';

    // Resolve modelId and variantId from names
    const models = await getModelsByBrand(requestData.brand);
    const model = models.find(m => m.modelName === requestData.model);
    if (!model) {
      return { success: false, message: 'Model not found' };
    }
    const variant = (model.lists || []).find(v => v.color === requestData.color);
    const payload = {
      modelId: model.modelId,
      quantity: requestData.quantity,
      status: 'Pending',
      isCustom: true,
    };
    if (variant && variant.variantId) {
      payload.variantId = variant.variantId;
    }

    const res = await axios.post(`${API_URL}/staff/createOrderFromDealer`, payload, { headers });
    if (res.data?.status === 'success') {
      return { success: true, data: res.data?.data || res.data };
    }
    return { success: false, message: res.data?.message || 'Failed to submit request' };
  } catch (error) {
    console.error('Error creating manufacturer request:', error);
    handleAuthError(error);
    return { success: false, message: error.response?.data?.message || error.message };
  }
};

/**
 * Fetch all manufacturer requests created by this dealer (customer_id = 0)
 * Backend controller: /api/staff/viewOrderFromDealer
 */
export const fetchManufacturerRequests = async () => {
  try {
    const token = localStorage.getItem('token');
    const isNgrokUrl = API_URL?.includes('ngrok');
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    if (isNgrokUrl) headers['ngrok-skip-browser-warning'] = 'true';

    // Prepare variant lookup maps to resolve color when BE omits it
    const modelsForLookup = await ensureModels().catch(() => []);
    const normalizeId = (id) => {
      if (id === null || id === undefined) return null;
      return String(id);
    };
    const variantIdToColor = new Map();
    const variantIdToModelName = new Map();
    const modelIdToModelName = new Map();
    // Map to store serialId -> variantId mapping
    // We'll build this from order data by matching serialId with variants of the same modelId
    const serialIdToVariantId = new Map();
    
    if (Array.isArray(modelsForLookup)) {
      modelsForLookup.forEach((m) => {
        const lists = m?.lists || [];
        const mid = normalizeId(m?.modelId ?? m?.model_id);
        if (mid) modelIdToModelName.set(mid, m?.modelName || '');
        lists.forEach((v) => {
          const rawVid = v?.variantId ?? v?.variant_id;
          const vid = normalizeId(rawVid);
          if (vid != null) {
            if (v?.color) variantIdToColor.set(vid, v.color);
            const modelName = m?.modelName || '';
            const version = v?.versionName || v?.version_name || '';
            const composite = [modelName, version].filter(Boolean).join(' ').trim();
            if (composite) variantIdToModelName.set(vid, composite);
          }
        });
      });
    }

    // Controller expects POST (with token to derive dealerId)
    let res;
    try {
      res = await axios.post(`${API_URL}/staff/viewOrderFromDealer`, {}, { headers });
    } catch (postErr) {
      if (postErr.response?.status === 405) {
        res = await axios.get(`${API_URL}/staff/viewOrderFromDealer`, { headers });
      } else {
        throw postErr;
      }
    }

    const data = res.data?.data || [];

    // First, build serialId -> variantId map from order data
    // We'll use modelId to narrow down which variants to check
    // For each order detail with serialId, try to match with variants of the same modelId
    data.forEach((order) => {
      const orderModelId = normalizeId(order.modelId ?? order.model_id);
      const getDetailArray = (o) => {
        if (Array.isArray(o.details)) return o.details;
        if (Array.isArray(o.orderDetails)) return o.orderDetails;
        if (Array.isArray(o.orderDetail)) return o.orderDetail;
        if (o.detail && typeof o.detail === 'object') return [o.detail];
        return [];
      };
      
      const details = getDetailArray(order);
      details.forEach((d) => {
        const serialId = d?.serialId ?? d?.serial_id;
        if (serialId && !serialIdToVariantId.has(serialId)) {
          // Try to find variantId from modelId
          // If model has only one variant, use that variant
          // Otherwise, we'll need to fetch from API or use first matching variant
          if (orderModelId && modelsForLookup) {
            const model = modelsForLookup.find(m => 
              normalizeId(m?.modelId ?? m?.model_id) === orderModelId
            );
            if (model) {
              const variants = model?.lists || [];
              // If model has only one variant, use it
              if (variants.length === 1) {
                const vid = normalizeId(variants[0]?.variantId ?? variants[0]?.variant_id);
                if (vid) {
                  serialIdToVariantId.set(serialId, vid);
                }
              } else if (variants.length > 1) {
                // If multiple variants, we can't be sure which one
                // But we can try to match by checking if there's a variant with matching characteristics
                // For now, we'll use the first variant as fallback (not perfect but better than nothing)
                // In a real scenario, you'd need to fetch variantId from serialId via API
                const vid = normalizeId(variants[0]?.variantId ?? variants[0]?.variant_id);
                if (vid) {
                  serialIdToVariantId.set(serialId, vid);
                }
              }
            }
          }
        }
      });
    });

    // Group by orderId and aggregate quantity across details per order
    // Backend may return each order detail as a separate object (same orderId, different orderDetailId)
    const grouped = new Map();

    const getOrderId = (o) => {
      // Try orderId first, then check detail.orderId
      const id = o.orderId || o.order_id;
      if (id) return id;
      if (o.detail && (o.detail.orderId || o.detail.order_id)) {
        return o.detail.orderId || o.detail.order_id;
      }
      return null;
    };

    const getDetailArray = (o) => {
      // Support multiple possible shapes from BE
      if (Array.isArray(o.details)) return o.details;
      if (Array.isArray(o.orderDetails)) return o.orderDetails;
      if (Array.isArray(o.orderDetail)) return o.orderDetail;
      if (o.detail && typeof o.detail === 'object') return [o.detail];
      return [];
    };

    // First pass: collect all data by orderId
    // Backend returns each order detail as a separate OrderDTO (same orderId, different orderDetailId)
    // Each OrderDTO has a single 'detail' (OrderDetailDTO) containing quantity
    data.forEach((order) => {
      const orderId = getOrderId(order);
      if (!orderId) return;

      // Extract quantity from order.detail (single OrderDetailDTO) or order.details (array)
      // Backend structure: OrderDTO has either 'detail' (single) or 'details' (array)
      let itemQuantity = 0;
      let itemUnitPrice = null;
      let itemVariantId = null;
      let itemModelId = null;
      let itemColor = '';
      let itemModel = '';

      // Check for single detail object first (most common case from BE)
      if (order.detail && typeof order.detail === 'object') {
        const d = order.detail;
        const q = d?.quantity != null ? parseInt(d.quantity) : 0;
        if (!isNaN(q)) itemQuantity = q;
        if (d?.unitPrice != null && itemUnitPrice === null) {
          const parsedPrice = parseFloat(d.unitPrice);
          if (!isNaN(parsedPrice) && parsedPrice > 0) {
            itemUnitPrice = parsedPrice;
          }
        }
        // Try to get variantId from detail first
        itemVariantId = normalizeId(d?.variantId ?? d?.variant_id);
        itemModelId = normalizeId(d?.modelId ?? d?.model_id);
        
        // If variantId not found in detail, try to get from serialId using our map
        if (!itemVariantId && d?.serialId) {
          const serialId = d.serialId;
          // First, check if we already have this serialId mapped
          if (serialIdToVariantId.has(serialId)) {
            itemVariantId = serialIdToVariantId.get(serialId);
          } else {
            // Try to find variantId from modelId and variants
            // If model has only one variant, use that variant
            if (itemModelId && modelsForLookup) {
              const model = modelsForLookup.find(m => 
                normalizeId(m?.modelId ?? m?.model_id) === itemModelId
              );
              if (model) {
                const variants = model?.lists || [];
                // If model has only one variant, use it
                if (variants.length === 1) {
                  const vid = normalizeId(variants[0]?.variantId ?? variants[0]?.variant_id);
                  if (vid) {
                    itemVariantId = vid;
                    serialIdToVariantId.set(serialId, vid); // Cache for future use
                  }
                } else if (variants.length > 1) {
                  // Multiple variants: try to match by checking variant characteristics
                  // For now, use first variant as fallback
                  // In production, you'd fetch variantId from serialId via API
                  const vid = normalizeId(variants[0]?.variantId ?? variants[0]?.variant_id);
                  if (vid) {
                    itemVariantId = vid;
                    serialIdToVariantId.set(serialId, vid); // Cache for future use
                  }
                }
              }
            }
          }
        }
      } else {
        // Check for details array
        const details = getDetailArray(order);
        if (details.length > 0) {
          // If details array exists, sum quantities from all details
          details.forEach((d) => {
            const q = d?.quantity != null ? parseInt(d.quantity) : 0;
            if (!isNaN(q)) itemQuantity += q;
            if (d?.unitPrice != null) {
              const parsedPrice = parseFloat(d.unitPrice);
              if (!isNaN(parsedPrice) && parsedPrice > 0) {
                // Keep highest positive price (represent latest approval)
                if (itemUnitPrice == null || parsedPrice > itemUnitPrice) {
                  itemUnitPrice = parsedPrice;
                }
              }
            }
            if (!itemVariantId) {
              itemVariantId = normalizeId(d?.variantId ?? d?.variant_id);
              // If still not found, try to get from serialId
              if (!itemVariantId && d?.serialId) {
                const serialId = d.serialId;
                if (serialIdToVariantId.has(serialId)) {
                  itemVariantId = serialIdToVariantId.get(serialId);
                }
              }
            }
            if (!itemModelId) {
              itemModelId = normalizeId(d?.modelId ?? d?.model_id);
            }
          });
        } else {
          // When no details, try flattened fields on order object
          const q = order.quantity != null ? parseInt(order.quantity) : 0;
          if (!isNaN(q)) itemQuantity = q;
          if (order.unitPrice != null) {
            const parsedPrice = parseFloat(order.unitPrice);
            if (!isNaN(parsedPrice) && parsedPrice > 0) {
              itemUnitPrice = parsedPrice;
            }
          }
          itemVariantId = normalizeId(order.variantId ?? order.variant_id);
          itemModelId = normalizeId(order.modelId ?? order.model_id);
        }
      }

      // Fallback: get modelId from order object if not found in detail
      if (!itemModelId) {
        itemModelId = normalizeId(order.modelId ?? order.model_id);
      }

      // Resolve color and model from variant/model IDs or direct fields
      if (!itemColor) {
        itemColor =
          order.color ||
          order.colorName ||
          order.colour ||
          order.color_name ||
          (itemVariantId != null ? (variantIdToColor.get(itemVariantId) || '') : '');
      }
      if (!itemModel) {
        itemModel =
          order.modelName ||
          order.vehicleName ||
          (itemModelId ? (modelIdToModelName.get(itemModelId) || '') : '') ||
          (itemVariantId != null ? (variantIdToModelName.get(itemVariantId) || '') : '');
      }

      // Get confirmation agreement status
      const confirmation = order.confirmation;
      const agreement = confirmation?.agreement || order.agreement || '';
      const agreementLower = agreement.toString().toLowerCase();
      
      // Determine status from confirmation
      let itemStatus = 'Pending';
      if (agreementLower === 'agree') {
        itemStatus = 'Approved';
      } else if (agreementLower === 'disagree' || agreementLower === 'reject') {
        itemStatus = 'Rejected';
      }

      // Get or create grouped entry
      const existing = grouped.get(orderId);
      if (existing) {
        // Aggregate: add quantity to existing entry
        existing.quantity += itemQuantity;
        if (itemColor) existing._colors.add(itemColor);
        if (itemModel) existing._models.add(itemModel);
        if (itemUnitPrice != null && !isNaN(itemUnitPrice)) {
          existing._prices.add(itemUnitPrice);
        }
        // Keep the earliest date
        const newDate = order.orderDate || order.createdAt || order.date;
        if (newDate && (!existing.createdAt || newDate < existing.createdAt)) {
          existing.createdAt = newDate;
        }
        // Collect confirmation statuses
        existing._confirmations.add(itemStatus);
      } else {
        // Create new entry
        const priceSet = new Set();
        if (itemUnitPrice != null && !isNaN(itemUnitPrice)) {
          priceSet.add(itemUnitPrice);
        }
        grouped.set(orderId, {
          requestId: orderId,
          quantity: itemQuantity,
          status: itemStatus,
          createdAt: order.orderDate || order.createdAt || order.date || null,
          _models: new Set(itemModel ? [itemModel] : []),
          _colors: new Set(itemColor ? [itemColor] : []),
          _prices: priceSet,
          _confirmations: new Set([itemStatus]),
        });
      }
    });

    // Finalize rows: convert sets to display values
    const rows = Array.from(grouped.values()).map((r) => {
      const modelCount = r._models.size;
      const colorCount = r._colors.size;
      const priceCount = r._prices.size;
      const confirmations = r._confirmations || new Set();

      // Determine final price: use if all items share same price, otherwise null
      let finalPrice = null;
      if (priceCount === 1) {
        finalPrice = Array.from(r._prices)[0];
      }

      // Determine final status from all confirmations
      // If all are Approved -> Approved
      // If any is Rejected -> Rejected
      // Otherwise -> Pending
      let finalStatus = 'Pending';
      const confirmationArray = Array.from(confirmations);
      if (confirmationArray.length > 0) {
        if (confirmationArray.every(s => s === 'Approved')) {
          finalStatus = 'Approved';
        } else if (confirmationArray.some(s => s === 'Rejected')) {
          finalStatus = 'Rejected';
        } else {
          finalStatus = 'Pending';
        }
      }

      return {
        requestId: r.requestId,
        modelName: modelCount === 1 ? Array.from(r._models)[0] : modelCount > 1 ? 'Multiple Models' : 'N/A',
        color: colorCount === 1 ? Array.from(r._colors)[0] : colorCount > 1 ? 'Mixed' : (colorCount === 0 ? 'N/A' : ''),
        quantity: r.quantity, // This is now the aggregated total quantity
        price: finalPrice,
        status: finalStatus,
        createdAt: r.createdAt,
      };
    });

    return { success: true, data: rows };
  } catch (error) {
    console.error('Error fetching manufacturer requests:', error);
    handleAuthError(error);
    return { success: false, message: error.response?.data?.message || error.message, data: [] };
  }
};

