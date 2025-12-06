import React from 'react';
import { Users, ShoppingCart, BarChart3, DollarSign } from 'lucide-react';
import SummaryCard from './SummaryCard';

const SummaryCards = ({ onViewDetails }) => {
  const cards = [
    {
      id: 'customers',
      title: "Today's Money",
      value: '$53k',
      icon: DollarSign,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      trend: 'up',
      trendValue: '+55% than last week'
    },
    {
      id: 'orders',
      title: "Today's Users",
      value: '2300',
      icon: Users,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      trend: 'up',
      trendValue: '+3% than last month'
    },
    {
      id: 'deliveries',
      title: 'Ads Views',
      value: '3,462',
      icon: BarChart3,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      trend: 'down',
      trendValue: '-2% than yesterday'
    },
    {
      id: 'revenue',
      title: 'Sales',
      value: '$103,430',
      icon: DollarSign,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      trend: 'up',
      trendValue: '+5% than yesterday'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card) => (
        <SummaryCard
          key={card.id}
          title={card.title}
          value={card.value}
          icon={card.icon}
          color={card.color}
          bgColor={card.bgColor}
          trend={card.trend}
          trendValue={card.trendValue}
          onViewDetails={() => onViewDetails(card.id)}
        />
      ))}
    </div>
  );
};

export default SummaryCards;
