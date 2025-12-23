import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useCustomerAuth } from '@/context/CustomerAuthContext'
import { useTheme } from '@/context/ThemeContext'

const API_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' ? 'http://localhost:3016/api/v1' : `${window.location.origin}/api/v1`
)

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  AWAITING_PAYMENT: 'bg-orange-100 text-orange-800',
  PAYMENT_RECEIVED: 'bg-teal-100 text-teal-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  READY_FOR_DISPATCH: 'bg-indigo-100 text-indigo-800',
  DISPATCHED: 'bg-cyan-100 text-cyan-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  ON_HOLD: 'bg-gray-100 text-gray-800',
}

const statusProgress = ['PENDING', 'CONFIRMED', 'AWAITING_PAYMENT', 'PAYMENT_RECEIVED', 'PROCESSING', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED']

export default function Orders() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = useCustomerAuth()
  const { darkMode } = useTheme()

  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    if (id) {
      fetchOrderDetail(id)
    } else {
      fetchOrders()
    }
  }, [id, pagination.page, statusFilter])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(statusFilter && { status: statusFilter })
      })
      const res = await fetch(`${API_URL}/portal/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders)
        setPagination(data.pagination)
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchOrderDetail = async (orderId) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/portal/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setSelectedOrder(data)
      }
    } catch (err) {
      console.error('Failed to fetch order:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIndex = (status) => statusProgress.indexOf(status)

  // Order Detail View
  if (id && selectedOrder) {
    const currentStatusIndex = getStatusIndex(selectedOrder.status)

    return (
      <div className="space-y-6">
        {/* Back button */}
        <button
          onClick={() => navigate('/portal/orders')}
          className={`flex items-center ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Orders
        </button>

        {/* Order Header */}
        <div className={`rounded-xl shadow-sm p-4 sm:p-6 ${darkMode ? 'bg-navy' : 'bg-white'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className={`text-xl sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedOrder.orderNumber}</h1>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Placed on {new Date(selectedOrder.createdAt).toLocaleDateString()}
              </p>
            </div>
            <span className={`self-start px-3 py-1.5 rounded-full text-sm font-medium ${statusColors[selectedOrder.status]}`}>
              {selectedOrder.status.replace(/_/g, ' ')}
            </span>
          </div>

          {/* Progress Tracker */}
          {selectedOrder.status !== 'CANCELLED' && (
            <div className="mt-6 overflow-x-auto">
              <div className="flex items-center min-w-max">
                {statusProgress.slice(0, 5).map((status, index) => {
                  const isCompleted = index <= currentStatusIndex
                  const isCurrent = status === selectedOrder.status
                  return (
                    <div key={status} className="flex items-center">
                      <div className={`flex flex-col items-center ${index === 0 ? '' : 'ml-4'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                        } ${isCurrent ? 'ring-2 ring-green-500 ring-offset-2' : ''}`}>
                          {isCompleted ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <span className="text-xs">{index + 1}</span>
                          )}
                        </div>
                        <span className="text-xs mt-1 text-gray-600 whitespace-nowrap">{status.replace(/_/g, ' ')}</span>
                      </div>
                      {index < 4 && (
                        <div className={`w-12 h-0.5 ${index < currentStatusIndex ? 'bg-green-500' : 'bg-gray-200'}`} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className={`rounded-xl shadow-sm ${darkMode ? 'bg-navy' : 'bg-white'}`}>
          <div className={`p-4 sm:p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Order Items</h2>
          </div>
          <div className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
            {selectedOrder.items?.map((item) => (
              <div key={item.id} className="p-4 sm:p-6 flex items-start gap-4">
                <div className={`w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  {item.product?.images?.[0] ? (
                    <img src={item.product.images[0]} alt="" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.description}</h3>
                  {item.sku && <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>SKU: {item.sku}</p>}
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Qty: {item.quantity} x R{Number(item.unitPrice).toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>R{Number(item.total).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Order Summary */}
          <div className={`p-4 sm:p-6 border-t rounded-b-xl ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50'}`}>
            <div className="max-w-xs ml-auto space-y-2">
              <div className="flex justify-between text-sm">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Subtotal</span>
                <span className={darkMode ? 'text-white' : 'text-gray-900'}>R{Number(selectedOrder.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>VAT (15%)</span>
                <span className={darkMode ? 'text-white' : 'text-gray-900'}>R{Number(selectedOrder.vatAmount).toFixed(2)}</span>
              </div>
              {Number(selectedOrder.deliveryFee) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Delivery</span>
                  <span className={darkMode ? 'text-white' : 'text-gray-900'}>R{Number(selectedOrder.deliveryFee).toFixed(2)}</span>
                </div>
              )}
              {Number(selectedOrder.discount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Discount</span>
                  <span className="text-green-600">-R{Number(selectedOrder.discount).toFixed(2)}</span>
                </div>
              )}
              <div className={`flex justify-between font-semibold text-lg pt-2 border-t ${darkMode ? 'border-gray-700 text-white' : 'border-gray-200'}`}>
                <span>Total</span>
                <span>R{Number(selectedOrder.total).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Info */}
        <div className={`rounded-xl shadow-sm p-4 sm:p-6 ${darkMode ? 'bg-navy' : 'bg-white'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Delivery Information</h2>
          <div className="space-y-2 text-sm">
            <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{selectedOrder.deliveryAddress}</p>
            <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{selectedOrder.deliveryCity}{selectedOrder.deliveryProvince && `, ${selectedOrder.deliveryProvince}`}</p>
            {selectedOrder.deliveryPostalCode && <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{selectedOrder.deliveryPostalCode}</p>}
            {selectedOrder.deliveryNotes && (
              <p className={`italic mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Note: {selectedOrder.deliveryNotes}</p>
            )}
          </div>
        </div>

        {/* Payment Info */}
        <div className={`rounded-xl shadow-sm p-4 sm:p-6 ${darkMode ? 'bg-navy' : 'bg-white'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Payment</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Payment Method</p>
              <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedOrder.paymentMethod}</p>
            </div>
            <div className="text-right">
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</p>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                selectedOrder.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                selectedOrder.paymentStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {selectedOrder.paymentStatus}
              </span>
            </div>
          </div>
          {selectedOrder.popFile && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">
                <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Proof of payment uploaded: {selectedOrder.popFileName}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Orders List View
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className={`text-xl sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>My Orders</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`px-3 py-2 border rounded-lg text-sm ${darkMode ? 'border-gray-700 bg-navy text-white' : 'border-gray-300 bg-white'}`}
        >
          <option value="">All Status</option>
          {Object.keys(statusColors).map(status => (
            <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-safety"></div>
        </div>
      ) : orders.length > 0 ? (
        <>
          <div className={`rounded-xl shadow-sm divide-y ${darkMode ? 'bg-navy divide-gray-700' : 'bg-white divide-gray-100'}`}>
            {orders.map((order) => (
              <Link
                key={order.id}
                to={`/portal/orders/${order.id}`}
                className={`block p-4 sm:p-6 transition-colors ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{order.orderNumber}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(order.createdAt).toLocaleDateString()} | {order.items?.length || 0} items
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>R{Number(order.total).toFixed(2)}</p>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page <= 1}
                className={`px-3 py-2 border rounded-lg disabled:opacity-50 ${darkMode ? 'border-gray-700 text-gray-300' : 'border-gray-300'}`}
              >
                Previous
              </button>
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page >= pagination.pages}
                className={`px-3 py-2 border rounded-lg disabled:opacity-50 ${darkMode ? 'border-gray-700 text-gray-300' : 'border-gray-300'}`}
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className={`rounded-xl shadow-sm p-12 text-center ${darkMode ? 'bg-navy' : 'bg-white'}`}>
          <svg className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className={`text-lg font-medium mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>No orders yet</h3>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Your orders will appear here once you place them.</p>
        </div>
      )}
    </div>
  )
}
