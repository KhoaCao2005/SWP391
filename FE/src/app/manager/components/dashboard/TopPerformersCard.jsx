import React from 'react';
import { Trophy, TrendingUp, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router';

const TopPerformersCard = () => {
  const navigate = useNavigate();

  // Top performers data - to be fetched from API
  const topPerformers = [];

  const getRankBadge = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  };

  return (
    <>
      {/* Top Performers List */}
      <div className="bg-white rounded-xl shadow-sm border border-[#DEE2E6] p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-[#FD7E14]" />
            <h3 className="text-base font-semibold text-gray-900">Top Performers</h3>
          </div>
          <button
            onClick={() => navigate('/manager/staff/performance')}
            className="text-sm text-[#0D6EFD] hover:text-[#0a58ca] font-medium flex items-center space-x-1"
          >
            <span>All</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {topPerformers.map((staff) => (
            <div
              key={staff.id}
              onClick={() => navigate(`/manager/staff/performance?id=${staff.id}`)}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-[#F8F9FA] cursor-pointer transition-colors border border-[#DEE2E6]"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <span className="text-xl flex-shrink-0">{getRankBadge(staff.rank)}</span>
                <span className="text-lg flex-shrink-0">{staff.avatar}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{staff.name}</p>
                  <p className="text-xs text-[#6C757D]">
                    {staff.orders} orders • {staff.conversion}%
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <p className="text-sm font-bold text-gray-900">{staff.revenue} ₫</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Removed: Avg Conversion Rate Card */}
    </>
  );
};

export default TopPerformersCard;

