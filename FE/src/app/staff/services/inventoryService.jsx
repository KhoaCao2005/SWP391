import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Fix image URL - Thêm base URL nếu cần
 * @param {string} imageUrl - URL ảnh từ BE
 * @returns {string} - URL ảnh đã fix
 */
const fixImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  
  console.log('🖼️ Original image URL from BE:', imageUrl);
  
  // Nếu đã có http/https thì giữ nguyên
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    console.log('✅ URL already has protocol, keeping as is:', imageUrl);
    return imageUrl;
  }
  
  // Nếu là relative path (bắt đầu bằng /), thêm base URL
  if (imageUrl.startsWith('/')) {
    const baseUrl = API_URL.replace('/api', ''); // Remove /api
    const fixedUrl = `${baseUrl}${imageUrl}`;
    console.log('🔧 Fixed relative path:', fixedUrl);
    return fixedUrl;
  }
  
  // Nếu chỉ là filename (không có / và không có http), thêm base URL + /images/
  // Ví dụ: "tesla-model3-white.jpg" -> "https://.../images/tesla-model3-white.jpg"
  const baseUrl = API_URL.replace('/api', ''); // Remove /api
  const fixedUrl = `${baseUrl}/images/${imageUrl}`;
  console.log('🔧 Fixed filename with /images/ path:', fixedUrl);
  return fixedUrl;
};

/**
 * Fetches variants for a specific model
 * @param {number} modelId - The model ID
 * @returns {Promise} - Promise containing variants data
 */
export const fetchVariantsForModel = async (modelId) => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await axios.post(
      `${API_URL}/staff/searchVehicleVariant`,
      { id: modelId },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data && response.data.data && response.data.data.variants) {
      return response.data.data.variants;
    }
    return [];
  } catch (error) {
    // Handle errors gracefully - don't log as error if it's a 400 (bad request)
    // This might happen if the endpoint doesn't accept the parameter format or model doesn't exist
    if (error.response?.status === 400) {
      // 400 Bad Request - model might not have variants or endpoint format issue
      // Silently return empty array - this is expected for some models
      return [];
    }
    // For other errors, log as warning instead of error
    if (error.response?.status !== 404) {
      console.warn(`Warning: Could not fetch variants for model ${modelId}:`, error.response?.status, error.response?.statusText);
    }
    return [];
  }
};

/**
 * Fetch all active variants (backend supports model_id=0 to return all)
 * @returns {Promise<Array>} List of variants
 */
export const fetchAllVariants = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/staff/viewVehicleVariant`,
      { model_id: 0 },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    if (response.data && response.data.status === 'success') {
      return Array.isArray(response.data.data) ? response.data.data : [];
    }
    return [];
  } catch {
    return [];
  }
};

/**
 * Fetch available (unordered) serials for a variant at the staff's dealer
 * Backend: /api/staff/getUnorderedSerials
 * Body: { variant_id }
 * Returns: Array of serial DTOs; each should contain serialId/serial_id
 */
export const fetchAvailableSerialsByVariant = async (variantId) => {
  try {
    if (!variantId) return [];
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/staff/getUnorderedSerials`,
      { variant_id: variantId },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    if (response.data?.status === 'success') {
      const list = Array.isArray(response.data.data) ? response.data.data : [];
      return list;
    }
    return [];
  } catch {
    return [];
  }
};

/**
 * Fetches all inventory data from the backend
 * @returns {Promise} - Promise containing inventory data
 */
export const fetchInventory = async () => {
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
      `${API_URL}/staff/viewVehicle`,
      {}, // Empty body for POST request
      { headers }
    );

    if (response.data && response.data.data) {
      // Backend trả về List<VehicleModelDTO> - danh sách models trực tiếp
      const models = response.data.data;
      
      console.log('📦 Raw models from API:', models);
      console.log('📦 Number of models:', models?.length);
      
      // Fetch variants cho mỗi model (nếu chưa có)
      // Note: Some models may not have variants or the endpoint may fail - handle gracefully
      for (const model of models) {
        // Nếu model chưa có lists (variants), fetch thêm
        if (!model.lists || !Array.isArray(model.lists) || model.lists.length === 0) {
          try {
            console.log(`🔍 Fetching variants for model ${model.modelId}...`);
            const variants = await fetchVariantsForModel(model.modelId);
            model.lists = variants || []; // Set variants vào model (default to empty array)
            console.log(`✅ Found ${variants?.length || 0} variants for model ${model.modelId}`);
          } catch {
            // If variant fetch fails, set empty array and continue
            console.warn(`⚠️ Could not fetch variants for model ${model.modelId}, using empty array`);
            model.lists = [];
          }
        }
      }
      
      return {
        success: true,
        data: models // Trả về danh sách models, không phải inventory structure
      };
    } else {
      console.warn('⚠️ Invalid response format:', response.data);
      return {
        success: false,
        message: 'Invalid response format'
      };
    }
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch inventory data'
    };
  }
};

