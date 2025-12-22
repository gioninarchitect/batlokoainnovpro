import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' ? 'http://localhost:3016/api/v1' : `${window.location.origin}/api/v1`
)

const statusOptions = [
  'PENDING', 'CONFIRMED', 'AWAITING_PAYMENT', 'PAYMENT_RECEIVED',
  'PROCESSING', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED', 'CANCELLED', 'ON_HOLD'
]

export default function Orders() {
  const { token } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchOrders()
  }, [pagination.page, statusFilter])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })
      if (statusFilter) params.append('status', statusFilter)
      if (search) params.append('search', search)

      const res = await fetch(`${API_URL}/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setOrders(data.orders || [])
      setPagination(prev => ({ ...prev, total: data.pagination?.total || 0 }))
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })
      fetchOrders()
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount || 0)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      CONFIRMED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      AWAITING_PAYMENT: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      PAYMENT_RECEIVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      PROCESSING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      READY_FOR_DISPATCH: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
      DISPATCHED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      DELIVERED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      ON_HOLD: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  // POP Actions
  const approvePOP = async (orderId) => {
    if (!confirm('Approve this payment?')) return
    try {
      await fetch(`${API_URL}/orders/${orderId}/pop/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
      fetchOrders()
    } catch (error) {
      console.error('Failed to approve POP:', error)
    }
  }

  const rejectPOP = async (orderId) => {
    const reason = prompt('Enter rejection reason:')
    if (!reason) return
    try {
      await fetch(`${API_URL}/orders/${orderId}/pop/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      })
      fetchOrders()
    } catch (error) {
      console.error('Failed to reject POP:', error)
    }
  }

  const generateInvoice = async (orderId) => {
    if (!confirm('Generate invoice for this order?')) return
    try {
      const res = await fetch(`${API_URL}/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ orderId })
      })
      if (res.ok) {
        const invoice = await res.json()
        alert(`Invoice ${invoice.invoiceNumber} created!`)
        fetchOrders()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to generate invoice')
      }
    } catch (error) {
      console.error('Failed to generate invoice:', error)
      alert('Failed to generate invoice')
    }
  }

  const totalPages = Math.ceil(pagination.total / pagination.limit)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{pagination.total} total orders</p>
        </div>
        <Link
          to="/admin/orders/new"
          className="inline-flex items-center justify-center px-4 py-2 bg-safety text-white rounded-lg hover:bg-safety-dark transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Order
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-safety focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setSearchParams(e.target.value ? { status: e.target.value } : {})
          }}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy text-gray-900 dark:text-white focus:ring-2 focus:ring-safety focus:border-transparent"
        >
          <option value="">All Statuses</option>
          {statusOptions.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-navy rounded-xl shadow-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-safety"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No orders found
          </div>
        ) : (
          <>
            {/* Mobile View */}
            <div className="sm:hidden divide-y divide-gray-200 dark:divide-navy-light">
              {orders.map((order) => (
                <div key={order.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Link to={`/admin/orders/${order.id}`} className="font-medium text-industrial dark:text-industrial-light">
                      #{order.orderNumber}
                    </Link>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {order.customer?.firstName} {order.customer?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{order.customer?.company || '-'}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(order.total)}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="mt-3">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white"
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-navy-light">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Order</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Payment</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-navy-light">
                  {orders.map((order) => (
                    <tr key={order.id} className={`hover:bg-gray-50 dark:hover:bg-navy-light ${order.popFile && !order.popVerified ? 'bg-orange-50 dark:bg-orange-900/10' : ''}`}>
                      <td className="px-4 py-4">
                        <Link to={`/admin/orders/${order.id}`} className="text-sm font-medium text-industrial dark:text-industrial-light hover:underline">
                          #{order.orderNumber}
                        </Link>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {order.customer?.firstName} {order.customer?.lastName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{order.customer?.company || '-'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className={`px-2 py-1 text-xs font-medium rounded-full border-0 ${getStatusColor(order.status)} cursor-pointer`}
                        >
                          {statusOptions.map(status => (
                            <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        {order.popFile ? (
                          <div className="flex items-center gap-2">
                            {order.popVerified ? (
                              <span className="text-xs text-green-600 dark:text-green-400 font-medium">Verified</span>
                            ) : (
                              <>
                                <a href={`${API_URL.replace('/api/v1', '')}${order.popFile}`} target="_blank" rel="noopener noreferrer"
                                   className="text-xs text-blue-600 hover:underline">View POP</a>
                                <button onClick={() => approvePOP(order.id)} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">Approve</button>
                                <button onClick={() => rejectPOP(order.id)} className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">Reject</button>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">{order.paymentMethod || 'EFT'} - {order.paymentStatus || 'UNPAID'}</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(order.total)}</p>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => generateInvoice(order.id)}
                            className="text-sm text-purple-600 hover:text-purple-700"
                            title="Generate Invoice"
                          >
                            Invoice
                          </button>
                          <Link
                            to={`/admin/orders/${order.id}`}
                            className="text-sm text-safety hover:text-safety-dark"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-navy-light flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Page {pagination.page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 text-sm rounded-lg border border-gray-300 dark:border-navy-light disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-navy-light"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === totalPages}
                    className="px-3 py-1 text-sm rounded-lg border border-gray-300 dark:border-navy-light disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-navy-light"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
