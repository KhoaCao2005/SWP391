import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { AlertTriangle, TrendingUp } from 'lucide-react'
import axios from 'axios'
import { fetchConsumptionRate } from '../../services/inventoryService'

const API_URL = import.meta.env.VITE_API_URL

const InventoryReport = () => {
  const [model, setModel] = useState('All')
  const [period, setPeriod] = useState('Last 30 days')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  // Fetch inventory data from API
  const fetchInventoryData = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('No authentication token found. Please login again.')
        return
      }

      const response = await axios.post(
        `${API_URL}/EVM/viewInventory`,
        { _empty: true },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          }
        }
      )

      // Backend trả về {status: 'success', message: 'success', data: Array}
      // handleViewActiveInventory() trả về List<InventoryDTO>
      if (response.data && response.data.status === 'success' && response.data.data) {
        const backendData = response.data.data || []
        const inventoryList = []

        backendData.forEach((inventory) => {
          if (inventory.list && Array.isArray(inventory.list) && inventory.list.length > 0) {
            const modelData = inventory.list[0] // Service chỉ trả về 1 model trong list
            const stock = parseInt(inventory.quantity) || 0

            if (modelData) {
              const modelName = modelData.modelName || 'N/A'
              
              // Nếu có variants, tạo entry cho mỗi variant
              if (modelData.lists && Array.isArray(modelData.lists) && modelData.lists.length > 0) {
                modelData.lists.forEach((variant) => {
                  inventoryList.push({
                    model: modelName,
                    variant: `${variant.versionName || ''} ${variant.color || ''}`.trim() || 'N/A',
                    stock: stock,
                    sold: 0 // Backend không có sold data, có thể tính từ orders sau
                  })
                })
              } else {
                // Nếu không có variants, chỉ hiển thị model
                inventoryList.push({
                  model: modelName,
                  variant: 'All Variants',
                  stock: stock,
                  sold: 0
                })
              }
            }
          }
        })

        // Group by model và sum stock
        const modelMap = new Map()
        inventoryList.forEach(item => {
          const key = item.model
          if (modelMap.has(key)) {
            modelMap.get(key).stock += item.stock
            modelMap.get(key).sold += item.sold
          } else {
            modelMap.set(key, { model: key, stock: item.stock, sold: item.sold })
          }
        })

        const groupedData = Array.from(modelMap.values())
        setRows(groupedData)
      } else {
        console.log('Response not successful or no data:', response.data)
        setRows([])
      }
    } catch (error) {
      console.error('Error fetching inventory data:', error)
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: `${API_URL}/EVM/viewInventory`,
        message: error.message
      })
      alert(error.response?.data?.message || 'Failed to fetch inventory data')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInventoryData()
  }, [fetchInventoryData])

  const filtered = useMemo(() => rows.filter(r => model === 'All' || r.model === model), [rows, model])

  const totalStock = useMemo(() => filtered.reduce((s, r) => s + (r.stock || 0), 0), [filtered])
  const totalSold = useMemo(() => filtered.reduce((s, r) => s + (r.sold || 0), 0), [filtered])
  const rate = useMemo(() => {
    const total = totalStock + totalSold
    return total > 0 ? Math.round((totalSold / total) * 100) : 0
  }, [totalStock, totalSold])
  const forecast = useMemo(() => Math.round(totalSold * 1.1), [totalSold])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory & Consumption</h1>
            <p className="text-sm text-gray-600 mt-1">Track stock levels and sell-through rate</p>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={period} 
              onChange={(e) => setPeriod(e.target.value)} 
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
            <select 
              value={model} 
              onChange={(e) => setModel(e.target.value)} 
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option>All</option>
              {Array.from(new Set(rows.map(r => r.model))).map(modelName => (
                <option key={modelName} value={modelName}>{modelName}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-2">Total Stock</div>
          <div className="text-3xl font-bold text-gray-900">{totalStock}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-2">Total Sold</div>
          <div className="text-3xl font-bold text-gray-900">{totalSold}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-2">Consumption Rate</div>
          <div className="text-3xl font-bold text-gray-900">{rate}%</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-2">Forecast (next period)</div>
          <div className="text-3xl font-bold text-gray-900">{forecast}</div>
        </div>
      </div>

      {/* Models Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-sm font-semibold text-gray-900 mb-4">Models Breakdown</div>
        {loading ? (
          <div className="text-sm text-gray-500 text-center py-4">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-4">No inventory data available</div>
        ) : (
          <div className="space-y-4">
            {filtered.map(r => {
              const total = (r.stock || 0) + (r.sold || 0)
              const soldPercentage = total > 0 ? ((r.sold || 0) / total) * 100 : 0
              
              return (
                <div key={r.model}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-900">{r.model}</span>
                    <span className="text-sm text-gray-600">Stock {r.stock || 0} • Sold {r.sold || 0}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all duration-300" 
                      style={{ width: `${soldPercentage}%` }}
                    />
                  </div>
                  {(r.stock || 0) <= 5 && (r.stock || 0) > 0 && (
                    <div className="mt-2 flex items-center text-sm text-yellow-700">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Warning: Near out-of-stock
                    </div>
                  )}
                  {(r.stock || 0) > 50 && (
                    <div className="mt-2 flex items-center text-sm text-red-700">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Warning: Long-term inventory risk
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default InventoryReport
