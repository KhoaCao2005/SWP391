import React from 'react';
import { Users, TrendingUp, ArrowRight, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router';

const StaffPerformanceTable = ({ compact = false }) => {
  const navigate = useNavigate();

  // Staff performance data - to be fetched from API
  const staffData = [];

  const displayData = compact ? staffData.slice(0, 5) : staffData;

  const getConversionColor = (rate) => {
    if (rate >= 45) return 'text-green-600 bg-green-50';
    if (rate >= 35) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return { icon: '🥇', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
    if (rank === 2) return { icon: '🥈', color: 'bg-gray-100 text-gray-800 border-gray-300' };
    if (rank === 3) return { icon: '🥉', color: 'bg-orange-100 text-orange-800 border-orange-300' };
    return { icon: '', color: '' };
  };

  if (compact) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Top Performers</h3>
          </div>
          <button
            onClick={() => navigate('/manager/staff/performance')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
          >
            <span>All</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {displayData.map((staff) => {
            const rankBadge = getRankBadge(staff.rank);
            return (
              <div
                key={staff.id}
                onClick={() => navigate(`/manager/staff/performance?id=${staff.id}`)}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-gray-100"
              >
                <div className="flex items-center space-x-3 flex-1">
                  {rankBadge.icon && (
                    <span className="text-xl">{rankBadge.icon}</span>
                  )}
                  {!rankBadge.icon && (
                    <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                      {staff.rank}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{staff.name}</p>
                    <p className="text-xs text-gray-500">{staff.orders} orders • {staff.conversion}% rate</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{staff.revenue} ₫</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">Team Performance</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {(staffData.reduce((sum, s) => sum + s.conversion, 0) / staffData.length).toFixed(0)}%
          </p>
          <p className="text-xs text-gray-500">Avg Conversion Rate</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Staff Performance</h3>
        </div>
        <button
          onClick={() => navigate('/manager/staff/performance')}
          className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          <span>View All</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Rank
              </th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Staff
              </th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Quotes
              </th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Orders
              </th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Rate
              </th>
              <th className="text-right py-3 px-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Revenue
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayData.map((staff) => {
              const rankBadge = getRankBadge(staff.rank);
              return (
                <tr
                  key={staff.id}
                  onClick={() => navigate(`/manager/staff/performance?id=${staff.id}`)}
                  className="hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center">
                      {rankBadge.icon ? (
                        <span className="text-2xl">{rankBadge.icon}</span>
                      ) : (
                        <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                          {staff.rank}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{staff.avatar}</span>
                      <span className="font-medium text-gray-900">{staff.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="text-gray-700 font-medium">{staff.quotes}</span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="text-gray-900 font-semibold">{staff.orders}</span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConversionColor(staff.conversion)}`}>
                      {staff.conversion}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="font-semibold text-gray-900">{staff.revenue} ₫</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-4 gap-4 text-center">
        <div>
          <p className="text-xs text-gray-500">Total Quotes</p>
          <p className="text-lg font-bold text-gray-900">
            {staffData.reduce((sum, s) => sum + s.quotes, 0)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Total Orders</p>
          <p className="text-lg font-bold text-gray-900">
            {staffData.reduce((sum, s) => sum + s.orders, 0)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Avg Conversion</p>
          <p className="text-lg font-bold text-gray-900">
            {(staffData.reduce((sum, s) => sum + s.conversion, 0) / staffData.length).toFixed(0)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Total Revenue</p>
          <p className="text-lg font-bold text-gray-900">21B ₫</p>
        </div>
      </div>
    </div>
  );
};

export default StaffPerformanceTable;

