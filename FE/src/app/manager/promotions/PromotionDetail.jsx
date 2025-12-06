import React, { useState } from 'react';
import Layout from '../layout/Layout';
import { useParams, useNavigate } from 'react-router';
import {
  Tag,
  ChevronRight,
  X,
  Save,
  Building2,
  FileText,
  CheckSquare,
  Square,
  TrendingUp,
  Calendar,
  DollarSign,
  ArrowLeft
} from 'lucide-react';

const PromotionDetail = () => {
  const { promotionId: _promotionId } = useParams();
  const navigate = useNavigate();

  // Sample promotion data - in real app, would fetch from API
  const promotion = {
    id: 'PROMO-2025-001',
    code: 'SPRING2025',
    fromManufacturer: 'VinFast',
    vehicleModel: 'VF e34',
    vehicleVariant: 'Standard, Premium, Luxury',
    discountType: 'Percentage',
    value: 10,
    validFrom: '2025-11-01',
    validTo: '2025-12-31',
    dealerStatus: 'Active',
    appliedCount: 45,
    applicableVariants: ['VF e34 Standard', 'VF e34 Premium'],
    manufacturerRules: 'Valid for VF e34 models only. Cannot be combined with other promotions. Minimum purchase of 1 vehicle.'
  };

    // Available variants in showroom (from inventory)
  const availableVariants = [
    { id: 'var-001', name: 'VF e34 Standard', model: 'VF e34', inStock: true }, 
    { id: 'var-002', name: 'VF e34 Premium', model: 'VF e34', inStock: true },  
    { id: 'var-003', name: 'VF e34 Luxury', model: 'VF e34', inStock: true },   
    { id: 'var-004', name: 'VF 8 Standard', model: 'VF 8', inStock: true },     
    { id: 'var-005', name: 'VF 8 Premium', model: 'VF 8', inStock: true }       
  ];

  // Filter variants by promotion's vehicle model
  const relevantVariants = availableVariants.filter(v => v.model === promotion.vehicleModel);

  // State for selected variants
  const [selectedVariants, setSelectedVariants] = useState(
    availableVariants
      .filter(v => promotion.applicableVariants.includes(v.name))
      .map(v => v.id)
  );

  // Helper functions
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDiscountValue = (type, value) => {
    if (type === 'Percentage') {
      return `${value}%`;
    }
    return formatCurrency(value);
  };

  // Handle variant toggle
  const handleVariantToggle = (variantId) => {
    setSelectedVariants(prev => {
      if (prev.includes(variantId)) {
        return prev.filter(id => id !== variantId);
      } else {
        return [...prev, variantId];
      }
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedVariants.length === relevantVariants.length) {
      setSelectedVariants([]);
    } else {
      setSelectedVariants(relevantVariants.map(v => v.id));
    }
  };

  // Handle save
  const handleSave = () => {
    // In real app, would make API call to save variant configuration
    const selectedVariantNames = availableVariants
      .filter(v => selectedVariants.includes(v.id))
      .map(v => v.name);
    
    console.log('Saving variant configuration:', {
      promotionId: promotion.id,
      selectedVariants: selectedVariantNames
    });

    alert('Variant configuration saved successfully!');
    navigate('/manager/promotions');
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <span 
            className="hover:text-blue-600 cursor-pointer"
            onClick={() => navigate('/manager/promotions')}
          >
            Promotions
          </span>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 font-medium">Promotion Detail</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/manager/promotions')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{promotion.code}</h1>
              <p className="text-sm text-gray-600 mt-1">Promotion Configuration</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Manufacturer Rules (Read-only) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Promotion Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Tag className="w-5 h-5 mr-2 text-blue-600" />
                Promotion Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-600">Promotion Code</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{promotion.code}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-600 flex items-center">
                    <Building2 className="w-3 h-3 mr-1" />
                    From Manufacturer
                  </label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{promotion.fromManufacturer}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-600">Vehicle Model</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{promotion.vehicleModel}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-600">Discount Type</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{promotion.discountType}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-600 flex items-center">
                    <DollarSign className="w-3 h-3 mr-1" />
                    Discount Value
                  </label>
                  <p className="text-sm font-semibold text-blue-600 mt-1">
                    {formatDiscountValue(promotion.discountType, promotion.value)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-600 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      Valid From
                    </label>
                    <p className="text-sm font-medium text-gray-900 mt-1">{formatDate(promotion.validFrom)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Valid To</label>
                    <p className="text-sm font-medium text-gray-900 mt-1">{formatDate(promotion.validTo)}</p>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-600 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Times Applied
                  </label>
                  <p className="text-sm font-semibold text-green-600 mt-1">{promotion.appliedCount} orders</p>
                </div>
              </div>
            </div>

            {/* Manufacturer Rules */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-gray-600" />
                Manufacturer Rules
              </h2>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{promotion.manufacturerRules}</p>
              </div>
              <p className="text-xs text-gray-500 mt-3 italic">
                These rules are set by the manufacturer and cannot be modified.
              </p>
            </div>
          </div>

          {/* Right Column - Local Configuration */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CheckSquare className="w-5 h-5 mr-2 text-green-600" />
                Apply to Below Variants in Showroom
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Select which variants in your showroom this promotion should apply to. This is your local configuration.
              </p>

              {/* Select All */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  {selectedVariants.length === relevantVariants.length ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  <span>
                    {selectedVariants.length === relevantVariants.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </span>
                </button>
              </div>

              {/* Variants List */}
              <div className="space-y-3">
                {relevantVariants.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No variants available for this promotion model.</p>
                  </div>
                ) : (
                  relevantVariants.map((variant) => {
                    const isSelected = selectedVariants.includes(variant.id);
                    return (
                      <div
                        key={variant.id}
                        onClick={() => handleVariantToggle(variant.id)}
                        className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">{variant.name}</span>
                            {variant.inStock && (
                              <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                                In Stock
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Model: {variant.model}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Summary */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-900">
                    Selected Variants: <span className="text-blue-600">{selectedVariants.length}</span> of{' '}
                    {relevantVariants.length}
                  </p>
                  {selectedVariants.length > 0 && (
                    <p className="text-xs text-gray-600 mt-2">
                      {availableVariants
                        .filter(v => selectedVariants.includes(v.id))
                        .map(v => v.name)
                        .join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PromotionDetail;

