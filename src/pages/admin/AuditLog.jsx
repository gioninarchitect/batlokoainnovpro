import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3016/api/v1'

const actionIcons = {
  ORDER_CREATED: { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', color: 'bg-blue-100 text-blue-600' },
  ORDER_STATUS_CHANGED: { icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', color: 'bg-yellow-100 text-yellow-600' },
  ORDER_DISPATCHED: { icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4', color: 'bg-green-100 text-green-600' },
  POP_APPROVED: { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'bg-green-100 text-green-600' },
  POP_REJECTED: { icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'bg-red-100 text-red-600' },
  PRODUCT_CREATED: { icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', color: 'bg-purple-100 text-purple-600' },
  PRODUCT_UPDATED: { icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', color: 'bg-purple-100 text-purple-600' },
  CUSTOMER_CREATED: { icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z', color: 'bg-teal-100 text-teal-600' },
  INVOICE_SENT: { icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', color: 'bg-indigo-100 text-indigo-600' },
  PAYMENT_RECORDED: { icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z', color: 'bg-green-100 text-green-600' },
  USER_LOGIN: { icon: 'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1', color: 'bg-gray-100 text-gray-600' },
}

const defaultIcon = { icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'bg-gray-100 text-gray-600' }

export default function AuditLog() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [filters, setFilters] = useState({
    entityType: searchParams.get('entityType') || '',
    action: searchParams.get('action') || '',
    search: searchParams.get('search') || '',
  })

  useEffect(() => {
    fetchLogs()
  }, [searchParams])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const params = new URLSearchParams(searchParams)
      const res = await fetch(`${API_URL}/audit?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs)
        setPagination({ page: data.page, pages: data.pages, total: data.total })
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)

    const params = new URLSearchParams()
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    setSearchParams(params)
  }

  const formatDate = (date) => {
    const d = new Date(date)
    return d.toLocaleString('en-ZA', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const getActionDisplay = (type) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Log</h1>
          <p className="text-gray-500 dark:text-gray-400">Track all system activity and changes</p>
        </div>
        <div className="text-sm text-gray-500">
          {pagination.total} total entries
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-navy rounded-xl shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Entity Type</label>
            <select
              value={filters.entityType}
              onChange={(e) => handleFilterChange('entityType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-navy-light rounded-lg bg-white dark:bg-navy-light text-gray-900 dark:text-white focus:ring-2 focus:ring-safety"
            >
              <option value="">All Types</option>
              <option value="order">Orders</option>
              <option value="product">Products</option>
              <option value="customer">Customers</option>
              <option value="invoice">Invoices</option>
              <option value="quote">Quotes</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Action</label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-navy-light rounded-lg bg-white dark:bg-navy-light text-gray-900 dark:text-white focus:ring-2 focus:ring-safety"
            >
              <option value="">All Actions</option>
              <option value="ORDER_CREATED">Order Created</option>
              <option value="ORDER_STATUS_CHANGED">Status Changed</option>
              <option value="ORDER_DISPATCHED">Order Dispatched</option>
              <option value="POP_APPROVED">Payment Approved</option>
              <option value="POP_REJECTED">Payment Rejected</option>
              <option value="PRODUCT_CREATED">Product Created</option>
              <option value="PRODUCT_UPDATED">Product Updated</option>
              <option value="INVOICE_SENT">Invoice Sent</option>
              <option value="PAYMENT_RECORDED">Payment Recorded</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search descriptions..."
              className="w-full px-3 py-2 border border-gray-200 dark:border-navy-light rounded-lg bg-white dark:bg-navy-light text-gray-900 dark:text-white focus:ring-2 focus:ring-safety"
            />
          </div>
        </div>
      </div>

      {/* Audit Log List */}
      <div className="bg-white dark:bg-navy rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-safety border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-gray-500">Loading audit log...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No audit log entries found
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-navy-light">
            {logs.map((log) => {
              const iconData = actionIcons[log.type] || defaultIcon
              return (
                <div key={log.id} className="p-4 hover:bg-gray-50 dark:hover:bg-navy-light transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconData.color}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconData.icon} />
                      </svg>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-navy-light text-gray-600 dark:text-gray-400">
                          {getActionDisplay(log.type)}
                        </span>
                        {log.entityType && (
                          <span className="text-xs text-gray-400">
                            {log.entityType}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {log.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>
                          {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}
                        </span>
                        <span>{formatDate(log.createdAt)}</span>
                        {log.metadata?.ipAddress && (
                          <span>IP: {log.metadata.ipAddress}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="border-t border-gray-100 dark:border-navy-light p-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.pages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const params = new URLSearchParams(searchParams)
                  params.set('page', String(pagination.page - 1))
                  setSearchParams(params)
                }}
                disabled={pagination.page <= 1}
                className="px-3 py-1 text-sm border border-gray-200 dark:border-navy-light rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-navy-light"
              >
                Previous
              </button>
              <button
                onClick={() => {
                  const params = new URLSearchParams(searchParams)
                  params.set('page', String(pagination.page + 1))
                  setSearchParams(params)
                }}
                disabled={pagination.page >= pagination.pages}
                className="px-3 py-1 text-sm border border-gray-200 dark:border-navy-light rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-navy-light"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
