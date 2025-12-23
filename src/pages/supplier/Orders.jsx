import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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

const statusTabs = [
  { key: 'all', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'DISPATCHED', label: 'Dispatched' },
  { key: 'RECEIVED', label: 'Completed' },
]

export default function SupplierOrders() {
  const { token } = useSupplierAuth()
  const { darkMode } = useTheme()
  const [searchParams, setSearchParams] = useSearchParams()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const activeStatus = searchParams.get('status') || 'all'

  useEffect(() => {
    fetchOrders()
  }, [activeStatus])

  const fetchOrders = async () => {
    try {
      const url = activeStatus === 'all'
        ? `${API_URL}/portal/supplier/orders`
        : `${API_URL}/portal/supplier/orders?status=${activeStatus}`

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || data || [])
      }
    } catch (error) {
      console.error('Orders fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = (status) => {
    if (status === 'all') {
      searchParams.delete('status')
    } else {
      searchParams.set('status', status)
    }
    setSearchParams(searchParams)
  }

  const handleAction = async (orderId, action) => {
    setActionLoading(true)
    try {
      const response = await fetch(`${API_URL}/portal/supplier/orders/${orderId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        fetchOrders()
        setSelectedOrder(null)
      }
    } catch (error) {
      console.error('Action error:', error)
    } finally {
      setActionLoading(false)
    }
  }

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
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Purchase Orders</h1>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Manage incoming purchase orders</p>
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleStatusChange(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeStatus === tab.key
                  ? 'bg-industrial text-white'
                  : darkMode
                    ? 'bg-navy text-gray-300 hover:bg-gray-800'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className={`rounded-xl shadow-sm overflow-hidden ${darkMode ? 'bg-navy' : 'bg-white'}`}>
          {orders.length === 0 ? (
            <div className={`p-8 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No orders found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className={darkMode ? 'bg-navy-dark' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>PO Number</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Date</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Items</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Expected Date</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {orders.map((order) => (
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
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        R{order.total?.toLocaleString() || '0'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {order.expectedDate ? new Date(order.expectedDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="text-industrial hover:text-industrial/80"
                          >
                            View
                          </button>
                          {order.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleAction(order.id, 'accept')}
                                disabled={actionLoading}
                                className="text-green-600 hover:text-green-800"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleAction(order.id, 'reject')}
                                disabled={actionLoading}
                                className="text-red-600 hover:text-red-800"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {order.status === 'ACCEPTED' && (
                            <button
                              onClick={() => handleAction(order.id, 'dispatch')}
                              disabled={actionLoading}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Dispatch
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/50" onClick={() => setSelectedOrder(null)} />
              <div className={`relative w-full max-w-2xl rounded-xl shadow-xl ${darkMode ? 'bg-navy' : 'bg-white'}`}>
                <div className={`flex items-center justify-between p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    PO #{selectedOrder.poNumber}
                  </h3>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</p>
                      <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full ${statusColors[selectedOrder.status]}`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total</p>
                      <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        R{selectedOrder.total?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Order Date</p>
                      <p className={darkMode ? 'text-white' : 'text-gray-900'}>
                        {new Date(selectedOrder.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Expected Date</p>
                      <p className={darkMode ? 'text-white' : 'text-gray-900'}>
                        {selectedOrder.expectedDate ? new Date(selectedOrder.expectedDate).toLocaleDateString() : '-'}
                      </p>
                    </div>
                  </div>

                  {/* Items */}
                  <div className={`border rounded-lg ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700 bg-navy-dark' : 'border-gray-200 bg-gray-50'}`}>
                      <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Items</h4>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {selectedOrder.items?.map((item, index) => (
                        <div key={index} className="p-4 flex justify-between items-center">
                          <div>
                            <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {item.product?.name || item.productName || 'Product'}
                            </p>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Qty: {item.quantity} x R{item.price?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                          <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            R{((item.quantity || 0) * (item.price || 0)).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-4">
                    {selectedOrder.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleAction(selectedOrder.id, 'reject')}
                          disabled={actionLoading}
                          className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleAction(selectedOrder.id, 'accept')}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          Accept Order
                        </button>
                      </>
                    )}
                    {selectedOrder.status === 'ACCEPTED' && (
                      <button
                        onClick={() => handleAction(selectedOrder.id, 'dispatch')}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-industrial text-white rounded-lg hover:bg-industrial/90 disabled:opacity-50"
                      >
                        Mark as Dispatched
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SupplierLayout>
  )
}
