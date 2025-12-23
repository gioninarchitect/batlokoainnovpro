import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useCustomerAuth } from '@/context/CustomerAuthContext'

const API_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' ? 'http://localhost:3016/api/v1' : `${window.location.origin}/api/v1`
)

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  PARTIAL: 'bg-yellow-100 text-yellow-800',
  OVERDUE: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
}

export default function Invoices() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = useCustomerAuth()

  const [invoices, setInvoices] = useState([])
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    if (id) {
      fetchInvoiceDetail(id)
    } else {
      fetchInvoices()
    }
  }, [id, pagination.page, statusFilter])

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(statusFilter && { status: statusFilter })
      })
      const res = await fetch(`${API_URL}/portal/invoices?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setInvoices(data.invoices)
        setPagination(data.pagination)
      }
    } catch (err) {
      console.error('Failed to fetch invoices:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchInvoiceDetail = async (invoiceId) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/portal/invoices/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setSelectedInvoice(data)
      }
    } catch (err) {
      console.error('Failed to fetch invoice:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    setDownloadLoading(true)
    try {
      const res = await fetch(`${API_URL}/portal/invoices/${selectedInvoice.id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${selectedInvoice.invoiceNumber}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        a.remove()
      } else {
        alert('Failed to download PDF')
      }
    } catch (err) {
      alert('Failed to download PDF')
    } finally {
      setDownloadLoading(false)
    }
  }

  const isOverdue = (dueDate, status) => {
    return new Date() > new Date(dueDate) && !['PAID', 'CANCELLED'].includes(status)
  }

  // Invoice Detail View
  if (id && selectedInvoice) {
    return (
      <div className="space-y-6">
        {/* Back button */}
        <button
          onClick={() => navigate('/portal/invoices')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Invoices
        </button>

        {/* Invoice Header */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{selectedInvoice.invoiceNumber}</h1>
              <p className="text-sm text-gray-500 mt-1">
                Order: {selectedInvoice.order?.orderNumber}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusColors[selectedInvoice.status]}`}>
                {selectedInvoice.status}
              </span>
              <button
                onClick={handleDownloadPDF}
                disabled={downloadLoading}
                className="flex items-center px-4 py-2 bg-industrial text-white rounded-lg hover:bg-industrial/90 disabled:opacity-50"
              >
                {downloadLoading ? (
                  <svg className="animate-spin w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                )}
                Download PDF
              </button>
            </div>
          </div>

          {/* Due Date Warning */}
          {isOverdue(selectedInvoice.dueDate, selectedInvoice.status) && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                This invoice is overdue. Please make payment as soon as possible.
              </p>
            </div>
          )}

          {/* Invoice Details */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Invoice Date</p>
              <p className="font-medium text-gray-900">{new Date(selectedInvoice.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Due Date</p>
              <p className={`font-medium ${isOverdue(selectedInvoice.dueDate, selectedInvoice.status) ? 'text-red-600' : 'text-gray-900'}`}>
                {new Date(selectedInvoice.dueDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
              <p className="font-medium text-gray-900">R{Number(selectedInvoice.total).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Balance Due</p>
              <p className={`font-medium ${Number(selectedInvoice.balance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                R{Number(selectedInvoice.balance).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Items</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {selectedInvoice.order?.items?.map((item) => (
              <div key={item.id} className="p-4 sm:p-6 flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
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
          {/* Invoice Summary */}
          <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl">
            <div className="max-w-xs ml-auto space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">R{Number(selectedInvoice.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">VAT (15%)</span>
                <span className="text-gray-900">R{Number(selectedInvoice.vatAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>R{Number(selectedInvoice.total).toFixed(2)}</span>
              </div>
              {Number(selectedInvoice.amountPaid) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Amount Paid</span>
                  <span>-R{Number(selectedInvoice.amountPaid).toFixed(2)}</span>
                </div>
              )}
              {Number(selectedInvoice.balance) > 0 && (
                <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-200 text-red-600">
                  <span>Balance Due</span>
                  <span>R{Number(selectedInvoice.balance).toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment History */}
        {selectedInvoice.payments?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 sm:p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {selectedInvoice.payments.map((payment) => (
                <div key={payment.id} className="p-4 sm:p-6 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {new Date(payment.receivedAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {payment.method} {payment.reference && `- Ref: ${payment.reference}`}
                    </p>
                  </div>
                  <p className="font-medium text-green-600">R{Number(payment.amount).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bank Details */}
        {Number(selectedInvoice.balance) > 0 && (
          <div className="bg-blue-50 rounded-xl p-4 sm:p-6">
            <h3 className="font-semibold text-blue-900 mb-3">Payment Details</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <p><strong>Bank:</strong> First National Bank</p>
              <p><strong>Account Name:</strong> Batlokoa Innovative Projects</p>
              <p><strong>Account Number:</strong> 62XXXXXXXXX</p>
              <p><strong>Branch Code:</strong> 250655</p>
              <p><strong>Reference:</strong> {selectedInvoice.invoiceNumber}</p>
            </div>
            <p className="text-xs text-blue-600 mt-4">
              Please use your invoice number as the payment reference.
            </p>
          </div>
        )}
      </div>
    )
  }

  // Invoices List View
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Invoices</h1>
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
      ) : invoices.length > 0 ? (
        <>
          <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
            {invoices.map((invoice) => (
              <Link
                key={invoice.id}
                to={`/portal/invoices/${invoice.id}`}
                className="block p-4 sm:p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{invoice.invoiceNumber}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[invoice.status]}`}>
                        {invoice.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {invoice.order?.orderNumber} | Due: {new Date(invoice.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">R{Number(invoice.total).toFixed(2)}</p>
                      {Number(invoice.balance) > 0 && (
                        <p className="text-sm text-red-600">Due: R{Number(invoice.balance).toFixed(2)}</p>
                      )}
                    </div>
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No invoices yet</h3>
          <p className="text-gray-500">Your invoices will appear here when orders are invoiced.</p>
        </div>
      )}
    </div>
  )
}
