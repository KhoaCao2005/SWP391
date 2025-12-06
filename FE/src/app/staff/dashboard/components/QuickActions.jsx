import React from 'react';
import { FileText, ShoppingCart, Car, Plus } from 'lucide-react';

const QuickActions = ({ onCreateQuote, onCreateOrder, viewInventory }) => {
  const actions = [
    {
      id: 'quote',
      title: 'Tạo báo giá mới',
      description: 'Tạo báo giá cho khách hàng tiềm năng',
      icon: FileText,
      color: 'bg-blue-600 hover:bg-blue-700',
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-100',
      onClick: onCreateQuote
    },
    {
      id: 'order',
      title: 'Tạo đơn hàng mới',
      description: 'Tạo đơn hàng cho khách hàng',
      icon: ShoppingCart,
      color: 'bg-green-600 hover:bg-green-700',
      iconColor: 'text-green-600',
      bgColor: 'bg-green-100',
      onClick: onCreateOrder
    },
    {
      id: 'inventory',
      title: 'Xem danh mục xe',
      description: 'Quản lý và xem kho xe hiện có',
      icon: Car,
      color: 'bg-orange-600 hover:bg-orange-700',
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-100',
      onClick: viewInventory
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Thao tác nhanh
        </h3>
        <p className="text-gray-600">
          Các thao tác thường dùng để tăng hiệu quả công việc
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={action.onClick}
              className={`${action.color} text-white rounded-lg p-6 transition-all duration-200 transform hover:scale-105 hover:shadow-lg group`}
            >
              <div className="flex flex-col items-center text-center">
                <div className={`w-16 h-16 ${action.bgColor} rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className={`w-8 h-8 ${action.iconColor}`} />
                </div>
                <h4 className="font-semibold text-lg mb-2">{action.title}</h4>
                <p className="text-sm opacity-90 leading-relaxed">
                  {action.description}
                </p>
                <div className="mt-4 flex items-center justify-center">
                  <Plus className="w-4 h-4 mr-1" />
                  <span className="text-sm font-medium">Bắt đầu</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Additional Quick Stats */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">24</p>
            <p className="text-sm text-gray-600">Báo giá chưa gửi</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">8</p>
            <p className="text-sm text-gray-600">Đơn hàng chờ xử lý</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">156</p>
            <p className="text-sm text-gray-600">Xe có sẵn</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
