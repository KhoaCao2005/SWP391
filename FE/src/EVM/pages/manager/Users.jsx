import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { Search, Plus, Edit2, X, UserPlus, Users as UsersIcon, Power, PowerOff } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

const Users = () => {
  const [role, setRole] = useState('All')
  const [query, setQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(`${API_URL}/EVM/viewAllDealerAccounts`, { _empty: true }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      })

      // Backend trả về {status: 'success', message: 'success', data: Array}
      if (response.data && response.data.status === 'success' && response.data.data) {
        // Transform backend data to frontend format
        // Backend đã trả về isActive từ database
        const users = (response.data.data || []).map(user => {
          const userId = user.userId || user.id
          // Backend trả về isActive (true/false) từ database
          // Database: 1 = true (Active), 0 = false (Suspended)
          const isActive = user.isActive !== undefined && user.isActive !== null 
            ? user.isActive 
            : true // Default là active nếu không có
          
          return {
            id: userId,
            name: user.username || user.name,
            email: user.email || '',
            phone: user.phoneNumber || user.phone || '',
            dealer: user.dealerName || `Dealer ${user.dealerId || 'A'}`,
            role: user.roleName || (user.roleId === 2 ? 'Dealer Admin' : 'Dealer Staff'),
            status: isActive ? 'Active' : 'Suspended'
          }
        })
        
        setRows(users)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      alert(error.response?.data?.message || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Form state for new user
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    dealer: 'Dealer A',
    role: 'Dealer Staff',
    status: 'Active'
  })

  const filtered = useMemo(() => rows.filter(u =>
    (role === 'All' || u.role === role) && (!query || `${u.name} ${u.id}`.toLowerCase().includes(query.toLowerCase()))
  ), [rows, role, query])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCreate = useCallback(() => {
    setNewUser({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      dealer: 'Dealer A',
      role: 'Dealer Staff',
      status: 'Active'
    })
    setShowCreateModal(true)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      
      // Map role string to roleId: "Dealer Admin" -> 2, "Dealer Staff" -> 3
      const roleIdMap = {
        'Dealer Admin': 2,
        'Dealer Staff': 3
      }
      const roleId = roleIdMap[newUser.role] || 3
      
      // Map dealer string to dealerId: "Dealer A" -> 1, "Dealer B" -> 2, etc.
      const dealerIdMatch = newUser.dealer.match(/Dealer\s+([A-Z])/i)
      const dealerId = dealerIdMatch ? dealerIdMatch[1].charCodeAt(0) - 64 : 1 // A=1, B=2, etc.
      
      if (editingUser) {
        // Validate password if provided
        let passwordToUpdate = null
        if (newUser.password || newUser.confirmPassword) {
          if (newUser.password !== newUser.confirmPassword) {
            alert('Password and Confirm Password do not match')
            return
          }
          if (newUser.password.length < 6) {
            alert('Password must be at least 6 characters long')
            return
          }
          passwordToUpdate = newUser.password
        }
        
        // Update existing user
        const response = await axios.post(
          `${API_URL}/EVM/updateDealerAccount`,
          {
            userId: editingUser.id,
            email: newUser.email,
            username: newUser.name,
            phoneNumber: newUser.phone,
            password: passwordToUpdate, // Update password if provided, otherwise null
            roleId: roleId
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true'
            }
          }
        )
        // Backend trả về {status: 'success', message: 'success', data: ...}
        if (response.data && response.data.status === 'success') {
          await fetchUsers()
          setShowEditModal(false)
          setEditingUser(null)
        } else {
          alert(response.data?.message || 'Failed to update user')
        }
      } else {
        // Validate password match
        if (newUser.password !== newUser.confirmPassword) {
          alert('Password and Confirm Password do not match')
          return
        }
        if (!newUser.password || newUser.password.length < 6) {
          alert('Password must be at least 6 characters long')
          return
        }
        
        // Create new user
        const response = await axios.post(
          `${API_URL}/EVM/createDealerAccount`,
          {
            dealerId: dealerId,
            email: newUser.email,
            username: newUser.name,
            password: newUser.password,
            phoneNumber: newUser.phone,
            roleId: roleId
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true'
            }
          }
        )
        // Backend trả về {status: 'success', message: 'success', data: ...}
        if (response.data && response.data.status === 'success') {
          await fetchUsers()
          setShowCreateModal(false)
        } else {
          alert(response.data?.message || 'Failed to create user')
        }
      }
      setNewUser({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        dealer: 'Dealer A',
        role: 'Dealer Staff',
        status: 'Active'
      })
    } catch (error) {
      console.error('Error saving user:', error)
      alert(error.response?.data?.message || 'Failed to save user')
    }
  }

  const handleEdit = useCallback((row) => {
    setEditingUser(row)
    setNewUser({
      name: row.name,
      email: row.email || '',
      phone: row.phone || '',
      password: '',
      confirmPassword: '',
      dealer: row.dealer,
      role: row.role,
      status: row.status
    })
    setShowEditModal(true)
  }, [])
  const handleToggleStatus = useCallback(async (row) => {
    try {
      const token = localStorage.getItem('token')
      const isCurrentlyActive = row.status === 'Active'
      
      console.log('Toggle status for user:', {
        userId: row.id,
        currentStatus: row.status,
        isCurrentlyActive,
        action: isCurrentlyActive ? 'Disable' : 'Enable'
      })
      
      // Gọi đúng endpoint dựa trên status hiện tại
      // Nếu đang Active -> Disable (suspend)
      // Nếu đang Suspended -> Enable (activate)
      const endpoint = isCurrentlyActive 
        ? `${API_URL}/EVM/disableDealerAccount`  // Active -> Disable
        : `${API_URL}/EVM/enableDealerAccount`   // Suspended -> Enable
      
      console.log('Calling endpoint:', endpoint)
      
      // Đảm bảo userId là số
      const userId = parseInt(row.id, 10)
      if (isNaN(userId) || userId <= 0) {
        alert('Invalid user ID')
        return
      }
      
      const response = await axios.post(
        endpoint,
        { userId: userId },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          }
        }
      )
      
      console.log('Toggle status response:', response.data)
      
      // Backend trả về {status: 'success', message: '...', data: ...}
      if (response.data && response.data.status === 'success') {
        // Update status ngay lập tức trong UI
        const newStatus = isCurrentlyActive ? 'Suspended' : 'Active'
        setRows(prevRows => 
          prevRows.map(user => 
            user.id === row.id 
              ? { ...user, status: newStatus }
              : user
          )
        )
        
        // Fetch lại sau 300ms để đồng bộ với backend (backend đã trả về isActive)
        setTimeout(() => {
          fetchUsers()
        }, 300)
      } else {
        alert(response.data?.message || 'Failed to update user status')
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      })
      alert(error.response?.data?.message || 'Failed to update user status')
    }
  }, [fetchUsers])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Users (Dealer Accounts)</h1>
            <p className="text-sm text-gray-600 mt-1">Create users, assign roles and manage access</p>
          </div>
          <button 
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center space-x-2 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create user</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              placeholder="Search user..." 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
          </div>
          <select 
            value={role} 
            onChange={(e) => setRole(e.target.value)} 
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option>All</option>
            <option>Dealer Admin</option>
            <option>Dealer Staff</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dealer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.dealer}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      u.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleEdit(u)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit2 className="w-4 h-4 inline" />
                      </button>
                      <button 
                        onClick={() => handleToggleStatus(u)}
                        className="text-gray-600 hover:text-gray-900"
                        title={u.status === 'Active' ? 'Suspend user' : 'Activate user'}
                      >
                        {u.status === 'Active' ? (
                          <PowerOff className="w-4 h-4 inline" />
                        ) : (
                          <Power className="w-4 h-4 inline" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => {
            setShowEditModal(false)
            setEditingUser(null)
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Edit2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
                  <p className="text-sm text-gray-600">Update user information below</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowEditModal(false)
                  setEditingUser(null)
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-5">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newUser.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter user full name"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Email and Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={newUser.email}
                      onChange={handleInputChange}
                      required
                      placeholder="user@email.com"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={newUser.phone}
                      onChange={handleInputChange}
                      placeholder="0987654321"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Password and Confirm Password */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={newUser.password}
                      onChange={handleInputChange}
                      placeholder="Leave blank to keep current password"
                      minLength={6}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={newUser.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm new password"
                      minLength={6}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Dealer and Role */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dealer <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="dealer"
                      value={newUser.dealer}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Dealer A">Dealer A</option>
                      <option value="Dealer B">Dealer B</option>
                      <option value="Dealer C">Dealer C</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="role"
                      value={newUser.role}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Dealer Admin">Dealer Admin</option>
                      <option value="Dealer Staff">Dealer Staff</option>
                    </select>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="status"
                    value={newUser.status}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <UsersIcon className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 mb-1">User Information</h4>
                      <p className="text-xs text-blue-700">
                        All required fields must be filled. User ID will remain unchanged. Leave password fields blank to keep current password.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingUser(null)
                  }}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center space-x-2"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Update User</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowCreateModal(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Create New User</h2>
                  <p className="text-sm text-gray-600">Fill in the user information below</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-5">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newUser.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter user full name"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Email and Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={newUser.email}
                      onChange={handleInputChange}
                      required
                      placeholder="user@email.com"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={newUser.phone}
                      onChange={handleInputChange}
                      placeholder="0987654321"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Password and Confirm Password */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={newUser.password}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter password (min 6 characters)"
                      minLength={6}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={newUser.confirmPassword}
                      onChange={handleInputChange}
                      required
                      placeholder="Confirm password"
                      minLength={6}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Dealer and Role */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dealer <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="dealer"
                      value={newUser.dealer}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Dealer A">Dealer A</option>
                      <option value="Dealer B">Dealer B</option>
                      <option value="Dealer C">Dealer C</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="role"
                      value={newUser.role}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Dealer Admin">Dealer Admin</option>
                      <option value="Dealer Staff">Dealer Staff</option>
                    </select>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="status"
                    value={newUser.status}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <UsersIcon className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 mb-1">User Information</h4>
                      <p className="text-xs text-blue-700">
                        All required fields must be filled. User ID will be automatically generated upon creation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create User</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status toggle handled inline; no modal needed */}
    </div>
  )
}

export default Users
