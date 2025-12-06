import React from 'react';
import { Users, MessageSquare, Star, ExternalLink } from 'lucide-react';

const FeedbackCustomersSnapshot = ({ newCustomers, recentFeedbacks, onViewCustomerDetail, onViewFeedbackDetail }) => {
  // Sample data for demonstration
  const defaultNewCustomers = [
    {
      id: 1,
      name: 'Nguyễn Văn X',
      email: 'nguyenx@email.com',
      phone: '0901234567',
      joinDate: '2024-01-15',
      status: 'active'
    },
    {
      id: 2,
      name: 'Trần Thị Y',
      email: 'trany@email.com',
      phone: '0901234568',
      joinDate: '2024-01-14',
      status: 'active'
    },
    {
      id: 3,
      name: 'Lê Văn Z',
      email: 'levz@email.com',
      phone: '0901234569',
      joinDate: '2024-01-13',
      status: 'pending'
    }
  ];

  const defaultRecentFeedbacks = [
    {
      id: 1,
      customer: 'Nguyễn Văn A',
      rating: 5,
      comment: 'Dịch vụ rất tốt, nhân viên tư vấn nhiệt tình',
      date: '2024-01-15',
      type: 'service'
    },
    {
      id: 2,
      customer: 'Trần Thị B',
      rating: 4,
      comment: 'Xe chất lượng tốt, giá cả hợp lý',
      date: '2024-01-14',
      type: 'product'
    },
    {
      id: 3,
      customer: 'Lê Văn C',
      rating: 3,
      comment: 'Cần cải thiện thời gian giao xe',
      date: '2024-01-13',
      type: 'delivery'
    }
  ];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getFeedbackTypeColor = (type) => {
    const colors = {
      service: 'bg-blue-100 text-blue-800',
      product: 'bg-green-100 text-green-800',
      delivery: 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getFeedbackTypeLabel = (type) => {
    const labels = {
      service: 'Dịch vụ',
      product: 'Sản phẩm',
      delivery: 'Giao hàng'
    };
    return labels[type] || type;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Top 3 New Customers */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-600" />
            Khách hàng mới nhất
          </h3>
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Xem tất cả
          </button>
        </div>
        
        <div className="p-6">
          {(newCustomers || defaultNewCustomers).map((customer, index) => (
            <div key={customer.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{customer.name}</p>
                  <p className="text-sm text-gray-500">{customer.phone}</p>
                  <p className="text-xs text-gray-400">{formatDate(customer.joinDate)}</p>
                </div>
              </div>
              <button
                onClick={() => onViewCustomerDetail(customer)}
                className="text-gray-400 hover:text-gray-600"
                title="Xem chi tiết"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Latest 3 Feedbacks */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2 text-green-600" />
            Phản hồi mới nhất
          </h3>
          <button className="text-green-600 hover:text-green-800 text-sm font-medium">
            Xem tất cả
          </button>
        </div>
        
        <div className="p-6">
          {(recentFeedbacks || defaultRecentFeedbacks).map((feedback, index) => (
            <div key={feedback.id} className="py-3 border-b border-gray-100 last:border-b-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{feedback.customer}</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getFeedbackTypeColor(feedback.type)}`}>
                    {getFeedbackTypeLabel(feedback.type)}
                  </span>
                </div>
                <button
                  onClick={() => onViewFeedbackDetail(feedback)}
                  className="text-gray-400 hover:text-gray-600"
                  title="Xem chi tiết"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center space-x-2 mb-2">
                <div className="flex">
                  {renderStars(feedback.rating)}
                </div>
                <span className="text-sm text-gray-500">{formatDate(feedback.date)}</span>
              </div>
              
              <p className="text-sm text-gray-700 line-clamp-2">
                {feedback.comment}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeedbackCustomersSnapshot;
