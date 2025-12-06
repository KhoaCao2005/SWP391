/**
 * ChartsSection Component - Dynamic Dashboard Charts
 * 
 * 🔌 API INTEGRATION POINTS:
 * 1. fetchRevenueData() - Line 38-53: Replace with actual API call to /api/dashboard/revenue-trend
 * 2. fetchPipelineData() - Line 55-70: Replace with actual API call to /api/dashboard/sales-pipeline
 * 3. useEffect() - Line 72-82: Load all data on component mount
 * 4. handleRefreshData() - Line 84-94: Refresh all data manually
 * 
 * 📊 EXPECTED API RESPONSE FORMATS:
 * Revenue API: [{ month: string, revenue: number, target: number, units: number }, ...]
 * Pipeline API: [{ status: string, quantity: number, color: string }, ...]
 * 
 * 🔄 DYNAMIC FEATURES:
 * - Loading states with spinners
 * - Error handling with fallback data
 * - Real-time metrics calculation
 * - Refresh functionality
 * - Last updated timestamps
 */

import React, { useState, useCallback, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, ComposedChart, Legend } from 'recharts';

// 📊 DEFAULT SAMPLE DATA - Fallback when API is not available
const DEFAULT_REVENUE_DATA = [
  { month: 'Jan', revenue: 45000, target: 50000, units: 50 },
  { month: 'Feb', revenue: 48000, target: 50000, units: 100 },
  { month: 'Mar', revenue: 60000, target: 55000, units: 28 },
  { month: 'Apr', revenue: 52000, target: 55000, units: 103 },
  { month: 'May', revenue: 58000, target: 60000, units: 87 },
  { month: 'Jun', revenue: 65000, target: 60000, units: 150 },
  { month: 'Jul', revenue: 62000, target: 65000, units: 75 },
  { month: 'Aug', revenue: 70000, target: 65000, units: 120 },
  { month: 'Sep', revenue: 68000, target: 70000, units: 95 },
  { month: 'Oct', revenue: 75000, target: 70000, units: 140 },
  { month: 'Nov', revenue: 72000, target: 75000, units: 110 },
  { month: 'Dec', revenue: 80000, target: 75000, units: 160 },
];

const DEFAULT_PIPELINE_DATA = [
  { status: 'Pending Quotes', quantity: 10, color: '#F59E0B' },
  { status: 'Approved Quotes', quantity: 7, color: '#3B82F6' },
  { status: 'Orders In Progress', quantity: 5, color: '#8B5CF6' },
  { status: 'Delivered Orders', quantity: 3, color: '#10B981' },
];

