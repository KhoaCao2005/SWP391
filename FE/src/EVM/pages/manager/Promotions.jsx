import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { Plus, Search, X, ChevronLeft, ChevronDown, CheckCircle } from 'lucide-react'
import axios from 'axios'
import Modal from '../../components/Modal'
import ConfirmModal from '../../components/ConfirmModal'

const API_URL = import.meta.env.VITE_API_URL

const Promotions = () => {
  const [rows, setRows] = useState([])
  const [dealer, setDealer] = useState('All')
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState('dealer')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)
  const pageSize = 8
  const [showCreate, setShowCreate] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [applyingPromotion, setApplyingPromotion] = useState(null)
  const [dealers, setDealers] = useState([])
  const [selectedDealerId, setSelectedDealerId] = useState('')
  const [form, setForm] = useState({ name: '', type: 'PERCENTAGE', value: '5%', from: '2025-10-01', to: '2025-12-31' })
  const [deletingPromotion, setDeletingPromotion] = useState(null)
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)

  // Fetch promotions from API
  const fetchPromotions = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(`${API_URL}/EVM/viewPromotionDealerCount`, { _empty: true }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      })

      // Backend trả về {status: 'success', message: 'success', data: Array}
      // getAllPromotionsWithDealers() trả về List<Map> với: promoId, description, startDate, endDate, discountRate, type, dealers[]
      if (response.data && response.data.status === 'success' && response.data.data) {
        // Transform backend data to frontend format
        const promotions = []
        const backendData = response.data.data || []
        const now = new Date()
        
        backendData.forEach(promo => {
          const dealers = promo.dealers || []
          
          // Convert backend format to frontend display format
          // Xử lý cả data cũ (số nguyên + type mô tả) và data mới (decimal + PERCENTAGE/FIXED)
          let displayType = promo.type || 'Discount'
          if (displayType === 'PERCENTAGE') {
            displayType = 'Discount'
          } else if (displayType === 'FIXED') {
            displayType = 'Fixed'
          }
          // Data cũ: type là string mô tả như "Model Discount", "High Value Order" → giữ nguyên
          
          // Convert discountRate: xử lý cả data cũ (số nguyên) và data mới (decimal)
          let displayValue = '0%'
          if (promo.discountRate) {
            const rateValue = parseFloat(promo.discountRate)
            
            // Data mới: PERCENTAGE + rate <= 1 (ví dụ: 0.05 → 5%, 1.0 → 100%)
            if (promo.type === 'PERCENTAGE' && rateValue <= 1) {
              displayValue = `${(rateValue * 100).toFixed(0)}%`
            } 
            // Data cũ: số nguyên hoặc type không phải PERCENTAGE (ví dụ: 5, 3 → 5%, 3%)
            // Hoặc data mới nhưng rate > 1 (đã được convert sẵn)
            else {
              displayValue = `${rateValue}%`
            }
          }
          
          // Calculate active status based on date range (same logic as Manager side)
          const startDate = promo.startDate ? new Date(promo.startDate) : null
          const endDate = promo.endDate ? new Date(promo.endDate) : null
          const isActive = (!startDate || startDate <= now) && (!endDate || now <= endDate)
          
          // Nếu có dealers, tạo một entry cho mỗi dealer
          if (dealers.length > 0) {
            dealers.forEach(dealer => {
              promotions.push({
                id: `${promo.promoId}-${dealer.dealerId || ''}`,
                promoId: promo.promoId,
                dealer: dealer.dealerName || 'All Dealers',
                dealerId: dealer.dealerId,
                name: promo.description || 'Promotion',
                type: displayType,
                value: displayValue,
                from: promo.startDate || '',
                to: promo.endDate || '',
                active: isActive
              })
            })
          } else {
            // Nếu không có dealers, tạo một entry chung (promotion chưa được apply)
            promotions.push({
              id: promo.promoId || promo.id,
              promoId: promo.promoId || promo.id,
              dealer: '-', // Chưa được apply cho dealer nào
              dealerId: null,
              name: promo.description || 'Promotion',
              type: displayType,
              value: displayValue,
              from: promo.startDate || '',
              to: promo.endDate || '',
              active: isActive
            })
          }
        })
        
        setRows(promotions)
      }
    } catch (error) {
      console.error('Error fetching promotions:', error)
      alert(error.response?.data?.message || 'Failed to fetch promotions')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch dealers list
  const fetchDealers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(`${API_URL}/EVM/viewAllDealer`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      })

      if (response.data && response.data.status === 'success' && response.data.data) {
        setDealers(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching dealers:', error)
    }
  }, [])

  useEffect(() => {
    fetchPromotions()
    fetchDealers()
  }, [fetchPromotions, fetchDealers])

  const filtered = useMemo(() => rows.filter(p =>
    (dealer === 'All' || p.dealer === dealer || (dealer === 'Not applied' && p.dealer === '-')) &&
    (!query || p.name.toLowerCase().includes(query.toLowerCase()))
  ), [rows, dealer, query])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const sorted = useMemo(() => {
    const copy = [...filtered]
    copy.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      const cmp = String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })
    return copy
  }, [filtered, sortKey, sortDir])
  const paged = useMemo(() => sorted.slice((page - 1) * pageSize, page * pageSize), [sorted, page])
  const toggleSort = (key) => { if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortKey(key); setSortDir('asc') } }

  const handleCreate = useCallback(async () => { setForm({ name: '', type: 'PERCENTAGE', value: '5%', from: '2025-10-01', to: '2025-12-31' }); setShowCreate(true) }, [])
  
  const handleApply = useCallback((row) => {
    // Extract promoId: ưu tiên lấy từ row.promoId, nếu không có thì extract từ row.id
    let promoId = null
    
    if (row.promoId) {
      promoId = String(row.promoId)
    } else if (row.id) {
      const idString = String(row.id)
      promoId = idString.includes('-') ? idString.split('-')[0] : idString
    }
    
    if (!promoId || promoId === 'undefined' || promoId === 'null') {
      console.error('Invalid promoId extracted:', promoId, 'from row:', row)
      alert('Không tìm thấy Promotion ID')
      return
    }
    
    setApplyingPromotion({ ...row, promoId: promoId })
    setSelectedDealerId('')
    setShowApplyModal(true)
  }, [])

  const confirmApply = useCallback(async () => {
    if (!applyingPromotion || !selectedDealerId) {
      alert('Vui lòng chọn dealer')
      return
    }
    
    try {
      setApplying(true)
      const token = localStorage.getItem('token')
      let promoId = applyingPromotion.promoId
      
      // Fallback: extract từ id nếu promoId chưa được set
      if (!promoId && applyingPromotion.id) {
        const idString = String(applyingPromotion.id || '')
        if (idString && idString !== 'undefined' && idString !== 'null') {
          promoId = idString.includes('-') ? idString.split('-')[0] : idString
        }
      }
      
      // Validate promoId
      if (!promoId || promoId === 'undefined' || promoId === 'null' || isNaN(parseInt(promoId))) {
        console.error('Invalid promoId:', promoId, 'from applyingPromotion:', applyingPromotion)
        alert('Không tìm thấy Promotion ID hợp lệ')
        return
      }

      // Call apply promotion endpoint
      const response = await axios.post(
        `${API_URL}/EVM/createDealerPromotions`,
        {
          promoId: parseInt(promoId),
          dealerId: parseInt(selectedDealerId)
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          }
        }
      )
      
      if (response.data && response.data.status === 'success') {
        await fetchPromotions()
        setShowApplyModal(false)
        setApplyingPromotion(null)
        setSelectedDealerId('')
        alert('Promotion applied to dealer successfully')
      } else {
        alert(response.data?.message || 'Failed to apply promotion to dealer')
      }
    } catch (error) {
      console.error('Error applying promotion:', error)
      if (error.response?.status === 400 || error.response?.status === 409) {
        alert(error.response?.data?.message || 'Promotion may already be assigned to this dealer')
      } else {
        alert(error.response?.data?.message || 'Failed to apply promotion to dealer')
      }
    } finally {
      setApplying(false)
    }
  }, [applyingPromotion, selectedDealerId, fetchPromotions])

  const handleDelete = useCallback((row) => {
    // Extract promoId from row.id (format: "promoId-dealerId" or just "promoId")
    // Convert to string first to avoid split error if row.id is number or undefined
    if (!row || !row.id) {
      console.error('Invalid row data:', row)
      alert('Không tìm thấy thông tin promotion')
      return
    }
    
    const idString = String(row.id)
    const promoId = idString.includes('-') ? idString.split('-')[0] : idString
    
    if (!promoId || promoId === 'undefined' || promoId === 'null') {
      console.error('Invalid promoId extracted:', promoId, 'from row.id:', row.id)
      alert('Không tìm thấy Promotion ID')
      return
    }
    
    setDeletingPromotion({ ...row, promoId: promoId })
    setShowDeleteModal(true)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!deletingPromotion) {
      console.error('No promotion selected for deletion')
      return
    }
    
    try {
      const token = localStorage.getItem('token')
      // Extract promoId - đã được set trong handleDelete, hoặc extract từ id
      let promoId = deletingPromotion.promoId
      
      // Fallback: extract từ id nếu promoId chưa được set
      if (!promoId && deletingPromotion.id) {
        const idString = String(deletingPromotion.id || '')
        if (idString && idString !== 'undefined' && idString !== 'null') {
          promoId = idString.includes('-') ? idString.split('-')[0] : idString
        }
      }
      
      // Validate promoId
      if (!promoId || promoId === 'undefined' || promoId === 'null' || isNaN(parseInt(promoId))) {
        console.error('Invalid promoId:', promoId, 'from deletingPromotion:', deletingPromotion)
        alert('Không tìm thấy Promotion ID hợp lệ')
        return
      }

      // Call delete promotion endpoint (matches BE: /api/EVM/deletePromotion)
      const response = await axios.post(
        `${API_URL}/EVM/deletePromotion`,
        { promoId: parseInt(promoId) },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          }
        }
      )
      
      if (response.data && response.data.status === 'success') {
        await fetchPromotions()
        setShowDeleteModal(false)
        setDeletingPromotion(null)
        alert('Promotion deleted successfully')
      } else {
        alert(response.data?.message || 'Failed to delete promotion')
      }
    } catch (error) {
      console.error('Error deleting promotion:', error)
      // Nếu endpoint chưa tồn tại, thử hard delete hoặc show message
      if (error.response?.status === 404) {
        alert('Delete endpoint chưa được implement. Vui lòng liên hệ admin.')
      } else {
        alert(error.response?.data?.message || 'Failed to delete promotion')
      }
    }
  }, [deletingPromotion, fetchPromotions])


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
            <p className="text-sm text-gray-600 mt-1">Wholesale prices, discounts and dealer promos</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center space-x-2 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create promotion</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              placeholder="Search promotions..." 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
          </div>
          <select 
            value={dealer} 
            onChange={(e) => setDealer(e.target.value)} 
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="All">All</option>
            <option value="Not applied">Not applied</option>
            {dealers.map((d) => (
              <option key={d.dealerId || d.dealer_id} value={d.dealerName || d.dealer_name || d.name}>
                {d.dealerName || d.dealer_name || d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
                  onClick={() => toggleSort('name')}
                >
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                    No promotions found
                  </td>
                </tr>
              ) : (
                paged.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {p.dealer === '-' ? <span className="text-gray-400 italic">Not applied</span> : p.dealer}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.value}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.from}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.to}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      p.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {p.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleApply(p)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        title="Apply to dealer"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">Apply</span>
                      </button>
                      <button 
                        onClick={() => handleDelete(p)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete promotion"
                      >
                        <X className="w-4 h-4 inline" />
                      </button>
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
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </button>
            <button 
              disabled={page === totalPages} 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
            >
              Next
              <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
            </button>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <Modal 
        title="Create Promotion" 
        open={showCreate} 
        onClose={() => setShowCreate(false)} 
        onSubmit={async () => {
          try {
            // Validate required fields trước khi gửi
            if (!form.name || !form.name.trim()) {
              alert('Vui lòng nhập Description')
              return
            }
            if (!form.type || !form.type.trim()) {
              alert('Vui lòng nhập Type')
              return
            }
            if (!form.value || !form.value.trim()) {
              alert('Vui lòng nhập Value')
              return
            }
            // Validate value based on type
            const valueNum = parseFloat(form.value.replace('%', '').trim())
            if (isNaN(valueNum)) {
              alert('Value phải là số hợp lệ')
              return
            }
            if (form.type === 'PERCENTAGE' && (valueNum < 0 || valueNum > 100)) {
              alert('PERCENTAGE phải từ 0 đến 100')
              return
            }
            if (form.type === 'FIXED' && valueNum < 0) {
              alert('FIXED phải là số dương')
              return
            }
            if (!form.from || !form.from.trim()) {
              alert('Vui lòng nhập From date')
              return
            }
            if (!form.to || !form.to.trim()) {
              alert('Vui lòng nhập To date')
              return
            }
            
            const token = localStorage.getItem('token')
            // Map frontend format to backend format
            // Backend validation expect: type phải là "PERCENTAGE" hoặc "FIXED"
            // Nếu PERCENTAGE, discountRate phải là 0-1 (0.05 cho 5%)
            const valueWithoutPercent = form.value.replace('%', '').trim()
            
            // Validate discountRate là số hợp lệ
            if (!valueWithoutPercent || isNaN(parseFloat(valueWithoutPercent))) {
              alert('Value phải là số hợp lệ')
              return
            }
            
            // Type đã được chọn từ dropdown, không cần convert
            const backendType = form.type.trim() // PERCENTAGE hoặc FIXED
            
            // Convert discountRate: nếu PERCENTAGE, convert từ 5 → 0.05 (chia 100)
            let discountRate = valueWithoutPercent
            if (backendType === 'PERCENTAGE') {
              const rateValue = parseFloat(valueWithoutPercent)
              if (rateValue > 1) {
                // Frontend nhập "5" (5%), convert thành "0.05" để pass backend validation
                discountRate = (rateValue / 100.0).toString()
              }
            }
            
            // Create promotion với đúng format mà backend validation expect
            const response = await axios.post(
              `${API_URL}/EVM/createPromotion`,
              {
                description: form.name.trim(),        // description (required)
                startDate: form.from.trim(),          // startDate (required)
                endDate: form.to.trim(),              // endDate (required)
                discountRate: discountRate,           // discountRate (0.05 cho PERCENTAGE, hoặc số nguyên cho FIXED)
                type: backendType                     // type (PERCENTAGE hoặc FIXED)
              },
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                  'ngrok-skip-browser-warning': 'true'
                }
              }
            )
            
            if (response.data && response.data.status === 'success') {
              // Promotion được tạo thành công, chưa apply cho dealer nào
              // Dealer sẽ được apply sau khi click nút Apply
              await fetchPromotions()
              setShowCreate(false)
              alert('Promotion created successfully. You can apply it to dealers using the Apply button.')
            } else {
              alert(response.data?.message || 'Failed to create promotion')
            }
          } catch (error) {
            console.error('Error creating promotion:', error)
            alert(error.response?.data?.message || 'Failed to create promotion')
          }
        }}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <input className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Description" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              value={form.type} 
              onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
            >
              <option value="PERCENTAGE">PERCENTAGE</option>
              <option value="FIXED">FIXED</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Value {form.type === 'PERCENTAGE' ? '(e.g., 5 for 5%)' : '(e.g., 1000000 for 1,000,000 VND)'}</label>
            <input className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder={form.type === 'PERCENTAGE' ? 'Value (e.g., 5 for 5%)' : 'Value (e.g., 1000000)'} value={form.value} onChange={(e) => setForm(f => ({ ...f, value: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From (YYYY-MM-DD)</label>
            <input className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="From (YYYY-MM-DD)" value={form.from} onChange={(e) => setForm(f => ({ ...f, from: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To (YYYY-MM-DD)</label>
            <input className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="To (YYYY-MM-DD)" value={form.to} onChange={(e) => setForm(f => ({ ...f, to: e.target.value }))} />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={showDeleteModal && !!deletingPromotion}
        title="Delete Promotion"
        description={deletingPromotion ? (
          <div>
            <p className="text-gray-700 mb-2">Are you sure you want to delete <span className="font-semibold text-gray-900">{deletingPromotion.name}</span>?</p>
            <p className="text-sm text-gray-500">This action cannot be undone. The promotion will be permanently removed.</p>
          </div>
        ) : ''}
        onCancel={() => { setShowDeleteModal(false); setDeletingPromotion(null) }}
        onConfirm={confirmDelete}
        confirmText="Delete Promotion"
        tone="red"
      />

      {/* Apply Promotion Modal */}
      <Modal 
        title="Apply Promotion to Dealer" 
        open={showApplyModal && !!applyingPromotion} 
        onClose={() => { 
          setShowApplyModal(false)
          setApplyingPromotion(null)
          setSelectedDealerId('')
        }} 
        onSubmit={confirmApply}
        submitText={applying ? "Applying..." : "Apply"}
        cancelText="Cancel"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Apply promotion: <span className="font-semibold text-gray-900">{applyingPromotion?.name}</span>
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Dealer</label>
            <select 
              value={selectedDealerId} 
              onChange={(e) => setSelectedDealerId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={applying}
            >
              <option value="">-- Select a dealer --</option>
              {dealers.map((dealer) => (
                <option key={dealer.dealerId || dealer.dealer_id} value={dealer.dealerId || dealer.dealer_id}>
                  {dealer.dealerName || dealer.dealer_name || dealer.name}
                </option>
              ))}
            </select>
          </div>
          {selectedDealerId && (
            <div className="text-sm text-gray-500">
              This promotion will be assigned to the selected dealer and they will be able to use it.
            </div>
          )}
        </div>
      </Modal>

    </div>
  )
}

export default Promotions
