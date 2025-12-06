import React, { useEffect, useMemo, useState } from 'react';
import { X, Loader2, Sparkles } from 'lucide-react';
import { fetchInventory } from '../services/inventoryService';
import { createDealerCustomOrder } from '../services/orderService';

const initialFormState = {
  modelId: '',
  variantId: '',
  quantity: 1,
  desiredColor: '',
  desiredVersion: '',
  notes: '',
};

const CustomVehicleOrderModal = ({ isOpen, onClose, onSuccess }) => {
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [inventoryError, setInventoryError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [form, setForm] = useState(initialFormState);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    const loadInventory = async () => {
      setLoadingInventory(true);
      setInventoryError('');
      try {
        const response = await fetchInventory();
        if (!mounted) return;
        if (response.success && Array.isArray(response.data)) {
          setInventory(response.data);
          if (response.data.length === 0) {
            setInventoryError('No vehicle models available. Please add inventory first.');
          }
        } else {
          setInventory([]);
          setInventoryError(response.message || 'Failed to load inventory.');
        }
      } catch (error) {
        if (!mounted) return;
        console.error('Error loading inventory for custom order:', error);
        setInventory([]);
        setInventoryError(error.message || 'Failed to load inventory.');
      } finally {
        if (mounted) setLoadingInventory(false);
      }
    };

    loadInventory();

    return () => {
      mounted = false;
      setForm(initialFormState);
      setSubmitError('');
    };
  }, [isOpen]);

  const selectedModel = useMemo(() => {
    if (!form.modelId) return null;
    return inventory.find(
      (model) => String(model.modelId || model.id) === String(form.modelId)
    ) || null;
  }, [form.modelId, inventory]);

  const variantOptions = useMemo(() => {
    if (!selectedModel || !Array.isArray(selectedModel.lists)) return [];
    return selectedModel.lists.map((variant) => ({
      id: variant.variantId ?? variant.id,
      label: [
        variant.versionName || variant.variantName || 'Standard',
        variant.color || 'Unknown color',
        variant.price != null ? `${Number(variant.price).toLocaleString('en-US')}₫` : null,
      ]
        .filter(Boolean)
        .join(' • '),
      raw: variant,
    }));
  }, [selectedModel]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'quantity' ? Math.max(1, Number(value) || 1) : value,
    }));
    if (name === 'modelId') {
      setForm((prev) => ({
        ...prev,
        variantId: '',
      }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.modelId) {
      setSubmitError('Please select a vehicle model.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    try {
      const payload = {
        modelId: form.modelId,
        quantity: form.quantity,
      };
      if (form.variantId) {
        payload.variantId = form.variantId;
      }
      const result = await createDealerCustomOrder(payload);
      if (!result.success) {
        setSubmitError(result.message || 'Failed to submit custom order.');
        return;
      }

      if (typeof onSuccess === 'function') {
        onSuccess({
          ...form,
          response: result,
        });
      }
      setForm(initialFormState);
      onClose();
    } catch (error) {
      console.error('Error creating custom order:', error);
      setSubmitError(error.message || 'Failed to submit custom order.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-start justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
          <div className="pr-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-200" />
              Custom Vehicle Request
            </h2>
            <p className="text-sm text-indigo-100 mt-1">
              Submit a special build request for manufacturer/EVM approval.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-all duration-200"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {inventoryError && (
              <div className="p-3 border border-red-200 bg-red-50 text-red-700 rounded-md text-sm">
                {inventoryError}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">
                  Vehicle Model <span className="text-red-500">*</span>
                </label>
                <select
                  name="modelId"
                  value={form.modelId}
                  onChange={handleChange}
                  disabled={loadingInventory || inventory.length === 0}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a model...</option>
                  {inventory.map((model) => (
                    <option key={model.modelId || model.id} value={model.modelId || model.id}>
                      {model.modelName || model.name || `Model ${model.modelId}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">
                  Base Variant (optional)
                </label>
                <select
                  name="variantId"
                  value={form.variantId}
                  onChange={handleChange}
                  disabled={!selectedModel || variantOptions.length === 0}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Auto-generate new variant</option>
                  {variantOptions.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.label}
                    </option>
                  ))}
                </select>
                {!selectedModel && (
                  <p className="text-xs text-gray-500">
                    Select a model first to view available variants.
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">
                  Desired Color
                </label>
                <input
                  name="desiredColor"
                  value={form.desiredColor}
                  onChange={handleChange}
                  placeholder="e.g., Midnight Blue"
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500">
                  This information will be shared with EVM during approval.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">
                  Desired Version Name
                </label>
                <input
                  name="desiredVersion"
                  value={form.desiredVersion}
                  onChange={handleChange}
                  placeholder="e.g., Falcon AWD Signature"
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Notes</label>
                <input
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Any additional requirements"
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-semibold mb-1">What happens next?</p>
              <ul className="list-disc list-inside space-y-1">
                <li>The request is sent to the EVM team for approval.</li>
                <li>
                  Once approved, the order will appear in the dealer workflow for payment and delivery.
                </li>
                <li>
                  Desired color/version are advisory; EVM will confirm final specifications during approval.
                </li>
              </ul>
            </div>

            {submitError && (
              <div className="p-3 border border-red-200 bg-red-50 text-red-700 rounded-md text-sm">
                {submitError}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={() => {
                setForm(initialFormState);
                setSubmitError('');
                onClose();
              }}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !form.modelId || loadingInventory}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Submit Custom Order
                </>
              )}
            </button>
          </div>
        </form>

        {loadingInventory && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomVehicleOrderModal;

