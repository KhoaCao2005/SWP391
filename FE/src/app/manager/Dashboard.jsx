import React from 'react';
import Layout from './layout/Layout';
// Header icons removed

// Import dashboard components
import KPICards from './components/dashboard/KPICards';
import ChartsSection from './components/dashboard/ChartsSection';
import InventoryOverview from './components/dashboard/InventoryOverview';
import StaffPerformanceTable from './components/dashboard/StaffPerformanceTable';
import PipelineSummary from './components/dashboard/PipelineSummary';
import FinancialSnapshot from './components/dashboard/FinancialSnapshot';
import FloatingBell from './components/dashboard/FloatingBell';
// Alerts dropdown removed with header
// import DashboardFilters from './components/dashboard/DashboardFilters';

export const Dashboard = () => {
  // Header state removed

  // KPI data - to be fetched from API
  const kpiData = {
    totalRevenue: { value: '0', unit: '₫', change: '0%', trend: 'neutral' },
    activeQuotes: { value: 0, change: '0', trend: 'neutral' },
    vehiclesInStock: { value: 0, change: '0', trend: 'neutral' },
    vehiclesSold: { value: 0, change: '0%', trend: 'neutral' },
  };

  // Header handlers removed

  return (
    <Layout>
      <div className="min-h-screen bg-[#F8F9FA] relative">
        {/* Header removed as requested */}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          {/* Row 1: 4 KPI Cards */}
          <KPICards data={kpiData} />

          {/* Row 2 removed: Quick Actions */}

          {/* Row 3: Main Content - Charts + Top Performers */}
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
            {/* Left: Charts (60%) */}
            <div className="lg:col-span-6">
              <ChartsSection />
            </div>
            
            {/* Right: Quotations & Orders + Financial Snapshot (40%) */}
            <div className="lg:col-span-4 space-y-6">
              <PipelineSummary />
              <FinancialSnapshot />
            </div>
          </div>

          {/* Row 4: Inventory Table */}
          <InventoryOverview compact={true} />

          {/* Staff Performance Table */}
          <StaffPerformanceTable />

          {/* Staff Performance Table */}

          {/* Recent Activities removed */}
        </div>

        {/* Floating Notifications Bell */}
        <FloatingBell />
      </div>
    </Layout>
  );
};

export default Dashboard;
