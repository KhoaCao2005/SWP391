import React from 'react';
import { Package, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router';

const InventoryOverview = () => {
  const navigate = useNavigate();

  // Inventory data - to be fetched from API
  const inventoryData = [];

  const getTurnoverColor = (turnover) => {
    if (turnover >= 65) return 'text-green-600';
    if (turnover >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Package className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Inventory Overview</h3>
        </div>
        <button
          onClick={() => navigate('/manager/inventory/stock')}
          className="flex items-center space-x-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          <span>View All</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Model
              </th>
              <th className="text-center py-3 px-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Available
              </th>
              <th className="text-center py-3 px-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Reserved
              </th>
              <th className="text-center py-3 px-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Sold
              </th>
              <th className="text-center py-3 px-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Turnover
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {inventoryData.map((item) => (
              <tr
                key={item.id}
                onClick={() => navigate(`/manager/inventory/vehicles?model=${item.id}`)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="py-3 px-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{item.model}</span>
                    {item.status === 'low' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        Low Stock
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-2 text-center">
                  <span className={`font-semibold ${
                    item.available < 5 ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {item.available}
                  </span>
                </td>
                <td className="py-3 px-2 text-center">
                  <span className="text-blue-600 font-medium">{item.reserved}</span>
                </td>
                <td className="py-3 px-2 text-center">
                  <span className="text-green-600 font-medium">{item.sold}</span>
                </td>
                <td className="py-3 px-2 text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <span className={`font-semibold ${getTurnoverColor(item.turnover)}`}>
                      {item.turnover}%
                    </span>
                    {item.trend === 'up' ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-4 gap-4 text-center">
        <div>
          <p className="text-xs text-gray-500">Total Available</p>
          <p className="text-lg font-bold text-gray-900">
            {inventoryData.reduce((sum, item) => sum + item.available, 0)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Reserved</p>
          <p className="text-lg font-bold text-blue-600">
            {inventoryData.reduce((sum, item) => sum + item.reserved, 0)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Sold This Month</p>
          <p className="text-lg font-bold text-green-600">
            {inventoryData.reduce((sum, item) => sum + item.sold, 0)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Avg Turnover</p>
          <p className="text-lg font-bold text-gray-900">
            {(inventoryData.reduce((sum, item) => sum + item.turnover, 0) / inventoryData.length).toFixed(0)}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default InventoryOverview;

