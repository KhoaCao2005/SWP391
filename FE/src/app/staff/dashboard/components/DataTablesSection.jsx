import React from 'react';
import { Clock, CheckCircle, AlertCircle, Star } from 'lucide-react';

const DataTablesSection = ({ onViewOrderDetail, onViewQuoteDetail, onViewTestDriveDetail }) => {
  // Sample data for Recent Quotes
  const recentQuotes = [
    {
      id: 'QUO-001',
      customer: 'Nguyễn Văn A',
      model: 'Toyota Camry 2024',
      amount: 850000000,
      date: '2024-01-15',
      status: 'pending'
    },
    {
      id: 'QUO-002',
      customer: 'Trần Thị B',
      model: 'Honda CR-V 2024',
      amount: 920000000,
      date: '2024-01-14',
      status: 'approved'
    },
    {
      id: 'QUO-003',
      customer: 'Lê Văn C',
      model: 'Ford Ranger 2024',
      amount: 780000000,
      date: '2024-01-13',
      status: 'pending'
    },
    {
      id: 'QUO-004',
      customer: 'Phạm Thị D',
      model: 'Mazda CX-5 2024',
      amount: 890000000,
      date: '2024-01-12',
      status: 'rejected'
    }
  ];

  // Sample data for Active Orders
  const activeOrders = [
    {
      id: 'ORD-001',
      customer: 'Nguyễn Văn A',
      model: 'Toyota Camry 2024',
      status: 'processing',
      progress: 60,
      amount: 850000000,
      date: '2024-01-15'
    },
    {
      id: 'ORD-002',
      customer: 'Trần Thị B',
      model: 'Honda CR-V 2024',
      status: 'delivery',
      progress: 90,
      amount: 920000000,
      date: '2024-01-14'
    },
    {
      id: 'ORD-003',
      customer: 'Lê Văn C',
      model: 'Ford Ranger 2024',
      status: 'completed',
      progress: 100,
      amount: 780000000,
      date: '2024-01-13'
    }
  ];

  // Sample data for Upcoming Test Drives
  const upcomingTestDrives = [
    {
      id: 'TD-001',
      customer: 'Nguyễn Văn F',
      model: 'Toyota Vios 2024',
      date: '2024-01-20',
      time: '09:00',
      status: 'scheduled'
    },
    {
      id: 'TD-002',
      customer: 'Trần Thị G',
      model: 'Honda City 2024',
      date: '2024-01-21',
      time: '14:30',
      status: 'confirmed'
    },
    {
      id: 'TD-003',
      customer: 'Lê Văn H',
      model: 'Ford Everest 2024',
      date: '2024-01-22',
      time: '10:15',
      status: 'scheduled'
    }
  ];

  // Sample data for Recent Feedback
  const recentFeedback = [
    {
      id: 'FB-001',
      customer: 'Nguyễn Văn A',
      rating: 5,
      comment: 'Dịch vụ tuyệt vời, nhân viên nhiệt tình',
      date: '2024-01-15',
      model: 'Toyota Camry 2024'
    },
    {
      id: 'FB-002',
      customer: 'Trần Thị B',
      rating: 4,
      comment: 'Xe đẹp, giá cả hợp lý',
      date: '2024-01-14',
      model: 'Honda CR-V 2024'
    },
    {
      id: 'FB-003',
      customer: 'Lê Văn C',
      rating: 5,
      comment: 'Rất hài lòng với chất lượng dịch vụ',
      date: '2024-01-13',
      model: 'Ford Ranger 2024'
    },
    {
      id: 'FB-004',
      customer: 'Phạm Thị D',
      rating: 3,
      comment: 'Cần cải thiện thời gian giao xe',
      date: '2024-01-12',
      model: 'Mazda CX-5 2024'
    }
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', label: 'Chờ duyệt', icon: Clock },
      'approved': { color: 'bg-green-100 text-green-800', label: 'Đã duyệt', icon: CheckCircle },
      'rejected': { color: 'bg-red-100 text-red-800', label: 'Từ chối', icon: AlertCircle },
      'processing': { color: 'bg-blue-100 text-blue-800', label: 'Đang xử lý', icon: Clock },
      'delivery': { color: 'bg-purple-100 text-purple-800', label: 'Đang giao', icon: Clock },
      'completed': { color: 'bg-green-100 text-green-800', label: 'Hoàn thành', icon: CheckCircle },
      'scheduled': { color: 'bg-purple-100 text-purple-800', label: 'Đã lên lịch', icon: Clock },
      'confirmed': { color: 'bg-green-100 text-green-800', label: 'Đã xác nhận', icon: CheckCircle },
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status, icon: Clock };
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="space-y-6 mb-8">
      {/* Top Row: Recent Quotes and Active Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quotes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                📋 Recent Quotes
              </h3>
              <p className="text-sm text-gray-600">Most recent quotes</p>
            </div>
            <button
              onClick={() => onViewQuoteDetail({ type: 'all-quotes' })}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              View All Details
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{quote.customer}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{quote.model}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(quote.amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(quote.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active Orders */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                🚗 Active Orders
              </h3>
              <p className="text-sm text-gray-600">Orders in progress</p>
            </div>
            <button
              onClick={() => onViewOrderDetail({ type: 'all-orders' })}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              View All Details
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.customer}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.model}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${order.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600">{order.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(order.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Row: Test Drives and Recent Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Test Drives */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              🚙 Upcoming Test Drives
            </h3>
            <p className="text-sm text-gray-600">Next 7 days</p>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {upcomingTestDrives.map((testDrive) => (
                <div key={testDrive.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{testDrive.customer}</h4>
                      <p className="text-sm text-gray-600">{testDrive.model}</p>
                    </div>
                    {getStatusBadge(testDrive.status)}
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>{formatDate(testDrive.date)}</span>
                    <span>{testDrive.time}</span>
                  </div>
                  <button
                    onClick={() => onViewTestDriveDetail(testDrive)}
                    className="mt-2 text-blue-600 hover:text-blue-900 text-sm font-medium"
                  >
                    View Details →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Feedback - Vertical Layout */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              ⭐ Recent Feedback
            </h3>
            <p className="text-sm text-gray-600">Customer reviews and ratings</p>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {recentFeedback.map((feedback) => (
                <div key={feedback.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{feedback.customer}</h4>
                      <p className="text-sm text-gray-600">{feedback.model}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex">{renderStars(feedback.rating)}</div>
                      <span className="text-xs text-gray-500">{formatDate(feedback.date)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 italic">"{feedback.comment}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTablesSection;
