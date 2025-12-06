import React from 'react'
import { X, Plus, FileText } from 'lucide-react'

const ContractCreateModal = ({ open, onClose, contract, onChange, onSubmit }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Plus className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Create New Contract</h2>
              <p className="text-sm text-gray-600">Fill in the contract information below</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={onSubmit} className="p-6">
          <div className="space-y-5">
            {/* Dealer and Period */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dealer <span className="text-red-500">*</span></label>
                <select name="dealer" value={contract.dealer} onChange={onChange} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="Dealer A">Dealer A</option>
                  <option value="Dealer B">Dealer B</option>
                  <option value="Dealer C">Dealer C</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Period <span className="text-red-500">*</span></label>
                <select name="period" value={contract.period} onChange={onChange} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="Q1">Q1</option>
                  <option value="Q2">Q2</option>
                  <option value="Q3">Q3</option>
                  <option value="Q4">Q4</option>
                </select>
              </div>
            </div>

            {/* Target and Credit Limit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target (units) <span className="text-red-500">*</span></label>
                <input type="number" name="target" value={contract.target} onChange={onChange} required min="0" placeholder="Enter target units" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Credit Limit ($) <span className="text-red-500">*</span></label>
                <input type="number" name="creditLimit" value={contract.creditLimit} onChange={onChange} required min="0" placeholder="Enter credit limit" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status <span className="text-red-500">*</span></label>
              <select name="status" value={contract.status} onChange={onChange} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="Active">Active</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <FileText className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-1">Contract Information</h4>
                  <p className="text-xs text-blue-700">All required fields must be filled. Contract ID will be automatically generated upon creation. Achieved units, paid amount, and debt will start at 0.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <button type="button" onClick={onClose} className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium">Cancel</button>
            <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Create Contract</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ContractCreateModal


