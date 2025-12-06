import React, { useMemo, useState } from 'react';
import { TrendingUp } from 'lucide-react';

const ChartsSection = () => {
  // Revenue data - to be fetched from API
  const revenueData = [];

  const maxRevenue = useMemo(
    () => revenueData.length > 0 ? Math.max(...revenueData.map(d => Math.max(d.revenue || 0, d.target || 0))) : 100,
    [revenueData]
  );

  const [hoverIndex, setHoverIndex] = useState(null);
  const handleMouseMove = (e) => {
    if (revenueData.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const step = rect.width / Math.max(revenueData.length - 1, 1);
    const idx = Math.round(x / step);
    setHoverIndex(Math.max(0, Math.min(revenueData.length - 1, idx)));
  };
  const clearHover = () => setHoverIndex(null);

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Monthly Revenue - Line Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-[#6f42c1]" />
            <h3 className="text-lg font-semibold text-gray-900">Revenue</h3>
          </div>
          <span className="text-sm text-gray-500">Last 12 Months</span>
        </div>

        {/* Chart Container */}
        <div className="relative h-64">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-gray-500">
            <span>{maxRevenue}B</span>
            <span>{(maxRevenue * 0.75).toFixed(0)}B</span>
            <span>{(maxRevenue * 0.5).toFixed(0)}B</span>
            <span>{(maxRevenue * 0.25).toFixed(0)}B</span>
            <span>0</span>
          </div>

          {/* Chart Area */}
          <div className="absolute left-14 right-0 top-0 bottom-8" onMouseMove={handleMouseMove} onMouseLeave={clearHover}>
            <svg className="w-full h-full" viewBox="0 0 600 240" preserveAspectRatio="none">
              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <line
                  key={i}
                  x1="0"
                  y1={i * 60}
                  x2="600"
                  y2={i * 60}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
              ))}

              {/* Revenue line */}
              <polyline
                points={revenueData.map((d, i) => 
                  `${(i * 600) / (revenueData.length - 1)},${240 - (d.revenue / maxRevenue) * 240}`
                ).join(' ')}
                fill="none"
                stroke="#6f42c1"
                strokeWidth="3"
              />

              {/* Data points */}
              {revenueData.map((d, i) => (
                <circle
                  key={i}
                  cx={(i * 600) / (revenueData.length - 1)}
                  cy={240 - (d.revenue / maxRevenue) * 240}
                  r="5"
                  fill="#6f42c1"
                  stroke="white"
                  strokeWidth="2"
                />
              ))}

              {/* Hover vertical line and point */}
              {hoverIndex !== null && (
                <>
                  <line
                    x1={(hoverIndex * 600) / (revenueData.length - 1)}
                    y1="0"
                    x2={(hoverIndex * 600) / (revenueData.length - 1)}
                    y2="240"
                    stroke="#c7c9d1"
                    strokeDasharray="4,4"
                  />
                  <circle
                    cx={(hoverIndex * 600) / (revenueData.length - 1)}
                    cy={240 - (revenueData[hoverIndex].revenue / maxRevenue) * 240}
                    r="6"
                    fill="#6f42c1"
                    stroke="white"
                    strokeWidth="2"
                  />
                </>
              )}
            </svg>

            {/* Tooltip */}
            {hoverIndex !== null && (
              <div
                className="absolute -translate-x-1/2 -translate-y-3 bg-[#2b2e3a] text-white text-xs px-3 py-2 rounded-md shadow-md"
                style={{
                  left: `calc(${(hoverIndex * 100) / (revenueData.length - 1)}% + 14px)`,
                  top: `${
                    ((240 - (revenueData[hoverIndex].revenue / maxRevenue) * 240) * 100) / 240
                  }%`
                }}
              >
                <div className="font-semibold mb-1">{revenueData[hoverIndex].month} 2023</div>
                <div className="flex items-center justify-between space-x-4">
                  <span className="opacity-80">Income</span>
                  <span className="font-semibold">${(revenueData[hoverIndex].revenue * 20).toFixed(0)}0</span>
                </div>
              </div>
            )}
          </div>

          {/* X-axis labels */}
          <div className="absolute left-14 right-0 bottom-0 h-8 flex justify-between items-center text-xs text-gray-500">
            {revenueData.map((d) => (
              <span key={d.month}>{d.month}</span>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-end space-x-3 text-sm">
          <span className="inline-flex items-center space-x-2 text-gray-600">
            <span className="inline-block w-3 h-0.5 bg-[#6f42c1]"></span>
            <span>Income</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChartsSection;

