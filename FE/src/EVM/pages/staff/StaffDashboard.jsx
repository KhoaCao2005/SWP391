import React, { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { Car, Package, Percent, TrendingUp, BarChart3, Users } from 'lucide-react'

const StaffDashboard = () => {
  const navigate = useNavigate()
  const kpis = useMemo(() => ([
    { label: 'Active Models', value: 5, icon: Car, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { label: 'Total Inventory', value: 100, icon: Package, color: 'text-green-600', bgColor: 'bg-green-100' },
    { label: 'Active Promotions', value: 3, icon: Percent, color: 'text-purple-600', bgColor: 'bg-purple-100' }
  ]), [])

  const quickActions = [
    { label: 'Manage Models', path: '/evm/vehicle-models', icon: Car, description: 'View and edit vehicle models' },
    { label: 'View Inventory', path: '/evm/inventory', icon: Package, description: 'Track stock across dealers' },
    { label: 'Promotions', path: '/evm/promotions', icon: BarChart3, description: 'Configure discounts and promos' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">EVM Staff Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">Overview and quick actions</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${k.bgColor} rounded-lg flex items-center justify-center`}>
                <k.icon className={`w-6 h-6 ${k.color}`} />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{k.value}</div>
            <div className="text-sm text-gray-600 mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickActions.map(action => (
          <button
            key={action.path}
            onClick={() => navigate(action.path)}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all text-left group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <action.icon className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{action.label}</h3>
            <p className="text-sm text-gray-600">{action.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

export default StaffDashboard
