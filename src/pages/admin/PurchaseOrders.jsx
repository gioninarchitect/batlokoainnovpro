import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' ? 'http://localhost:3016/api/v1' : `${window.location.origin}/api/v1`
)

const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
  SENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  CONFIRMED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  PARTIAL: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  RECEIVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

export default function PurchaseOrders() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 })

  useEffect(() => {
    fetchPurchaseOrders()
  }, [pagination.page, statusFilter])

  const fetchPurchaseOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      })
      const res = await fetch(`${API_URL}/purchase-orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setPurchaseOrders(data.purchaseOrders)
        setPagination(data.pagination)
      }
    } catch (err) {
      console.error('Failed to fetch purchase orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPagination((p) => ({ ...p, page: 1 }))
    fetchPurchaseOrders()
  }

  const handleStatusChange = async (poId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/purchase-orders/${poId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        fetchPurchaseOrders()
      }
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Purchase Orders</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage purchase orders from suppliers</p>
        </div>
        <Link
          to="/admin/purchase-orders/new"
          className="inline-flex items-center px-4 py-2 bg-safety text-white rounded-lg hover:bg-safety/90 text-sm font-medium"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Purchase Order
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-navy rounded-xl shadow-sm p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search PO number or supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-navy-light rounded-lg bg-white dark:bg-navy-light text-gray-900 dark:text-white text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-navy-light rounded-lg bg-white dark:bg-navy-light text-gray-900 dark:text-white text-sm"
          >
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PARTIAL">Partial</option>
            <option value="RECEIVED">Received</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-industrial text-white rounded-lg hover:bg-industrial/90 text-sm"
          >
            Search
          </button>
        </form>
      </div>

      {/* Purchase Orders List */}
      <div className="bg-white dark:bg-navy rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-safety"></div>
          </div>
        ) : purchaseOrders.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-navy-light">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">PO Number</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Supplier</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Items</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Expected</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-navy-light">
                  {purchaseOrders.map((po) => (
                    <tr key={po.id} className="hover:bg-gray-50 dark:hover:bg-navy-light">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{po.poNumber}</p>
                          <p className="text-sm text-gray-500">{formatDate(po.orderDate)}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm">
                          <p className="text-gray-900 dark:text-white">{po.supplier?.name}</p>
                          <p className="text-gray-500">{po.supplier?.code}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-900 dark:text-white">{po.items?.length || 0} items</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-medium text-gray-900 dark:text-white">R{Number(po.total).toFixed(2)}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-500">{formatDate(po.expectedDate)}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[po.status]}`}>
                          {po.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/purchase-orders/${po.id}`}
                            className="p-2 text-gray-400 hover:text-industrial"
                            title="View/Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          {po.status === 'DRAFT' && (
                            <button
                              onClick={() => handleStatusChange(po.id, 'SENT')}
                              className="p-2 text-gray-400 hover:text-blue-500"
                              title="Mark as Sent"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                            </button>
                          )}
                          {['SENT', 'CONFIRMED', 'PARTIAL'].includes(po.status) && (
                            <Link
                              to={`/admin/purchase-orders/${po.id}/receive`}
                              className="p-2 text-gray-400 hover:text-green-500"
                              title="Receive Stock"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                              </svg>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-200 dark:divide-navy-light">
              {purchaseOrders.map((po) => (
                <Link
                  key={po.id}
                  to={`/admin/purchase-orders/${po.id}`}
                  className="block p-4 hover:bg-gray-50 dark:hover:bg-navy-light"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{po.poNumber}</p>
                      <p className="text-sm text-gray-500">{po.supplier?.name}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[po.status]}`}>
                      {po.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{formatDate(po.orderDate)}</span>
                    <span className="font-medium text-gray-900 dark:text-white">R{Number(po.total).toFixed(2)}</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-navy-light flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                    disabled={pagination.page <= 1}
                    className="px-3 py-1 border border-gray-300 dark:border-navy-light rounded text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                    disabled={pagination.page >= pagination.pages}
                    className="px-3 py-1 border border-gray-300 dark:border-navy-light rounded text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No purchase orders found</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first purchase order.</p>
            <Link
              to="/admin/purchase-orders/new"
              className="inline-flex items-center px-4 py-2 bg-safety text-white rounded-lg hover:bg-safety/90"
            >
              New Purchase Order
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
