import React from 'react';
import { FileText, ShoppingCart } from 'lucide-react';

const StatRow = ({ label, value, color }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-gray-600">{label}</span>
    <span className={`font-semibold ${color || 'text-gray-900'}`}>{value}</span>
  </div>
);

const PipelineSummary = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-[#DEE2E6] p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quotations */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <FileText className="w-5 h-5 text-[#0D6EFD]" />
            <h3 className="text-base font-semibold text-gray-900">Quotations</h3>
          </div>
          <div className="space-y-2">
            <StatRow label="Total" value={0} />
            <StatRow label="Pending" value={0} color="text-yellow-600" />
            <StatRow label="Approved" value={0} color="text-green-600" />
            <StatRow label="Expired" value={0} color="text-red-600" />
          </div>
        </div>

        {/* Orders */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <ShoppingCart className="w-5 h-5 text-[#198754]" />
            <h3 className="text-base font-semibold text-gray-900">Orders</h3>
          </div>
          <div className="space-y-2">
            <StatRow label="Total" value={0} />
            <StatRow label="Completed" value={0} color="text-green-600" />
            <StatRow label="Delivery in progress" value={0} color="text-blue-600" />
            <StatRow label="Cancelled" value={0} color="text-red-600" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PipelineSummary;


