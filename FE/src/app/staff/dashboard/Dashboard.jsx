import React, { useState } from 'react';
import Layout from '../layout/Layout';
import DashboardHeader from './components/DashboardHeader';
import SummaryCards from './components/SummaryCards';
import ChartsSection from './components/ChartsSection';
import DataTablesSection from './components/DataTablesSection';

export const DashBoard = () => {
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const salesData = [
    { month: 'T1', revenue: 1200000000, target: 1000000000, units: 120 },
    { month: 'T2', revenue: 1500000000, target: 1200000000, units: 150 },
    { month: 'T3', revenue: 1800000000, target: 1500000000, units: 180 },
    { month: 'T4', revenue: 2200000000, target: 1800000000, units: 220 },
    { month: 'T5', revenue: 1900000000, target: 2000000000, units: 190 },
    { month: 'T6', revenue: 2500000000, target: 2200000000, units: 250 },
  ];

  const pipelineData = [
    { status: 'Pending Order Forms', quantity: 15, color: '#F59E0B' },
    { status: 'Active Installments', quantity: 8, color: '#3B82F6' },
    { status: 'In Progress Deliveries', quantity: 12, color: '#8B5CF6' },
    { status: 'Completed Orders', quantity: 25, color: '#10B981' },
  ];


  const handleRefresh = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLastUpdated(new Date());
  };

  const handleViewDetails = (type) => {
    console.log(`View details for: ${type}`);
    // Navigate to detailed view
  };

  const handleViewOrderDetail = (order) => {
    console.log('View order detail:', order);
    // Navigate to order detail page
  };

  const handleViewQuoteDetail = (quote) => {
    console.log('View quote detail:', quote);
    // Navigate to quote detail page
  };

  const handleViewTestDriveDetail = (testDrive) => {
    console.log('View test drive detail:', testDrive);
    // Navigate to test drive detail page
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Dashboard Header */}
        <DashboardHeader 
          onRefresh={handleRefresh}
          lastUpdated={lastUpdated}
        />

        {/* Summary Cards */}
        <SummaryCards 
          onViewDetails={handleViewDetails}
        />

        {/* Charts Section */}
        <ChartsSection 
          salesData={salesData}
          pipelineData={pipelineData}
          onRefresh={handleRefresh}
        />

        {/* Data Tables Section */}
        <DataTablesSection 
          onViewOrderDetail={handleViewOrderDetail}
          onViewQuoteDetail={handleViewQuoteDetail}
          onViewTestDriveDetail={handleViewTestDriveDetail}
        />
      </div>
    </Layout>
  );
};
