import React from 'react'
import { X, AlertTriangle, Trash2 } from 'lucide-react'

const ConfirmModal = ({
  open,
  title = 'Confirm',
  description,
  onCancel,
  onConfirm,
  confirmText = 'Confirm',
  tone = 'red', // 'red' | 'yellow' | 'blue'
  Icon = AlertTriangle,
}) => {
  if (!open) return null

  const toneClasses = {
    red: {
      bg: 'bg-red-100',
      icon: 'text-red-600',
      button: 'bg-red-600 hover:bg-red-700',
    },
    yellow: {
      bg: 'bg-yellow-100',
      icon: 'text-yellow-600',
      button: 'bg-yellow-600 hover:bg-yellow-700',
    },
    blue: {
      bg: 'bg-blue-100',
      icon: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700',
    },
  }[tone] || {
    bg: 'bg-gray-100',
    icon: 'text-gray-600',
    button: 'bg-gray-600 hover:bg-gray-700',
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${toneClasses.bg} rounded-lg flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${toneClasses.icon}`} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {typeof description === 'string' ? (
            <p className="text-gray-700">{description}</p>
          ) : (
            description
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 pt-0 border-t border-gray-200">
          <button onClick={onCancel} className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium">
            Cancel
          </button>
          <button onClick={onConfirm} className={`px-5 py-2.5 ${toneClasses.button} text-white rounded-lg transition-colors font-medium inline-flex items-center gap-2`}>
            {tone === 'red' ? <Trash2 className="w-4 h-4" /> : null}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal


