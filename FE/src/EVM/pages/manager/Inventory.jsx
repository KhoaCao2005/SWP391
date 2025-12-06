import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { RefreshCw, TrendingUp, Package, BarChart3, AlertTriangle, Clock } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

const Metric = ({ label, value, icon: Icon, iconColor }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-2">
      <Icon className={`w-5 h-5 ${iconColor || 'text-gray-600'}`} />
      <TrendingUp className="w-4 h-4 text-green-500" />
    </div>
    <div className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</div>
    <div className="text-xs text-gray-600 mt-1">{label}</div>
  </div>
)

const Inventory = () => {
  const [dealer, setDealer] = useState('All')
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState('dealer')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)
  const pageSize = 8

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  // Fetch inventory from API
  const fetchInventory = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('No authentication token found. Please login again.')
        return
      }
      
      console.log('Fetching inventory from:', `${API_URL}/EVM/viewInventory`)
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
      if (response.data && response.data.status === 'success' && response.data.data) {
        // Transform backend data to frontend format
        // handleViewActiveInventory() trả về List<InventoryDTO> với list là modelList (không có variants)
        const inventoryList = []
        const backendData = response.data.data || []
        
        backendData.forEach((inventory) => {
          if (inventory.list && Array.isArray(inventory.list) && inventory.list.length > 0) {
            const model = inventory.list[0] // Service chỉ trả về 1 model trong list
            const qty = parseInt(inventory.quantity) || 0
            
            if (qty > 0 && model) {
              // Nếu model có variants (lists), tạo entry cho mỗi variant
              if (model.lists && Array.isArray(model.lists) && model.lists.length > 0) {
                model.lists.forEach((variant) => {
                  inventoryList.push({
                    id: `${model.modelId}-${variant.variantId || 'default'}`,
                    dealer: 'All Dealers',
                    model: model.modelName || 'N/A',
                    variant: `${variant.versionName || ''} ${variant.color || ''}`.trim() || 'N/A',
                    qty: qty,
                    status: variant.isActive ? 'In Stock' : 'Out of Stock',
                    daysInStock: variant.daysInStock || 0
                  })
                })
              } else {
                // Nếu không có variants, chỉ hiển thị model
                inventoryList.push({
                  id: `model-${model.modelId}`,
                  dealer: 'All Dealers',
                  model: model.modelName || 'N/A',
                  variant: 'All Variants',
                  qty: qty,
                  status: model.isActive ? 'In Stock' : 'Out of Stock',
                  daysInStock: 0
                })
              }
            }
          }
        })
        
        setRows(inventoryList)
      } else {
        console.log('Response not successful or no data:', response.data)
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: `${API_URL}/EVM/viewInventory`,
        message: error.message
      })
      
      let errorMessage = 'Failed to fetch inventory'
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInventory()
  }, [fetchInventory])

  const [lastRefreshed, setLastRefreshed] = useState(null)

  const summary = useMemo(() => ({
    totalUnits: rows.reduce((s, r) => s + r.qty, 0),
    dealers: new Set(rows.map(r => r.dealer)).size,
    models: new Set(rows.map(r => r.model)).size
  }), [rows])

  const filtered = useMemo(() => rows.filter(r =>
    (dealer === 'All' || r.dealer === dealer) &&
    (!query || `${r.model} ${r.variant}`.toLowerCase().includes(query.toLowerCase()))
  ), [rows, dealer, query])
  const sorted = useMemo(() => {
    const copy = [...filtered]
    copy.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av
      const cmp = String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })
    return copy
  }, [filtered, sortKey, sortDir])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = useMemo(() => sorted.slice((page - 1) * pageSize, page * pageSize), [sorted, page])

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const handleRefresh = useCallback(async () => {
    setLastRefreshed(new Date().toLocaleTimeString())
    await fetchInventory()
  }, [fetchInventory])


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
            <p className="text-sm text-gray-600 mt-1">Coordinate vehicle stock across dealers</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleRefresh}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg flex items-center space-x-2 shadow-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Metric label="Total Units" value={summary.totalUnits} icon={Package} />
        <Metric label="Dealers" value={summary.dealers} icon={Building2} />
        <Metric label="Models" value={summary.models} icon={BarChart3} />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <input 
            placeholder="Search model/variant..." 
            value={query} 
            onChange={(e) => { setQuery(e.target.value); setPage(1) }} 
            className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          />
          <select 
            value={dealer} 
            onChange={(e) => setDealer(e.target.value)} 
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option>All</option>
            <option>Dealer A</option>
            <option>Dealer B</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {lastRefreshed && (
          <div className="text-xs text-gray-500 px-6 pt-4 mb-2">Last refreshed at {lastRefreshed}</div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleSort('dealer')}
                >
                  Dealer
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleSort('model')}
                >
                  Model
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleSort('variant')}
                >
                  Variant
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleSort('qty')}
                >
                  Quantity
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                    No inventory found
                  </td>
                </tr>
              ) : (
                paged.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.dealer}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.model}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.variant}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{r.qty}</span>
                      {(r.qty <= 2) && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Low
                        </span>
                      )}
                      {(r.daysInStock >= 60 && r.qty > 0) && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <Clock className="w-3 h-3 mr-1" />
                          Long stock
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {page} of {totalPages} • Total {filtered.length}
          </div>
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => Math.max(1, p - 1))} 
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <button 
              disabled={page === totalPages} 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}

export default Inventory
