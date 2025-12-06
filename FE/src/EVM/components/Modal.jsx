import React from 'react'
import { X } from 'lucide-react'

const Modal = ({ title, children, open, onClose, onSubmit, submitText = 'Save', cancelText = 'Cancel' }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md mx-4">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-1 transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Modal Content */}
        <div className="p-5">
          {children}
        </div>
        
        {/* Modal Footer - Matching Dealer style */}
        <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="flex items-center space-x-2 px-6 py-3 bg-white border-2 border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-semibold transition-colors"
          >
            <X className="w-5 h-5 text-red-500" />
            <span>{cancelText}</span>
          </button>
          <button 
            onClick={onSubmit} 
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            <span>{submitText}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Modal


