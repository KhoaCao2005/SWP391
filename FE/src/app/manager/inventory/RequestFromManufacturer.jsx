import React, { useState, useEffect } from 'react';
import Layout from '../layout/Layout';
import { useNavigate } from 'react-router';
import { ArrowLeft, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { getBrands, getModelsByBrand, getColorsByBrandAndModel, createManufacturerRequest } from '../services/inventoryService';

// Toast Notification Component
const Toast = ({ message, type = 'success', isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-right duration-300">
      <div className={`rounded-lg shadow-lg p-4 min-w-[300px] flex items-center space-x-3 ${
        type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      }`}>
        {type === 'success' ? (
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
        ) : (
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
        )}
        <p className={`text-sm font-medium flex-1 ${
          type === 'success' ? 'text-green-800' : 'text-red-800'
        }`}>
          {message}
        </p>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <span className="text-lg">×</span>
        </button>
      </div>
    </div>
  );
};

const RequestFromManufacturer = () => {
  const navigate = useNavigate();
  const [brands, setBrands] = useState([]);
  const [availableModels, setAvailableModels] = useState([]);
  const [availableColors, setAvailableColors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
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
    const brandsList = getBrands();
    setBrands(brandsList);
  }, []);

  // Update models when brand changes
  useEffect(() => {
    if (formData.brand) {
      const models = getModelsByBrand(formData.brand);
      setAvailableModels(models);
      // Reset model and color when brand changes
      setFormData(prev => ({ ...prev, model: '', color: '' }));
      setAvailableColors([]);
    } else {
      setAvailableModels([]);
      setAvailableColors([]);
    }
  }, [formData.brand]);

  // Update colors when model changes
  useEffect(() => {
    if (formData.brand && formData.model) {
      const colors = getColorsByBrandAndModel(formData.brand, formData.model);
      setAvailableColors(colors);
      // Reset color when model changes
      setFormData(prev => ({ ...prev, color: '' }));
    } else {
      setAvailableColors([]);
    }
  }, [formData.brand, formData.model]);

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
        setShowToast(true);
        setTimeout(() => {
          navigate('/manager/inventory/manufacturer-requests');
        }, 1500);
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      setErrors({ submit: 'Failed to submit request. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/manager/inventory/manufacturer-requests');
  };

  return (
    <Layout>
      <div className="max-w-[900px] mx-auto py-8 px-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleCancel}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create Manufacturer Request</h1>
          <p className="text-base text-gray-600">Submit request to manufacturer for additional stock</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Brand Field */}
              <div className="md:col-span-2">
                <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-2">
                  Brand <span className="text-red-500">*</span>
                </label>
                <select
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className={`w-full h-[40px] px-4 border rounded-[10px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                    errors.brand ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Select Brand</option>
                  {brands.map(brand => (
                    <option key={brand.brandId} value={brand.brandName}>
                      {brand.brandName}
                    </option>
                  ))}
                </select>
                {errors.brand && (
                  <p className="mt-1 text-sm text-red-600">{errors.brand}</p>
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
                  disabled={!formData.brand}
                  className={`w-full h-[40px] px-4 border rounded-[10px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                    errors.model ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  } ${!formData.brand ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  required
                >
                  <option value="">Select Model</option>
                  {availableModels.map((model, idx) => (
                    <option key={idx} value={model.modelName}>
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

              {/* Price Field */}
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  Price (per unit)
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className={`w-full h-[40px] px-4 border rounded-[10px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                    errors.price ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Optional"
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                )}
              </div>

              {/* Notes Field */}
              <div className="md:col-span-2">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Note / Additional Request
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
            </div>

            {/* Error Message */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-[10px] p-4 flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-800">{errors.submit}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center justify-center space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-8 py-3 text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-[10px] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
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

      {/* Toast Notification */}
      <Toast
        message="Request submitted successfully"
        type="success"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </Layout>
  );
};

export default RequestFromManufacturer;

