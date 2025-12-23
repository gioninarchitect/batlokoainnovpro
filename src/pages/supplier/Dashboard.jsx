import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSupplierAuth } from '@/context/SupplierAuthContext'
import { useTheme } from '@/context/ThemeContext'
import SupplierLayout from '@/components/supplier/SupplierLayout'

const API_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' ? 'http://localhost:3016/api/v1' : `${window.location.origin}/api/v1`
)

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  DISPATCHED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  RECEIVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
}

export default function SupplierDashboard() {
  const { supplier, token } = useSupplierAuth()
  const { darkMode } = useTheme()
  const [stats, setStats] = useState({
    pendingOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    totalRevenue: 0
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${API_URL}/portal/supplier/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.stats) setStats(data.stats)
        if (data.recentOrders) setRecentOrders(data.recentOrders)
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const supplierName = supplier?.name || supplier?.company || 'Supplier'

  if (loading) {
    return (
      <SupplierLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-industrial"></div>
        </div>
      </SupplierLayout>
    )
  }

  return (
    <SupplierLayout>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-industrial to-navy rounded-xl p-6 text-white">
          <h1 className="text-xl sm:text-2xl font-bold">Welcome back, {supplierName}</h1>
          <p className="text-white/80 mt-1 text-sm sm:text-base">Manage your purchase orders and products</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`rounded-xl p-4 sm:p-6 shadow-sm ${darkMode ? 'bg-navy' : 'bg-white'}`}>
            <div className="flex items-center">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${darkMode ? 'bg-yellow-900/50' : 'bg-yellow-100'}`}>
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Pending</p>
                <p className={`text-lg sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.pendingOrders}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-xl p-4 sm:p-6 shadow-sm ${darkMode ? 'bg-navy' : 'bg-white'}`}>
            <div className="flex items-center">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${darkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Active</p>
                <p className={`text-lg sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.activeOrders}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-xl p-4 sm:p-6 shadow-sm ${darkMode ? 'bg-navy' : 'bg-white'}`}>
            <div className="flex items-center">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${darkMode ? 'bg-green-900/50' : 'bg-green-100'}`}>
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Completed</p>
                <p className={`text-lg sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.completedOrders}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-xl p-4 sm:p-6 shadow-sm ${darkMode ? 'bg-navy' : 'bg-white'}`}>
            <div className="flex items-center">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${darkMode ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Revenue</p>
                <p className={`text-lg sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>R{stats.totalRevenue?.toLocaleString() || '0'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={`rounded-xl p-6 shadow-sm ${darkMode ? 'bg-navy' : 'bg-white'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              to="/supplier/orders?status=PENDING"
              className={`flex flex-col items-center p-4 rounded-lg transition-colors ${darkMode ? 'bg-yellow-900/20 hover:bg-yellow-900/30' : 'bg-yellow-50 hover:bg-yellow-100'}`}
            >
              <svg className="h-8 w-8 text-yellow-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Review Orders</span>
            </Link>

            <Link
              to="/supplier/orders?status=ACCEPTED"
              className={`flex flex-col items-center p-4 rounded-lg transition-colors ${darkMode ? 'bg-blue-900/20 hover:bg-blue-900/30' : 'bg-blue-50 hover:bg-blue-100'}`}
            >
              <svg className="h-8 w-8 text-blue-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Ship Orders</span>
            </Link>

            <Link
              to="/supplier/products"
              className={`flex flex-col items-center p-4 rounded-lg transition-colors ${darkMode ? 'bg-green-900/20 hover:bg-green-900/30' : 'bg-green-50 hover:bg-green-100'}`}
            >
              <svg className="h-8 w-8 text-green-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Update Stock</span>
            </Link>

            <Link
              to="/supplier/profile"
              className={`flex flex-col items-center p-4 rounded-lg transition-colors ${darkMode ? 'bg-purple-900/20 hover:bg-purple-900/30' : 'bg-purple-50 hover:bg-purple-100'}`}
            >
              <svg className="h-8 w-8 text-purple-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Settings</span>
            </Link>
          </div>
        </div>

        {/* Recent Orders */}
        <div className={`rounded-xl shadow-sm overflow-hidden ${darkMode ? 'bg-navy' : 'bg-white'}`}>
          <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Recent Purchase Orders</h2>
              <Link to="/supplier/orders" className="text-sm text-industrial hover:text-industrial/80">
                View All
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className={darkMode ? 'bg-navy-dark' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>PO Number</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Date</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Items</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className={`px-6 py-8 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      No orders yet
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className={darkMode ? 'hover:bg-navy-dark' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{order.poNumber}</span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {order.items?.length || 0} items
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        R{order.total?.toLocaleString() || '0'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          to={`/supplier/orders/${order.id}`}
                          className="text-industrial hover:text-industrial/80"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SupplierLayout>
  )
}
