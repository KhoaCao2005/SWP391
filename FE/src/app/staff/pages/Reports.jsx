import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../layout/Layout';
import { BarChart3, TrendingUp, Download, Calendar, RefreshCw, Users, ArrowDownToLine } from 'lucide-react';
import { getStaffSalesRecords } from '../services/salesService';

const Reports = () => {
  // Date range (default: this month)
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const firstDay = `${yyyy}-${mm}-01`;
  // const lastDay = `${yyyy}-${mm}-${String(new Date(yyyy, parseInt(mm, 10), 0).getDate()).padStart(2, '0')}`;

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [salesRecords, setSalesRecords] = useState([]);
  const [preset, setPreset] = useState('this_month'); // this_month, last_7, last_30, custom
  const [sortBy, setSortBy] = useState({ field: 'date', direction: 'desc' });

  // Fetch sales records when date range changes
  useEffect(() => {
    const fetchSales = async () => {
      if (!startDate || !endDate) return;
      setLoading(true);
      setError(null);
      const res = await getStaffSalesRecords(startDate, endDate);
      if (res.success) {
        setSalesRecords(res.data || []);
      } else {
        setSalesRecords([]);
        setError(res.message || 'Failed to fetch sales records');
      }
      setLoading(false);
    };
    fetchSales();
  }, [startDate, endDate]);

  // Derived metrics
  const metrics = useMemo(() => {
    if (!salesRecords || salesRecords.length === 0) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        avgOrderValue: 0
      };
    }
    // Backend provides SaleRecordDTO with saleAmount and saleDate
    const totalRevenue = salesRecords.reduce((sum, r) => {
      const a = parseFloat(r.saleAmount || 0);
      return sum + (isNaN(a) ? 0 : a);
    }, 0);
    const totalOrders = salesRecords.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    return { totalRevenue, totalOrders, avgOrderValue };
  }, [salesRecords]);

  // (chart placeholder removed)

  // Trend removed with chart

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const applyPreset = (key) => {
    setPreset(key);
    const now = new Date();
    if (key === 'last_7') {
      const d = new Date();
      d.setDate(now.getDate() - 6);
      setStartDate(d.toISOString().slice(0,10));
      setEndDate(now.toISOString().slice(0,10));
    } else if (key === 'last_30') {
      const d = new Date();
      d.setDate(now.getDate() - 29);
      setStartDate(d.toISOString().slice(0,10));
      setEndDate(now.toISOString().slice(0,10));
    } else if (key === 'this_month') {
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const y = now.getFullYear();
      setStartDate(`${y}-${m}-01`);
      setEndDate(now.toISOString().slice(0,10));
    }
  };

  const sortedOrders = useMemo(() => {
    const arr = [...(salesRecords || [])];
    const dir = sortBy.direction === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      if (sortBy.field === 'amount') {
        const va = parseFloat(a.saleAmount || 0);
        const vb = parseFloat(b.saleAmount || 0);
        return (va - vb) * dir;
      }
      const da = new Date(a.saleDate || 0).getTime();
      const db = new Date(b.saleDate || 0).getTime();
      return (da - db) * dir;
    });
    return arr;
  }, [salesRecords, sortBy]);

  const downloadCsv = () => {
    const headers = ['Name', 'Date', 'Amount'];
    const rows = (salesRecords || []).map((r, idx) => {
      const recordName = `Sales ${(r.saleDate || '').slice(0,10) || `#${idx+1}`}`;
      const date = (r.saleDate || '').slice(0,10);
      const amount = parseFloat(r.saleAmount || 0);
      return [recordName, date, String(amount)];
    });
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `staff-sales-${startDate}-to-${endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Sales Reports</h1>
              <p className="text-sm text-gray-600 mt-1">Your sales performance and order breakdown</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => downloadCsv()}
                disabled={loading || !salesRecords || salesRecords.length === 0}
                className="bg-gray-800 hover:bg-gray-900 text-white px-3 py-2 rounded-lg text-sm flex items-center space-x-2 disabled:opacity-60"
              >
                <ArrowDownToLine className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => { setStartDate((s) => s); }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center space-x-3">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-700">Date range:</span>
              <button onClick={() => applyPreset('last_7')} className={`px-3 py-1.5 rounded text-xs font-medium ${preset==='last_7' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Last 7 days</button>
              <button onClick={() => applyPreset('last_30')} className={`px-3 py-1.5 rounded text-xs font-medium ${preset==='last_30' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Last 30 days</button>
              <button onClick={() => applyPreset('this_month')} className={`px-3 py-1.5 rounded text-xs font-medium ${preset==='this_month' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>This month</button>
              <button onClick={() => setPreset('custom')} className={`px-3 py-1.5 rounded text-xs font-medium ${preset==='custom' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Custom</button>
            </div>
            <div className="flex items-center space-x-2">
              <input type="date" className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" value={startDate} max={endDate} onChange={(e) => setStartDate(e.target.value)} />
              <span className="text-gray-500 text-sm">to</span>
              <input type="date" className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          {error && (<div className="mt-3 text-sm text-red-600">{error}</div>)}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(metrics.totalRevenue)}
                </p>
                <p className="text-sm text-gray-600">Revenue in range</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{metrics.totalOrders}</p>
                <p className="text-sm text-gray-600">Orders in range</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(metrics.avgOrderValue)}
                </p>
                <p className="text-sm text-gray-600">Avg order value</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{salesRecords.length}</p>
              <p className="text-sm text-gray-600">Records in range</p>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Trend removed by request */}

        {/* Sales records table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales records</h3>
          <div className="overflow-x-auto">
            <div className="flex items-center justify-end mb-3">
              <div className="text-xs text-gray-600 mr-2">Sort by:</div>
              <select
                className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                value={`${sortBy.field}:${sortBy.direction}`}
                onChange={(e) => {
                  const [field, direction] = e.target.value.split(':');
                  setSortBy({ field, direction });
                }}
              >
                <option value="date:desc">Date desc</option>
                <option value="date:asc">Date asc</option>
                <option value="amount:desc">Amount desc</option>
                <option value="amount:asc">Amount asc</option>
              </select>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(!sortedOrders || sortedOrders.length === 0) && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                      No data in selected range
                    </td>
                  </tr>
                )}
                {sortedOrders && sortedOrders.map((r, idx) => {
                  const recordName = `Sales ${(r.saleDate || '').slice(0,10) || `#${idx+1}`}`;
                  const date = r.saleDate || '';
                  const amount = parseFloat(r.saleAmount || 0);
                  return (
                    <tr key={`${recordName}-${idx}`} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">{recordName}</td>
                      <td className="px-6 py-3 text-sm text-gray-700">{date ? new Date(date).toLocaleDateString('vi-VN') : '—'}</td>
                      <td className="px-6 py-3 text-sm font-semibold text-gray-900">
                        {formatCurrency(isNaN(amount) ? 0 : amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer note */}
        <div className="text-xs text-gray-500 text-center py-3">
          Data reflects orders attributed to your account within the selected date range.
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
