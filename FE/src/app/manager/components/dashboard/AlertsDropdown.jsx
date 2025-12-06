import React, { useRef, useEffect } from 'react';
import { 
  Clock, 
  Truck, 
  MessageSquare, 
  Package,
  X,
  CheckCheck
} from 'lucide-react';
import { useNavigate } from 'react-router';

const AlertsDropdown = ({ onClose }) => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const alerts = [
    {
      id: 1,
      icon: Clock,
      title: '5 Quotes Expiring',
      message: 'Within 48 hours',
      priority: 'high',
      time: '2h ago',
      path: '/manager/sales/order-form?filter=expiring'
    },
    {
      id: 2,
      icon: MessageSquare,
      title: 'Unresolved Complaint',
      message: 'Customer ID: FDB-2025-03',
      priority: 'high',
      time: '1d ago',
      path: '/manager/customers/feedback'
    },
    {
      id: 3,
      icon: Package,
      title: 'Low Stock Alert',
      message: 'Model Y RWD - 3 units',
      priority: 'high',
      time: '3h ago',
      path: '/manager/inventory/stock'
    },
    {
      id: 4,
      icon: Truck,
      title: 'Pending Deliveries',
      message: '3 vehicles ready',
      priority: 'medium',
      time: '5h ago',
      path: '/manager/sales/payment-delivery'
    }
  ];

  const getPriorityColor = (priority) => {
    if (priority === 'high') return 'border-l-[#DC3545] bg-red-50';
    if (priority === 'medium') return 'border-l-[#FD7E14] bg-orange-50';
    return 'border-l-[#0D6EFD] bg-blue-50';
  };

  const handleAlertClick = (path) => {
    navigate(path);
    onClose();
  };

  const handleMarkAllRead = () => {
    console.log('Marking all alerts as read');
    onClose();
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-[#DEE2E6] z-50 animate-fadeIn"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#DEE2E6]">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
          <p className="text-xs text-[#6C757D]">{alerts.length} unread</p>
        </div>
        <button
          onClick={handleMarkAllRead}
          className="flex items-center space-x-1 text-xs text-[#0D6EFD] hover:text-[#0a58ca] font-medium"
        >
          <CheckCheck className="w-4 h-4" />
          <span>Mark All Read</span>
        </button>
      </div>

      {/* Alert List */}
      <div className="max-h-96 overflow-y-auto">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            onClick={() => handleAlertClick(alert.path)}
            className={`border-l-4 ${getPriorityColor(alert.priority)} p-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-[#DEE2E6] last:border-b-0`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className={`p-2 rounded-lg ${
                  alert.priority === 'high' ? 'bg-red-100' :
                  alert.priority === 'medium' ? 'bg-orange-100' : 'bg-blue-100'
                }`}>
                  <alert.icon className={`w-4 h-4 ${
                    alert.priority === 'high' ? 'text-[#DC3545]' :
                    alert.priority === 'medium' ? 'text-[#FD7E14]' : 'text-[#0D6EFD]'
                  }`} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{alert.title}</p>
                <p className="text-xs text-[#6C757D] mt-0.5">{alert.message}</p>
                <p className="text-xs text-[#6C757D] mt-1">{alert.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[#DEE2E6] bg-[#F8F9FA]">
        <button
          onClick={() => {
            navigate('/manager/notifications');
            onClose();
          }}
          className="w-full text-center text-sm text-[#0D6EFD] hover:text-[#0a58ca] font-medium"
        >
          View All Notifications
        </button>
      </div>
    </div>
  );
};

export default AlertsDropdown;

