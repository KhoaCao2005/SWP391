import React from 'react'
import { CheckCircle, X } from 'lucide-react'

const SuccessModal = ({ open, onClose, message = 'Cập nhật thành công' }) => {
  if (!open) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md mx-4">
        {/* Modal Content */}
        <div className="p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{message}</h3>
          </div>
        </div>
        
        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button 
            onClick={onClose} 
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}

export default SuccessModal

