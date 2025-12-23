import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import ConfirmModal, { AlertModal } from '@/components/ui/ConfirmModal'

const API_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' ? 'http://localhost:3016/api/v1' : `${window.location.origin}/api/v1`
)

const statusOptions = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED']

export default function Quotes() {
  const { token } = useAuth()
  const [quotes, setQuotes] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [confirmModal, setConfirmModal] = useState({ open: false, quoteId: null })
  const [alertModal, setAlertModal] = useState({ open: false, title: '', message: '', variant: 'info' })

  useEffect(() => {
    fetchQuotes()
  }, [pagination.page, statusFilter])

  const fetchQuotes = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })
      if (statusFilter) params.append('status', statusFilter)

      const res = await fetch(`${API_URL}/quotes?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setQuotes(data.quotes || [])
      setPagination(prev => ({ ...prev, total: data.pagination?.total || 0 }))
    } catch (error) {
      console.error('Failed to fetch quotes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendQuote = async (quoteId) => {
    try {
      await fetch(`${API_URL}/quotes/${quoteId}/send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchQuotes()
    } catch (error) {
      console.error('Failed to send quote:', error)
    }
  }

  const handleConvertToOrder = (quoteId) => {
    setConfirmModal({ open: true, quoteId })
  }

  const doConvertToOrder = async () => {
    try {
      const res = await fetch(`${API_URL}/quotes/${confirmModal.quoteId}/convert`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      setConfirmModal({ open: false, quoteId: null })
      if (res.ok) {
        setAlertModal({ open: true, title: 'Order Created', message: 'The quote has been converted to an order.', variant: 'success' })
        fetchQuotes()
      } else {
        const error = await res.json()
        setAlertModal({ open: true, title: 'Error', message: error.error || 'Failed to convert quote.', variant: 'danger' })
      }
    } catch (error) {
      console.error('Failed to convert quote:', error)
      setConfirmModal({ open: false, quoteId: null })
      setAlertModal({ open: true, title: 'Error', message: 'Failed to convert quote to order.', variant: 'danger' })
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
      year: 'numeric'
    })
  }

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      SENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      ACCEPTED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      EXPIRED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      CONVERTED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const totalPages = Math.ceil(pagination.total / pagination.limit)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Quotes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{pagination.total} quotes</p>
        </div>
        <Link
          to="/admin/quotes/new"
          className="inline-flex items-center justify-center px-4 py-2 bg-safety text-white rounded-lg hover:bg-safety-dark transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Quote
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy text-gray-900 dark:text-white focus:ring-2 focus:ring-safety focus:border-transparent"
        >
          <option value="">All Statuses</option>
          {statusOptions.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {/* Quotes List */}
      <div className="bg-white dark:bg-navy rounded-xl shadow-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-safety"></div>
          </div>
        ) : quotes.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No quotes found
          </div>
        ) : (
          <>
            {/* Mobile View */}
            <div className="sm:hidden divide-y divide-gray-200 dark:divide-navy-light">
              {quotes.map((quote) => (
                <div key={quote.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Link to={`/admin/quotes/${quote.id}`} className="font-medium text-industrial dark:text-industrial-light">
                      #{quote.quoteNumber}
                    </Link>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(quote.status)}`}>
                      {quote.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {quote.customer?.firstName} {quote.customer?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{quote.customer?.company || '-'}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(quote.total)}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Valid until: {formatDate(quote.validUntil)}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {quote.status === 'DRAFT' && (
                      <button
                        onClick={() => handleSendQuote(quote.id)}
                        className="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        Send
                      </button>
                    )}
                    {(quote.status === 'PENDING' || quote.status === 'ACCEPTED') && (
                      <button
                        onClick={() => handleConvertToOrder(quote.id)}
                        className="flex-1 px-3 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600"
                      >
                        Approve & Convert
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-navy-light">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Quote</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Valid Until</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-navy-light">
                  {quotes.map((quote) => (
                    <tr key={quote.id} className="hover:bg-gray-50 dark:hover:bg-navy-light">
                      <td className="px-4 py-4">
                        <Link to={`/admin/quotes/${quote.id}`} className="text-sm font-medium text-industrial dark:text-industrial-light hover:underline">
                          #{quote.quoteNumber}
                        </Link>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(quote.createdAt)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {quote.customer?.firstName} {quote.customer?.lastName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{quote.customer?.company || '-'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(quote.status)}`}>
                          {quote.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(quote.validUntil)}
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(quote.total)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {quote.status === 'DRAFT' && (
                            <button
                              onClick={() => handleSendQuote(quote.id)}
                              className="text-sm text-blue-600 hover:text-blue-700"
                            >
                              Send
                            </button>
                          )}
                          {(quote.status === 'PENDING' || quote.status === 'ACCEPTED') && (
                            <button
                              onClick={() => handleConvertToOrder(quote.id)}
                              className="text-sm text-green-600 hover:text-green-700"
                            >
                              Approve
                            </button>
                          )}
                          <Link
                            to={`/admin/quotes/${quote.id}`}
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

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, quoteId: null })}
        onConfirm={doConvertToOrder}
        title="Approve Quote"
        message="Convert this quote to an order? This will create a new order from this quote."
        confirmText="Approve"
        variant="success"
      />

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.open}
        onClose={() => setAlertModal({ open: false, title: '', message: '', variant: 'info' })}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
      />
    </div>
  )
}
