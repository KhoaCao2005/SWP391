import React from 'react';
import { 
  DollarSign, 
  FileText, 
  Package, 
  Car, 
  Users, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router';

const KPICards = ({ data }) => {
  const navigate = useNavigate();

  const cards = [
    {
      id: 'revenue',
      title: 'Total Revenue',
      subtitle: 'This Month',
      value: data.totalRevenue.value,
      unit: data.totalRevenue.unit,
      change: data.totalRevenue.change,
      trend: data.totalRevenue.trend,
      icon: DollarSign,
      bgColor: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700',
      textColor: 'text-blue-600',
      path: '/manager/reports/debt',
      tooltip: 'Total sales revenue for current month'
    },
    {
      id: 'quotes',
      title: 'Active Quotations',
      subtitle: 'In Progress',
      value: data.activeQuotes.value,
      change: data.activeQuotes.change,
      trend: data.activeQuotes.trend,
      icon: FileText,
      bgColor: 'bg-yellow-500',
      hoverColor: 'hover:bg-yellow-600',
      textColor: 'text-yellow-600',
      path: '/manager/sales/quotations',
      tooltip: 'Quotations pending or in progress'
    },
    {
      id: 'stock',
      title: 'Vehicles in Stock',
      subtitle: 'Available Now',
      value: data.vehiclesInStock.value,
      change: data.vehiclesInStock.change,
      trend: data.vehiclesInStock.trend,
      icon: Package,
      bgColor: 'bg-green-600',
      hoverColor: 'hover:bg-green-700',
      textColor: 'text-green-600',
      path: '/manager/inventory/stock',
      tooltip: 'Total vehicles available in inventory'
    },
    {
      id: 'sold',
      title: 'Vehicles Sold',
      subtitle: 'This Month',
      value: data.vehiclesSold.value,
      change: data.vehiclesSold.change,
      trend: data.vehiclesSold.trend,
      icon: Car,
      bgColor: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700',
      textColor: 'text-blue-700',
      path: '/manager/reports/sales-performance',
      tooltip: 'Number of vehicles sold this month'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <div
          key={card.id}
          onClick={() => navigate(card.path)}
          title={card.tooltip}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer transform hover:-translate-y-1 group"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-3">{card.title}</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">
                {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                {card.unit && <span className="text-xl ml-1">{card.unit}</span>}
              </p>
              {card.change && (
                <div className={`flex items-center space-x-1 text-sm font-medium ${
                  card.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {card.trend === 'up' ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  <span>{card.change}</span>
                  <span className="text-gray-500 text-xs ml-1">{card.subtitle}</span>
                </div>
              )}
            </div>
            <div className={`${card.bgColor} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
              <card.icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KPICards;

