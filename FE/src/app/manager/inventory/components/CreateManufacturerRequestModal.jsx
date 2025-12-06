import React, { useState, useEffect } from 'react';
import { X, Send, AlertCircle, DollarSign } from 'lucide-react';
import { getCachedVehicleModels, createManufacturerRequest } from '../../services/inventoryService';

const normalizeBrand = (brandName, modelName) => {
  if (brandName && typeof brandName === 'string') {
    return brandName.trim();
  }
  if (modelName && typeof modelName === 'string') {
    const [firstWord] = modelName.trim().split(/\s+/);
    return firstWord || '';
  }
  return '';
};

const buildBrandList = (models) => {
  const brandMap = new Map();
  models.forEach((model) => {
    const brand = normalizeBrand(model?.brandName, model?.modelName);
    if (!brand) return;
    const key = brand.toLowerCase();
    if (!brandMap.has(key)) {
      brandMap.set(key, {
        brandId: brandMap.size + 1,
        brandName: brand,
      });
    }
  });
  return Array.from(brandMap.values());
};

const filterModelsByBrand = (models, brand) => {
  if (!Array.isArray(models) || models.length === 0) return [];
  if (!brand) return models;
  const normalizedBrand = brand.trim().toLowerCase();
  const filtered = models.filter((model) => {
    const modelBrand = normalizeBrand(model?.brandName, model?.modelName);
    return modelBrand.toLowerCase() === normalizedBrand;
  });
  return filtered.length > 0 ? filtered : models;
};

const getColorsForModel = (model) => {
  if (!model || !Array.isArray(model.lists)) return [];
  const colors = new Set();
  model.lists.forEach((variant) => {
    if (variant?.isActive === false) return;
    if (variant?.color) {
      colors.add(variant.color);
    }
  });
  return Array.from(colors);
};

const getVariantPrice = (model, color) => {
  if (!model || !Array.isArray(model.lists)) return null;
  const variant = model.lists.find(
    (item) =>
      item?.color === color &&
      (item?.isActive !== false)
  );
  if (!variant) return null;
  return typeof variant.price === 'number' ? variant.price : Number(variant.price ?? NaN);
};

