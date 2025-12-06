import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { CheckCircle, XCircle, RefreshCw, Search, Clock, BadgeCheck } from 'lucide-react';
import { getAllConfirmations, approveCustomOrder } from '../../services/approvalsService';

const Approvals = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [onlyPending, setOnlyPending] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [customApprovalModal, setCustomApprovalModal] = useState({
    open: false,
    row: null,
    versionName: '',
    color: '',
    unitPrice: '',
    error: '',
    availableColors: [],
  });
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    type: '', // 'approve' | 'reject'
    orderId: null,
    row: null,
  });
  const [successModal, setSuccessModal] = useState({
    open: false,
    message: '',
    type: '', // 'approved' or 'rejected'
  });
  const [rejectConfirmModal, setRejectConfirmModal] = useState({
    open: false,
    orderId: null,
    row: null,
  });

  const getCustomerId = useCallback((entry) => {
    if (!entry) return null;
    const raw = entry.firstItem || entry;
    const value =
      raw?.customerId ??
      raw?.customer_id ??
      entry.customerId ??
      entry.customer_id ??
      null;
    if (value === null || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }, []);

  const isStaffCustomOrder = useCallback(
    (entry) => {
      const customerId = getCustomerId(entry);
      return customerId != null && customerId > 0;
    },
    [getCustomerId]
  );

  const isManufacturerRequest = useCallback(
    (entry) => {
      const customerId = getCustomerId(entry);
      return customerId == null || customerId === 0;
    },
    [getCustomerId]
  );

  const resolveIsCustom = useCallback(
    (entry) => isStaffCustomOrder(entry),
    [isStaffCustomOrder]
  );

  const disallowedAgreements = useMemo(
    () => new Set(['reject', 'rejected', 'disagree', 'disagreed', 'disapprove', 'disapproved']),
    []
  );

  const isRowRejected = useCallback(
    (entry) => {
      if (!entry) return false;
      if (entry.isRejected) return true;
      const agreementCandidates = [
        entry.agreement,
        entry.status,
        entry.firstItem?.agreement,
        entry.firstItem?.status,
      ];
      return agreementCandidates.some((val) => {
        if (!val && val !== 0) return false;
        return disallowedAgreements.has(String(val).toLowerCase().trim());
      });
    },
    [disallowedAgreements]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAllConfirmations();
      if (res.success) {
        const incoming = Array.isArray(res.data) ? res.data : [];
        setItems(incoming.filter((entry) => !isRowRejected(entry)));
      } else {
        const incoming = Array.isArray(res.data) ? res.data : [];
        setItems(incoming.filter((entry) => !isRowRejected(entry)));
        setError(res.message || 'Failed to load approvals');
      }
    } catch (e) {
      console.error(e);
      setError('Failed to load approvals');
    } finally {
      setLoading(false);
    }
  }, [isRowRejected]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    let data = Array.isArray(items) ? items.filter((entry) => !isRowRejected(entry)) : [];
    if (onlyPending) {
      data = data.filter((i) => {
        if (i.isPending !== undefined) return i.isPending;
        const agreement = (i.agreement || i.status || '').toString().toLowerCase();
        return !['agree', 'approved'].includes(agreement);
      });
    }
    if (typeFilter !== 'all') {
      data = data.filter((i) => {
        const isCustom = resolveIsCustom(i);
        return typeFilter === 'custom' ? isCustom : !isCustom;
      });
    }
    if (query) {
      const q = query.toLowerCase();
      data = data.filter((i) =>
        `${i.orderId || i.order_id || ''}`.toLowerCase().includes(q) ||
        `${i.model || ''}`.toLowerCase().includes(q) ||
        `${i.color || ''}`.toLowerCase().includes(q)
      );
    }
    return data;
  }, [items, query, onlyPending, typeFilter, isRowRejected, resolveIsCustom]);

  const handleDecision = async (row, decision, extra = {}) => {
    const resolvedOrderId = row?.orderId || row?.order_id || null;
    if (!resolvedOrderId) {
      setError('Unable to determine order ID for this request');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await approveCustomOrder({
        orderId: resolvedOrderId,
        decision,
        ...extra,
      });
      if (!res.success) {
        setError(res.message || 'Action failed');
      } else {
        setError('');
        // Show success modal
        setSuccessModal({
          open: true,
          message: decision === 'Agree' 
            ? `Order #${resolvedOrderId} has been approved successfully!`
            : `Order #${resolvedOrderId} has been rejected.`,
          type: decision === 'Agree' ? 'approved' : 'rejected',
        });
      }
    } catch (err) {
      setError(err.message || 'Action failed');
    } finally {
      await load();
      setLoading(false);
    }
  };

  const openConfirmModal = (row, type) => {
    const resolvedOrderId = row?.orderId || row?.order_id || null;
    if (!resolvedOrderId) {
      setError('Unable to determine order ID for this request');
      return;
    }
    setConfirmModal({
      open: true,
      type,
      orderId: resolvedOrderId,
      row,
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal({ open: false, type: '', orderId: null, row: null });
  };

  const confirmDecision = async () => {
    if (!confirmModal.row) return;
    const decision = confirmModal.type === 'approve' ? 'Agree' : 'Disagree';
    const row = confirmModal.row.firstItem || confirmModal.row;
    closeConfirmModal();
    await handleDecision(row, decision);
  };

  const closeCustomApprovalModal = () => {
    setCustomApprovalModal({
      open: false,
      row: null,
      versionName: '',
      color: '',
      unitPrice: '',
      error: '',
      availableColors: [],
    });
  };

  const submitCustomApproval = async () => {
    if (!customApprovalModal.row) return;
    const versionName = customApprovalModal.versionName.trim();
    const color = customApprovalModal.color.trim();
    const unitPriceValue = Number(customApprovalModal.unitPrice);

    if (!versionName || !color || !Number.isFinite(unitPriceValue) || unitPriceValue <= 0) {
      setCustomApprovalModal((prev) => ({
        ...prev,
        error: 'Please provide version name, color, and a valid unit price greater than 0.',
      }));
      return;
    }

    setCustomApprovalModal((prev) => ({ ...prev, error: '' }));
    await handleDecision(customApprovalModal.row, 'Agree', {
      versionName,
      color,
      unitPrice: unitPriceValue,
    });
    closeCustomApprovalModal();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <BadgeCheck className="w-6 h-6 text-blue-600" />
          Approvals
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by Order ID, Model, or Color"
            className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={onlyPending} onChange={(e) => setOnlyPending(e.target.checked)} />
          Show only pending
        </label>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <span>Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All</option>
            <option value="custom">Custom</option>
            <option value="standard">Standard</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3 border border-red-200 text-red-700 rounded-md bg-red-50 text-sm">{error}</div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price (Unit)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agreement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((row, idx) => {
                const orderId = row.orderId || row.order_id;
                const model = row.model || 'N/A';
                const color = row.color || 'N/A';
                const quantity = row.quantity || 0;
                const price = row.price;
                const agreementRaw = row.agreement || row.status || '';
                const date = row.date || row.date_time || '';
                const isPending = row.isPending !== undefined ? row.isPending :
                  (!agreementRaw || agreementRaw.toString().toLowerCase() === 'pending');
              const agreementLower = agreementRaw ? agreementRaw.toString().toLowerCase().trim() : '';
                const isApproved = row.isApproved ?? (agreementLower === 'agree' || agreementLower === 'approved');
              const isRejected = row.isRejected ?? (agreementLower === 'reject' || agreementLower === 'rejected' || agreementLower === 'disagree' || agreementLower === 'disagreed');
                const isCustomOrder = isStaffCustomOrder(row);

              if (isRejected) {
                return null;
              }

                return (
                  <tr key={`${orderId}-${idx}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{orderId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${
                          isCustomOrder
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {isCustomOrder ? 'Custom' : 'Standard'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{model}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{color}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {price != null ? `$${Number(price).toLocaleString('en-US')}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isPending ? (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      ) : isApproved ? (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 inline-flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Approved
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 inline-flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Rejected
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {date ? new Date(date).toLocaleString('vi-VN') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          disabled={!isPending || loading}
                          onClick={() => {
                            const baseRow = row.firstItem || row;
                            if (isStaffCustomOrder(baseRow)) {
                              setCustomApprovalModal({
                                open: true,
                                row: baseRow,
                                versionName: '',
                                color: '',
                                unitPrice: '',
                                error: '',
                                availableColors:
                                  (row.availableColors && row.availableColors.length > 0
                                    ? row.availableColors
                                    : baseRow.availableColors) || [],
                              });
                            } else {
                              openConfirmModal(baseRow, 'approve');
                            }
                          }}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium ${
                            isPending ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          disabled={!isPending || loading}
                          onClick={() => openConfirmModal(row.firstItem || row, 'reject')}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium ${
                            isPending ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td className="px-6 py-10 text-center text-sm text-gray-500" colSpan={8}>
                    No requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approval/Rejection Confirmation Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {confirmModal.type === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {confirmModal.type === 'approve'
                  ? `Are you sure you want to approve order #${confirmModal.orderId}?`
                  : `Are you sure you want to reject order #${confirmModal.orderId}? This action cannot be undone.`}
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={closeConfirmModal}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDecision}
                disabled={loading}
                className={`px-4 py-2 text-sm rounded-md text-white ${
                  confirmModal.type === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-60`}
              >
                {confirmModal.type === 'approve' ? 'Confirm Approve' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {customApprovalModal.open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Approve Custom Order</h2>
              <p className="text-sm text-gray-500 mt-1">
                Provide the final variant details before approving order #
                {customApprovalModal.row?.orderId || customApprovalModal.row?.order_id}.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Version Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customApprovalModal.versionName}
                  onChange={(e) =>
                    setCustomApprovalModal((prev) => ({ ...prev, versionName: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Falcon AWD Signature"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color <span className="text-red-500">*</span>
                </label>
                {customApprovalModal.availableColors?.length ? (
                  <select
                    value={customApprovalModal.color}
                    onChange={(e) =>
                      setCustomApprovalModal((prev) => ({ ...prev, color: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a color...</option>
                    {customApprovalModal.availableColors.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={customApprovalModal.color}
                    onChange={(e) =>
                      setCustomApprovalModal((prev) => ({ ...prev, color: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter color"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Price (₫) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={customApprovalModal.unitPrice}
                  onChange={(e) =>
                    setCustomApprovalModal((prev) => ({ ...prev, unitPrice: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter unit price"
                />
              </div>
              {customApprovalModal.error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                  {customApprovalModal.error}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={closeCustomApprovalModal}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={submitCustomApproval}
                disabled={loading}
                className="px-4 py-2 text-sm rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-60"
              >
                Approve Custom Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Modal */}
      {successModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center gap-4">
              {successModal.type === 'approved' ? (
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              ) : (
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">
                  {successModal.type === 'approved' ? 'Approved Successfully!' : 'Rejected Successfully!'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {successModal.message}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end pt-2">
              <button
                onClick={() => setSuccessModal({ open: false, message: '', type: '' })}
                className={`px-4 py-2 text-sm rounded-md text-white ${
                  successModal.type === 'approved' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Approvals;