/**
 * Transform backend inventory data to frontend format
 * Chỉ lấy xe có hàng (isActive=true và quantity>0)
 * @param {Array} backendData - Data from backend API
 * @returns {Array} - Transformed data for frontend
 */
export const transformInventoryData = (backendData) => {
  console.log('🔄 Transforming inventory data:', backendData);
  
  if (!backendData || !Array.isArray(backendData)) {
    console.warn('⚠️ Invalid backend data format:', backendData);
    return [];
  }

  const transformedData = [];

  // Backend trả về List<VehicleModelDTO> trực tiếp, không có inventory wrapper
  backendData.forEach((model) => {
    console.log(`📦 Processing model: ${model.modelName} (ID: ${model.modelId})`);
    
    // Chỉ lấy model đang active
    if (!model.isActive) {
      console.log(`⏭️ Skipping inactive model: ${model.modelName}`);
      return;
    }

    // Check nếu có variants
    if (model.lists && Array.isArray(model.lists) && model.lists.length > 0) {
      console.log(`✅ Model ${model.modelName} has ${model.lists.length} variants`);
      
      // Có variants - iterate qua từng variant
      model.lists.forEach((variant) => {
        // Chỉ lấy variant đang active (có sẵn để bán)
        if (!variant.isActive) {
          console.log(`⏭️ Skipping inactive variant: ${variant.versionName}`);
          return;
        }

        transformedData.push({
          // Basic IDs
          id: `${model.modelName}-${variant.variantId}`,
          inventoryId: null, // Không có inventoryId từ viewVehicle API
          modelId: model.modelId,
          variantId: variant.variantId,
          
          // Display information
          title: `${model.modelName} ${variant.versionName}`,
          model: model.modelName,
          variant: variant.versionName,
          color: variant.color || 'N/A',
          description: model.description || '',
          
          // Pricing
          price: variant.price || 0,
          priceUsd: variant.price || 0,
          
          // Image - Fix URL nếu cần
          imageUrl: variant.image ? fixImageUrl(variant.image) : null,
          
          // Status - luôn là "available" vì đã filter active
          status: 'available',
          condition: 'New Vehicle',
          
          // Quantity - không có từ viewVehicle API, set default
          quantity: 1,
          
          // Location - không có từ API, set default
          location: 'N/A',
          
          // Active flags
          isActive: variant.isActive,
          modelActive: model.isActive
        });
      });
    } else {
      console.log(`⚠️ Model ${model.modelName} has no variants, showing as model-level item`);
      
      // KHÔNG có variants - hiển thị ở model level
      transformedData.push({
        // Basic IDs
        id: `model-${model.modelId}`,
        inventoryId: null,
        modelId: model.modelId,
        variantId: null,
        
        // Display information
        title: model.modelName,
        model: model.modelName,
        variant: 'Standard', // Default variant name
        color: 'N/A',
        description: model.description || '',
        
        // Pricing (default hoặc từ model nếu có)
        price: 0, // BE không có price ở model level
        priceUsd: 0,
        
        // Image - Fix URL nếu cần (model level không có image từ BE)
        imageUrl: null,
        
        // Status
        status: 'available',
        condition: 'New Vehicle',
        
        // Quantity - không có từ viewVehicle API
        quantity: 1,
        
        // Location
        location: 'N/A',
        
        // Active flags
        isActive: true,
        modelActive: model.isActive
      });
    }
  });

  console.log(`✅ Transformed ${transformedData.length} vehicles`);
  return transformedData;
};