const CreateManufacturerRequestModal = ({ isOpen, onClose, onSuccess }) => {
  const [brands, setBrands] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [catalogError, setCatalogError] = useState('');
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [availableModels, setAvailableModels] = useState([]);
  const [availableColors, setAvailableColors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    color: '',
    quantity: '',
    price: '',
    notes: ''
  });

  // Load brands on mount
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const initializeModal = async () => {
      setErrors({});
      setCatalogError('');
      setLoadingCatalog(true);
      setAvailableColors([]);

      try {
        const modelsData = await getCachedVehicleModels();
        if (cancelled) return;

        const rawCatalog = Array.isArray(modelsData) ? modelsData : [];
        const fallbackCatalog =
          rawCatalog.length > 0
            ? rawCatalog
            : (catalog && catalog.length > 0 ? catalog : []);

        setCatalog(fallbackCatalog);

        if (fallbackCatalog.length === 0) {
          setCatalogError('Không thể tải danh sách mẫu xe. Vui lòng thử lại sau.');
          setBrands([]);
          setFormData({
            brand: '',
            model: '',
            color: '',
            quantity: '',
            price: '',
            notes: ''
          });
          return;
        }

        setCatalogError('');

        const brandOptions = buildBrandList(fallbackCatalog);
        setBrands(brandOptions);

        const preferredBrand =
          brandOptions.find((b) => (b.brandName || '').toLowerCase() === 'ev')
            ?.brandName ||
          brandOptions[0]?.brandName ||
          'EV';

        setFormData({
          brand: preferredBrand || '',
          model: '',
          color: '',
          quantity: '',
          price: '',
          notes: ''
        });
      } catch (error) {
        if (cancelled) return;
        console.error('Error loading vehicle catalog for manufacturer request:', error);
        setCatalog([]);
        setBrands([]);
        setFormData({
          brand: '',
          model: '',
          color: '',
          quantity: '',
          price: '',
          notes: ''
        });
        setCatalogError('Không thể tải danh sách mẫu xe. Vui lòng thử lại sau.');
      } finally {
        if (!cancelled) {
          setLoadingCatalog(false);
        }
      }
    };

    initializeModal();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Update models when brand changes
  useEffect(() => {
    if (!isOpen) return;
    const brand = formData.brand;

    if (!brand) {
      setAvailableModels([]);
      setAvailableColors([]);
      return;
    }

    const modelsForBrand = filterModelsByBrand(catalog, brand);
    setAvailableModels(modelsForBrand);
    setAvailableColors([]);

    setFormData((prev) => {
      if (prev.model || prev.color || prev.price) {
        return {
          ...prev,
          model: '',
          color: '',
          price: ''
        };
      }
      return prev;
    });
  }, [formData.brand, catalog, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const { brand, model } = formData;
    if (!brand || !model) {
      setAvailableColors([]);
      return;
    }

    const modelsForBrand = filterModelsByBrand(catalog, brand);
    const targetModel = modelsForBrand.find((item) => item?.modelName === model);
    const colors = targetModel ? getColorsForModel(targetModel) : [];
    setAvailableColors(colors);

    setFormData((prev) => {
      if (!colors.includes(prev.color)) {
        return {
          ...prev,
          color: '',
          price: ''
        };
      }
      return prev;
    });
  }, [formData.brand, formData.model, catalog, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const { brand, model, color } = formData;
    if (!brand || !model || !color) return;

    const modelsForBrand = filterModelsByBrand(catalog, brand);
    const targetModel = modelsForBrand.find((item) => item?.modelName === model);
    if (!targetModel) return;

    const price = getVariantPrice(targetModel, color);
    if (price == null || Number.isNaN(price)) return;

    const formatted = price.toString();
    setFormData((prev) => (prev.price === formatted ? prev : { ...prev, price: formatted }));
  }, [formData.brand, formData.model, formData.color, catalog, isOpen]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Format price for display (remove $ and commas for calculation)
  const formatPriceInput = (value) => {
    // Remove any non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    return numericValue;
  };

  // Handle price input with currency formatting
  const handlePriceChange = (e) => {
    const rawValue = formatPriceInput(e.target.value);
    setFormData(prev => ({
      ...prev,
      price: rawValue
    }));
    if (errors.price) {
      setErrors(prev => ({
        ...prev,
        price: ''
      }));
    }
  };

  // Format price for display
  const displayPrice = (value) => {
    if (!value) return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    return numValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.brand) {
      newErrors.brand = 'Brand is required';
    }
    if (!formData.model) {
      newErrors.model = 'Model is required';
    }
    if (!formData.color) {
      newErrors.color = 'Color is required';
    }
    if (!formData.quantity || parseInt(formData.quantity) < 1) {
      newErrors.quantity = 'Quantity must be at least 1';
    }
    if (formData.price && parseFloat(formData.price) < 0) {
      newErrors.price = 'Price must be 0 or greater';
    }
    if (formData.notes && formData.notes.length > 500) {
      newErrors.notes = 'Notes cannot exceed 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const requestData = {
        brand: formData.brand,
        model: formData.model,
        color: formData.color,
        quantity: parseInt(formData.quantity),
        price: formData.price ? parseFloat(formData.price) : null,
        notes: formData.notes.trim()
      };

      const result = await createManufacturerRequest(requestData);
      
      if (result.success) {
        if (onSuccess) {
          onSuccess(result.data);
        }
        onClose();
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      setErrors({ submit: 'Failed to submit request. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full my-auto animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex-1 pr-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Create Manufacturer Request</h2>
            <p className="text-sm text-gray-600">Fill in the details to create a new request.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110 flex-shrink-0"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Form - Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-5">
            {/* Brand Field */}
            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-2">
                Brand <span className="text-red-500">*</span>
              </label>
              <select
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                disabled
                className={`w-full h-[40px] px-4 border rounded-[10px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                  errors.brand ? 'border-red-300 bg-red-50' : 'border-gray-300'
                } ${'bg-gray-100 cursor-not-allowed'}`}
                required
              >
                {brands.length > 0 ? (
                  brands.map((brand) => (
                    <option key={brand.brandId} value={brand.brandName}>
                      {brand.brandName}
                    </option>
                  ))
                ) : (
                  <option value="">
                    {loadingCatalog ? 'Loading...' : 'No brand available'}
                  </option>
                )}
              </select>
              {errors.brand && (
                <p className="mt-1 text-sm text-red-600">{errors.brand}</p>
              )}
              {catalogError && (
                <p className="mt-1 text-sm text-red-600">{catalogError}</p>
              )}
            </div>

            {/* Model Field */}
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
                Model <span className="text-red-500">*</span>
              </label>
              <select
                id="model"
                name="model"
                value={formData.model}
                onChange={handleChange}
                disabled={!formData.brand || loadingCatalog}
                className={`w-full h-[40px] px-4 border rounded-[10px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                  errors.model ? 'border-red-300 bg-red-50' : 'border-gray-300'
                } ${!formData.brand || loadingCatalog ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                required
              >
                <option value="">Select Model</option>
                {availableModels.map((model) => (
                  <option key={model.modelId ?? model.modelName} value={model.modelName}>
                    {model.modelName}
                  </option>
                ))}
              </select>
              {errors.model && (
                <p className="mt-1 text-sm text-red-600">{errors.model}</p>
              )}
            </div>

            {/* Color Field */}
            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-2">
                Color <span className="text-red-500">*</span>
              </label>
              <select
                id="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                disabled={!formData.model}
                className={`w-full h-[40px] px-4 border rounded-[10px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                  errors.color ? 'border-red-300 bg-red-50' : 'border-gray-300'
                } ${!formData.model ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                required
              >
                <option value="">Select Color</option>
                {availableColors.map((color, idx) => (
                  <option key={idx} value={color}>
                    {color}
                  </option>
                ))}
              </select>
              {errors.color && (
                <p className="mt-1 text-sm text-red-600">{errors.color}</p>
              )}
            </div>

            {/* Quantity Field */}
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="1"
                className={`w-full h-[40px] px-4 border rounded-[10px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                  errors.quantity ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter quantity"
                required
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
              )}
            </div>

            {/* Price Field with $ symbol */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                Price per Unit (USD)
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  <DollarSign className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  id="price"
                  name="price"
                  value={displayPrice(formData.price)}
                  onChange={handlePriceChange}
                  className={`w-full h-[40px] pl-10 pr-4 border rounded-[10px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                    errors.price ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Auto-filled or enter manually"
                />
              </div>
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price}</p>
              )}
              {formData.color && formData.price && (
                <p className="mt-1 text-xs text-gray-500">Price auto-filled based on model and color</p>
              )}
            </div>

            {/* Notes Field */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="4"
                maxLength={500}
                className={`w-full px-4 py-3 border rounded-[10px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors resize-none ${
                  errors.notes ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Add any additional notes or special requests (optional)"
              />
              <div className="flex items-center justify-between mt-1">
                {errors.notes && (
                  <p className="text-sm text-red-600">{errors.notes}</p>
                )}
                <p className={`text-sm ml-auto ${
                  formData.notes.length > 450 ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {formData.notes.length}/500 characters
                </p>
              </div>
            </div>

            {/* Error Message */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-[10px] p-4 flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-800">{errors.submit}</p>
              </div>
            )}
          </div>
          </div>

          {/* Footer Buttons - Fixed at Bottom */}
          <div className="flex items-center justify-end space-x-4 p-6 pt-4 border-t border-gray-200 flex-shrink-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-[10px] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateManufacturerRequestModal;

