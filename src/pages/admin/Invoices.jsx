import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' ? 'http://localhost:3016/api/v1' : `${window.location.origin}/api/v1`
)

const statusOptions = ['DRAFT', 'SENT', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED']

export default function Invoices() {
  const { token } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentModal, setPaymentModal] = useState(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER')
  const [paymentReference, setPaymentReference] = useState('')

  useEffect(() => {
    fetchInvoices()
  }, [pagination.page, statusFilter])

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })
      if (statusFilter) params.append('status', statusFilter)

      const res = await fetch(`${API_URL}/invoices?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setInvoices(data.invoices || [])
      setPagination(prev => ({ ...prev, total: data.pagination?.total || 0 }))
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendInvoice = async (invoiceId) => {
    try {
      await fetch(`${API_URL}/invoices/${invoiceId}/send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchInvoices()
    } catch (error) {
      console.error('Failed to send invoice:', error)
    }
  }

  const handleRecordPayment = async (e) => {
    e.preventDefault()
    if (!paymentModal) return
    try {
      await fetch(`${API_URL}/invoices/${paymentModal.id}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(paymentAmount),
          method: paymentMethod,
          reference: paymentReference
        })
      })
      setPaymentModal(null)
      setPaymentAmount('')
      setPaymentMethod('BANK_TRANSFER')
      setPaymentReference('')
      fetchInvoices()
    } catch (error) {
      console.error('Failed to record payment:', error)
    }
  }

  const handleDownloadPDF = async (invoiceId, invoiceNumber) => {
    try {
      const res = await fetch(`${API_URL}/invoices/${invoiceId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${invoiceNumber}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download PDF:', error)
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
      PAID: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      PARTIALLY_PAID: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      OVERDUE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const totalPages = Math.ceil(pagination.total / pagination.limit)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Invoices</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{pagination.total} invoices</p>
        </div>
        <Link
          to="/admin/invoices/new"
          className="inline-flex items-center justify-center px-4 py-2 bg-safety text-white rounded-lg hover:bg-safety-dark transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Invoice
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy text-gray-900 dark:text-white focus:ring-2 focus:ring-safety focus:border-transparent"
        >
          <option value="">All Statuses</option>
          {statusOptions.map(status => (
            <option key={status} value={status}>{status.replace('_', ' ')}</option>
          ))}
        </select>
        <Link
          to="/admin/invoices/overdue"
          className="px-4 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          View Overdue
        </Link>
      </div>

      {/* Invoices List */}
      <div className="bg-white dark:bg-navy rounded-xl shadow-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-safety"></div>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No invoices found
          </div>
        ) : (
          <>
            {/* Mobile View */}
            <div className="sm:hidden divide-y divide-gray-200 dark:divide-navy-light">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Link to={`/admin/invoices/${invoice.id}`} className="font-medium text-industrial dark:text-industrial-light">
                      {invoice.invoiceNumber}
                    </Link>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                      {invoice.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {invoice.customer?.firstName} {invoice.customer?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{invoice.customer?.company || '-'}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(invoice.total)}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Due: {formatDate(invoice.dueDate)}</span>
                  </div>
                  {invoice.amountDue > 0 && (
                    <p className="text-sm text-red-500 mt-1">Due: {formatCurrency(invoice.amountDue)}</p>
                  )}
                  <div className="mt-3 flex gap-2">
                    {invoice.status === 'DRAFT' && (
                      <button
                        onClick={() => handleSendInvoice(invoice.id)}
                        className="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg"
                      >
                        Send
                      </button>
                    )}
                    {['SENT', 'PARTIALLY_PAID', 'OVERDUE'].includes(invoice.status) && (
                      <button
                        onClick={() => { setPaymentModal(invoice); setPaymentAmount(invoice.amountDue?.toString() || ''); }}
                        className="flex-1 px-3 py-2 text-sm bg-green-500 text-white rounded-lg"
                      >
                        Record Payment
                      </button>
                    )}
                    <button
                      onClick={() => handleDownloadPDF(invoice.id, invoice.invoiceNumber)}
                      className="px-3 py-2 text-sm border border-gray-300 dark:border-navy-light rounded-lg"
                    >
                      PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-navy-light">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Invoice</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Due Date</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Balance</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-navy-light">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-navy-light">
                      <td className="px-4 py-4">
                        <Link to={`/admin/invoices/${invoice.id}`} className="text-sm font-medium text-industrial dark:text-industrial-light hover:underline">
                          {invoice.invoiceNumber}
                        </Link>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(invoice.issueDate)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {invoice.customer?.firstName} {invoice.customer?.lastName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{invoice.customer?.company || '-'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                          {invoice.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(invoice.dueDate)}
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(invoice.total)}
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-medium">
                        <span className={invoice.amountDue > 0 ? 'text-red-500' : 'text-green-500'}>
                          {formatCurrency(invoice.amountDue)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {invoice.status === 'DRAFT' && (
                            <button
                              onClick={() => handleSendInvoice(invoice.id)}
                              className="text-sm text-blue-600 hover:text-blue-700"
                            >
                              Send
                            </button>
                          )}
                          {['SENT', 'PARTIALLY_PAID', 'OVERDUE'].includes(invoice.status) && (
                            <button
                              onClick={() => { setPaymentModal(invoice); setPaymentAmount(invoice.amountDue?.toString() || ''); }}
                              className="text-sm text-green-600 hover:text-green-700"
                            >
                              Payment
                            </button>
                          )}
                          <button
                            onClick={() => handleDownloadPDF(invoice.id, invoice.invoiceNumber)}
                            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800"
                          >
                            PDF
                          </button>
                          <Link
                            to={`/admin/invoices/${invoice.id}`}
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

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-navy rounded-xl shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-gray-200 dark:border-navy-light flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Record Payment</h2>
              <button
                onClick={() => setPaymentModal(null)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleRecordPayment} className="p-4 space-y-4">
              <div className="bg-gray-50 dark:bg-navy-light rounded-lg p-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">Invoice</p>
                <p className="font-medium text-gray-900 dark:text-white">{paymentModal.invoiceNumber}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Outstanding: {formatCurrency(paymentModal.amountDue)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white"
                >
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="EFT">EFT</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reference</label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Payment reference or note"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-navy-light text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-light"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