const ChartsSection = ({ salesData, pipelineData: externalPipelineData, onRefresh }) => {
  // 🔄 DYNAMIC DATA STATE - Replace with API calls
  const [revenueData, setRevenueData] = useState(DEFAULT_REVENUE_DATA);
  const [pipelineData, setPipelineData] = useState(externalPipelineData || DEFAULT_PIPELINE_DATA);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Update pipeline data when external data changes
  useEffect(() => {
    if (externalPipelineData) {
      setPipelineData(externalPipelineData);
    }
  }, [externalPipelineData]);

  // 🔌 API INTEGRATION POINT 1: Fetch Revenue Data
  const fetchRevenueData = useCallback(async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/dashboard/revenue-trend');
      // const data = await response.json();
      // setRevenueData(data);
      
      // Simulate API call with delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setRevenueData(DEFAULT_REVENUE_DATA);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      setRevenueData(DEFAULT_REVENUE_DATA);
    }
  }, []);

  // 🔌 API INTEGRATION POINT 2: Fetch Sales Pipeline Data
  const fetchPipelineData = useCallback(async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/dashboard/sales-pipeline');
      // const data = await response.json();
      // setPipelineData(data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      setPipelineData(DEFAULT_PIPELINE_DATA);
    } catch (error) {
      console.error('Error fetching pipeline data:', error);
      setPipelineData(DEFAULT_PIPELINE_DATA);
    }
  }, []);

  // 🔌 API INTEGRATION POINT 3: Load all data on component mount
  // Commented out for now since we're using default data
  // Uncomment when API is ready
  // useEffect(() => {
  //   const loadDashboardData = async () => {
  //     await Promise.all([
  //       fetchRevenueData(),
  //       fetchPipelineData()
  //     ]);
  //   };
  //   
  //   loadDashboardData();
  // }, [fetchRevenueData, fetchPipelineData]);

  // 🔌 API INTEGRATION POINT 4: Refresh data function
  const handleRefreshData = async () => {
    await Promise.all([
      fetchRevenueData(),
      fetchPipelineData()
    ]);
    // Call parent refresh function if provided
    if (onRefresh) {
      onRefresh();
    }
  };

  // 📈 CALCULATED METRICS - These can be calculated from API data
  const currentRevenue = revenueData.length > 0 ? revenueData[revenueData.length - 1]?.revenue : 0;
  const previousRevenue = revenueData.length > 1 ? revenueData[revenueData.length - 2]?.revenue : 0;
  const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1) : 0;
  
  const totalPendingQuotes = pipelineData.find(item => item.status === 'Pending Quotes')?.quantity || 0;
  const totalApprovedQuotes = pipelineData.find(item => item.status === 'Approved Quotes')?.quantity || 0;
  const totalOrdersInProgress = pipelineData.find(item => item.status === 'Orders In Progress')?.quantity || 0;
  const totalDelivered = pipelineData.find(item => item.status === 'Delivered Orders')?.quantity || 0;
  const totalCancelled = pipelineData.find(item => item.status === 'Cancelled Orders')?.quantity || 0;

  const chartData = salesData || revenueData;
  
  // Debug: Log the data to console
  console.log('Chart Data:', chartData);
  console.log('Pipeline Data:', pipelineData);
  console.log('External Pipeline Data:', externalPipelineData);


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Revenue Trend - Line Chart */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center">
              📈 My Sales Performance
            </h3>
            <p className="text-sm text-gray-600">Revenue and units sold over time</p>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleRefreshData}
              className="p-2 text-gray-400 hover:text-gray-600"
              title="Refresh data"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.8}/>
                </linearGradient>
                <linearGradient id="unitsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.8}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                yAxisId="left"
                stroke="#6b7280"
                fontSize={12}
                domain={['dataMin', 'dataMax']}
                tickFormatter={(value) => `$${(value / 1000000000).toFixed(1)}B`}
                label={{ value: 'Revenue ($)', angle: -90, position: 'insideLeft' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#6b7280"
                fontSize={12}
                domain={['dataMin', 'dataMax']}
                label={{ value: 'Units Sold', angle: 90, position: 'insideRight' }}
              />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'revenue' ? `$${(value / 1000000000).toFixed(2)}B` : `${value} units`,
                  name === 'revenue' ? 'Actual Revenue' : name === 'target' ? 'Target' : 'Units Sold'
                ]}
                labelStyle={{ color: '#374151' }}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Bar 
                yAxisId="right"
                dataKey="units" 
                fill="url(#unitsGradient)" 
                radius={[4, 4, 0, 0]}
                name="Units Sold"
                barSize={35}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="revenue" 
                stroke="url(#revenueGradient)" 
                strokeWidth={4}
                dot={{ fill: '#F59E0B', strokeWidth: 3, r: 6 }}
                activeDot={{ r: 8, stroke: '#F59E0B', strokeWidth: 2, fill: '#fff' }}
                name="Actual Revenue"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              📈 Revenue is {revenueGrowth >= 0 ? 'trending upward' : 'trending downward'}
            </span>
            <span className={`font-medium ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth}% vs last month
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Sales Pipeline - Pie Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center">
              🎯 Sales Pipeline
            </h3>
            <p className="text-sm text-gray-600">Order Status Distribution</p>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pipelineData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                outerRadius={90}
                innerRadius={30}
                fill="#8884d8"
                dataKey="quantity"
                stroke="#fff"
                strokeWidth={2}
              >
                {pipelineData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [value, 'Quantity']}
                labelStyle={{ color: '#374151' }}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={60}
                iconType="circle"
                formatter={(value) => (
                  <span style={{ color: '#374151', fontSize: '11px', fontWeight: '500' }}>
                    {value}
                  </span>
                )}
                wrapperStyle={{ paddingTop: '10px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              📊 {totalPendingQuotes} pending quotes need attention
            </span>
            <span className={`font-medium ${totalPendingQuotes > 5 ? 'text-orange-600' : 'text-green-600'}`}>
              {totalPendingQuotes > 5 ? 'Focus on approvals' : 'Pipeline looks good'}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Total pipeline: {totalPendingQuotes + totalApprovedQuotes + totalOrdersInProgress + totalDelivered + totalCancelled} items
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartsSection;
