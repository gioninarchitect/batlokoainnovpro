import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useCustomerAuth } from '@/context/CustomerAuthContext'

const API_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' ? 'http://localhost:3016/api/v1' : `${window.location.origin}/api/v1`
)

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  SENT: 'bg-blue-100 text-blue-800',
  VIEWED: 'bg-purple-100 text-purple-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-gray-100 text-gray-800',
  CONVERTED: 'bg-teal-100 text-teal-800',
}

export default function Quotes() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = useCustomerAuth()

  const [quotes, setQuotes] = useState([])
  const [selectedQuote, setSelectedQuote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })
  const [statusFilter, setStatusFilter] = useState('')
  const [rejectModal, setRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    if (id) {
      fetchQuoteDetail(id)
    } else {
      fetchQuotes()
    }
  }, [id, pagination.page, statusFilter])

  const fetchQuotes = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(statusFilter && { status: statusFilter })
      })
      const res = await fetch(`${API_URL}/portal/quotes?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setQuotes(data.quotes)
        setPagination(data.pagination)
      }
    } catch (err) {
      console.error('Failed to fetch quotes:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchQuoteDetail = async (quoteId) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/portal/quotes/${quoteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setSelectedQuote(data)
      }
    } catch (err) {
      console.error('Failed to fetch quote:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptQuote = async () => {
    if (!confirm('Are you sure you want to accept this quote? This will create an order.')) return
    setActionLoading(true)
    try {
      const res = await fetch(`${API_URL}/portal/quotes/${selectedQuote.id}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        alert(`Quote accepted! Order ${data.order.orderNumber} has been created.`)
        navigate(`/portal/orders/${data.order.id}`)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to accept quote')
      }
    } catch (err) {
      alert('Failed to accept quote')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRejectQuote = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`${API_URL}/portal/quotes/${selectedQuote.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: rejectReason })
      })
      if (res.ok) {
        setRejectModal(false)
        setRejectReason('')
        fetchQuoteDetail(selectedQuote.id)
        alert('Quote rejected')
      }
    } catch (err) {
      alert('Failed to reject quote')
    } finally {
      setActionLoading(false)
    }
  }

  const isExpired = (validUntil) => new Date() > new Date(validUntil)
  const canTakeAction = (quote) => ['PENDING', 'SENT', 'VIEWED'].includes(quote.status) && !isExpired(quote.validUntil)

  // Quote Detail View
  if (id && selectedQuote) {
    return (
      <div className="space-y-6">
        {/* Back button */}
        <button
          onClick={() => navigate('/portal/quotes')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Quotes
        </button>

        {/* Quote Header */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{selectedQuote.quoteNumber}</h1>
              <p className="text-sm text-gray-500 mt-1">
                Created on {new Date(selectedQuote.createdAt).toLocaleDateString()}
              </p>
            </div>
            <span className={`self-start px-3 py-1.5 rounded-full text-sm font-medium ${statusColors[selectedQuote.status]}`}>
              {selectedQuote.status}
            </span>
          </div>

          {/* Validity Warning */}
          {isExpired(selectedQuote.validUntil) && selectedQuote.status !== 'EXPIRED' ? (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                This quote has expired. Please request a new quote.
              </p>
            </div>
          ) : canTakeAction(selectedQuote) && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                Valid until: {new Date(selectedQuote.validUntil).toLocaleDateString()}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          {canTakeAction(selectedQuote) && (
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAcceptQuote}
                disabled={actionLoading}
                className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Accept Quote & Create Order'}
              </button>
              <button
                onClick={() => setRejectModal(true)}
                disabled={actionLoading}
                className="flex-1 py-3 px-4 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 disabled:opacity-50"
              >
                Reject Quote
              </button>
            </div>
          )}

          {selectedQuote.status === 'CONVERTED' && selectedQuote.orderId && (
            <div className="mt-4">
              <Link
                to={`/portal/orders/${selectedQuote.orderId}`}
                className="inline-flex items-center px-4 py-2 bg-industrial text-white rounded-lg hover:bg-industrial/90"
              >
                View Order
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}
        </div>

        {/* Quote Items */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Quote Items</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {selectedQuote.items?.map((item) => (
              <div key={item.id} className="p-4 sm:p-6 flex items-start gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {item.product?.images?.[0] ? (
                    <img src={item.product.images[0]} alt="" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900">{item.description}</h3>
                  <p className="text-sm text-gray-500">Qty: {item.quantity} x R{Number(item.unitPrice).toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">R{Number(item.total).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Quote Summary */}
          <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl">
            <div className="max-w-xs ml-auto space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">R{Number(selectedQuote.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">VAT (15%)</span>
                <span className="text-gray-900">R{Number(selectedQuote.vatAmount).toFixed(2)}</span>
              </div>
              {Number(selectedQuote.discount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Discount</span>
                  <span className="text-green-600">-R{Number(selectedQuote.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>R{Number(selectedQuote.total).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reject Modal */}
        {rejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Quote</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please let us know why you're rejecting this quote (optional):
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
                placeholder="Reason for rejection..."
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setRejectModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectQuote}
                  disabled={actionLoading}
                  className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg disabled:opacity-50"
                >
                  {actionLoading ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Quotes List View
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Quotes</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
        >
          <option value="">All Status</option>
          {Object.keys(statusColors).map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-safety"></div>
        </div>
      ) : quotes.length > 0 ? (
        <>
          <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
            {quotes.map((quote) => (
              <Link
                key={quote.id}
                to={`/portal/quotes/${quote.id}`}
                className="block p-4 sm:p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{quote.quoteNumber}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[quote.status]}`}>
                        {quote.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(quote.createdAt).toLocaleDateString()} | Valid until: {new Date(quote.validUntil).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <p className="font-semibold text-gray-900">R{Number(quote.total).toFixed(2)}</p>
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
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page >= pagination.pages}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No quotes yet</h3>
          <p className="text-gray-500">Your quotes will appear here when you request them.</p>
        </div>
      )}
    </div>
  )
}
