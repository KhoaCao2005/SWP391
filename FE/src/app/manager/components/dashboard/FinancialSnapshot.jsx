import React from 'react';
import { DollarSign, Clock, CreditCard } from 'lucide-react';

const Item = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center justify-between p-4 bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg">
    <div className="flex items-center space-x-2">
      <div className={`p-2 rounded-md ${color || 'bg-white'}`}>
        <Icon className="w-4 h-4 text-[#6C757D]" />
      </div>
      <span className="text-sm text-gray-600">{label}</span>
    </div>
    <span className="text-sm font-semibold text-gray-900">{value}</span>
  </div>
);

const FinancialSnapshot = () => {
  return (
    <div className="space-y-3">
      <Item icon={DollarSign} label="Payments Collected (Month)" value="₫ 0" />
      <Item icon={CreditCard} label="Outstanding Installments" value="₫ 0" />
      <Item icon={Clock} label="Avg Delivery Time" value="0 days" />
    </div>
  );
};

export default FinancialSnapshot;


