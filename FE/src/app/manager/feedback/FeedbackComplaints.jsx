import React, { useState } from 'react';
import Layout from '../layout/Layout';
import {
  MessageSquare,
  Search,
  Filter,
  Eye,
  UserCheck,
  X,
  CheckCircle,
  ChevronRight,
  Users,
  Star,
  Calendar,
  AlertCircle,
  FileText
} from 'lucide-react';

const FeedbackComplaints = () => {
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [assignStaffId, setAssignStaffId] = useState('');

  // Feedback/complaints data - to be fetched from API
  const [feedbacks, setFeedbacks] = useState([]);

  // Get all available staff - to be fetched from API
  const [allStaff, setAllStaff] = useState([]);

  // Get unique lists for filters
  const staffList = [...new Set(feedbacks.map(f => f.assignedStaff).filter(Boolean))];

  // Helper functions
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getTypeBadge = (type) => {
    const configs = {
      'Feedback': { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Feedback' },
      'Complaint': { color: 'bg-red-100 text-red-800 border-red-200', label: 'Complaint' }
    };
    const config = configs[type] || configs['Feedback'];

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const configs = {
      'New': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'New' },
      'Assigned': { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Assigned' },
      'Resolved': { color: 'bg-green-100 text-green-800 border-green-200', label: 'Resolved' }
    };
    const config = configs[status] || configs['New'];

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const renderStars = (rating) => {
    if (!rating) return <span className="text-xs text-gray-400">No rating</span>;
    return (
      <div className="flex items-center space-x-1">
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            className={`w-3 h-3 ${
              index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-xs text-gray-600 ml-1">({rating})</span>
      </div>
    );
  };

  // Filter feedbacks
  const filteredFeedbacks = feedbacks.filter(feedback => {
    // Type filter
    if (typeFilter !== 'all' && feedback.type !== typeFilter) return false;

    // Status filter
    if (statusFilter !== 'all' && feedback.status !== statusFilter) return false;

    // Staff filter
    if (staffFilter !== 'all' && feedback.assignedStaff !== staffFilter) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matches = 
        feedback.customerName.toLowerCase().includes(query) ||
        feedback.customerPhone.includes(query) ||
        feedback.vehicle?.toLowerCase().includes(query) ||
        feedback.content.toLowerCase().includes(query);
      if (!matches) return false;
    }

    return true;
  });

  // Handle view feedback
  const handleView = (feedback) => {
    setSelectedFeedback(feedback);
    setAssignStaffId(feedback.assignedStaffId || '');
    setIsDetailModalOpen(true);
  };

  // Handle assign staff
  const handleAssignStaff = () => {
    if (!assignStaffId) {
      alert('Please select a staff member');
      return;
    }
    // In real app, would make API call to assign staff
    console.log('Assigning staff:', assignStaffId, 'to feedback:', selectedFeedback.id);
    alert('Staff assigned successfully!');
    setIsDetailModalOpen(false);
    // Refresh data would happen here
  };

  // Handle mark as reviewed
  const handleMarkReviewed = () => {
    // In real app, would make API call to mark as reviewed
    console.log('Marking feedback as reviewed:', selectedFeedback.id);
    alert('Feedback marked as reviewed!');
    setIsDetailModalOpen(false);
    // Refresh data would happen here
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <span className="hover:text-blue-600 cursor-pointer">Dashboard</span>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 font-medium">Feedback & Complaints</span>
        </div>

        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Feedback & Complaints</h1>
            <p className="text-sm text-gray-600 mt-1">View and manage customer feedback and complaints</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
              <span className="text-xs text-gray-500">({filteredFeedbacks.length} results)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Type Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="Feedback">Feedback</option>
                <option value="Complaint">Complaint</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="New">New</option>
                <option value="Assigned">Assigned</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            {/* Staff Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Staff</label>
              <select
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All</option>
                {staffList.map(staff => (
                  <option key={staff} value={staff}>{staff}</option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by customer, vehicle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Customer Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Assigned Staff
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFeedbacks.map((feedback) => (
                  <tr key={feedback.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{feedback.customerName}</div>
                        <div className="text-xs text-gray-500">{feedback.customerPhone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">
                        {feedback.assignedStaff || <span className="text-gray-400 italic">Unassigned</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(feedback.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderStars(feedback.rating)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">{formatDate(feedback.date)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(feedback.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleView(feedback)}
                        className="text-blue-600 hover:text-blue-900 text-xs font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {isDetailModalOpen && selectedFeedback && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-gray-900">Feedback Detail</h2>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="text-sm text-gray-600">Feedback ID: {selectedFeedback.id}</div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-600">Name</label>
                    <p className="text-sm font-medium text-gray-900 mt-1">{selectedFeedback.customerName}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Phone</label>
                    <p className="text-sm font-medium text-gray-900 mt-1">{selectedFeedback.customerPhone}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Customer ID</label>
                    <p className="text-sm font-medium text-gray-900 mt-1">{selectedFeedback.customerId}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Order ID</label>
                    <p className="text-sm font-medium text-gray-900 mt-1">{selectedFeedback.orderId}</p>
                  </div>
                </div>
              </div>

              {/* Feedback Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Feedback Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Type</span>
                    {getTypeBadge(selectedFeedback.type)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Rating</span>
                    {renderStars(selectedFeedback.rating)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Category</span>
                    <span className="text-sm font-medium text-gray-900">{selectedFeedback.category}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Vehicle</span>
                    <span className="text-sm font-medium text-gray-900">{selectedFeedback.vehicle}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Date</span>
                    <span className="text-sm font-medium text-gray-900">{formatDate(selectedFeedback.date)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Status</span>
                    {getStatusBadge(selectedFeedback.status)}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Content
                </label>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedFeedback.content}</p>
                </div>
              </div>

              {/* Assign Staff */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <UserCheck className="w-4 h-4 mr-2" />
                  Assign Staff to Handle
                </label>
                <select
                  value={assignStaffId}
                  onChange={(e) => setAssignStaffId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Staff</option>
                  {allStaff.map(staff => (
                    <option key={staff.id} value={staff.id}>{staff.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  Manager assigns staff to handle this feedback. Staff will contact customer offline or via email.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex items-center justify-between space-x-3">
              <button
                onClick={handleMarkReviewed}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Mark as Reviewed</span>
              </button>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleAssignStaff}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Assign Staff</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default FeedbackComplaints;

