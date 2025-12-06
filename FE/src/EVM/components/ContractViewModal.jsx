import React from 'react'
import { X, FileText } from 'lucide-react'

const ContractViewModal = ({ open, contract, onClose }) => {
  if (!open || !contract) return null
  const progress = Math.min(100, Math.round((contract.achieved / Math.max(1, contract.target)) * 100))
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Contract Details</h2>
              <p className="text-sm text-gray-600">View contract information</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Contract Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Contract ID</label>
                <p className="text-base font-semibold text-gray-900">{contract.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Dealer</label>
                <p className="text-base font-semibold text-gray-900">{contract.dealer}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Period</label>
                <p className="text-base text-gray-900">{contract.period}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${contract.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{contract.status}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Target & Achievement</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Target (units)</label>
                <p className="text-base font-semibold text-gray-900">{contract.target}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Achieved (units)</label>
                <p className="text-base font-semibold text-gray-900">{contract.achieved}</p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-2">Progress</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{progress}%</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Financial Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Credit Limit</label>
                <p className="text-base font-semibold text-gray-900">${contract.creditLimit.toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Paid</label>
                <p className="text-base font-semibold text-green-600">${contract.paid.toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Debt</label>
                <p className="text-base font-semibold text-red-600">${contract.debt.toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Remaining Credit</label>
                <p className="text-base font-semibold text-gray-900">${(contract.creditLimit - contract.paid).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 pt-0 border-t border-gray-200">
          <button onClick={onClose} className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium">Close</button>
        </div>
      </div>
    </div>
  )
}

export default ContractViewModal


