import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' ? 'http://localhost:3016/api/v1' : `${window.location.origin}/api/v1`
)

export default function InvoiceView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paymentModal, setPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER')
  const [paymentReference, setPaymentReference] = useState('')

  useEffect(() => {
    fetchInvoice()
  }, [id])

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`${API_URL}/invoices/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setInvoice(data)
        setPaymentAmount(data.amountDue?.toString() || '')
      } else {
        navigate('/admin/invoices')
      }
    } catch (error) {
      console.error('Failed to fetch invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendInvoice = async () => {
    try {
      await fetch(`${API_URL}/invoices/${id}/send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchInvoice()
    } catch (error) {
      console.error('Failed to send invoice:', error)
    }
  }

  const handleRecordPayment = async (e) => {
    e.preventDefault()
    try {
      await fetch(`${API_URL}/invoices/${id}/payment`, {
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
      setPaymentModal(false)
      setPaymentAmount('')
      setPaymentReference('')
      fetchInvoice()
    } catch (error) {
      console.error('Failed to record payment:', error)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      const res = await fetch(`${API_URL}/invoices/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${invoice.invoiceNumber}.pdf`
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
      month: 'long',
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-safety"></div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Invoice not found</p>
        <Link to="/admin/invoices" className="text-safety hover:underline mt-2 inline-block">Back to Invoices</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/invoices')}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-navy-light"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{invoice.invoiceNumber}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                {invoice.status?.replace('_', ' ')}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">Issued {formatDate(invoice.issueDate)}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {invoice.status === 'DRAFT' && (
            <button
              onClick={handleSendInvoice}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send Invoice
            </button>
          )}
          {['SENT', 'PARTIALLY_PAID', 'OVERDUE'].includes(invoice.status) && (
            <button
              onClick={() => setPaymentModal(true)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Record Payment
            </button>
          )}
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 border border-gray-300 dark:border-navy-light text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-light flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </button>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Dates */}
          <div className="bg-white dark:bg-navy rounded-xl p-6 shadow-card">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">Bill To</h3>
                <p className="font-medium text-gray-900 dark:text-white">
                  {invoice.customer?.firstName} {invoice.customer?.lastName}
                </p>
                {invoice.customer?.company && (
                  <p className="text-gray-600 dark:text-gray-300">{invoice.customer.company}</p>
                )}
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{invoice.customer?.email}</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{invoice.customer?.phone}</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Issue Date:</span>
                  <span className="text-gray-900 dark:text-white">{formatDate(invoice.issueDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Due Date:</span>
                  <span className="text-gray-900 dark:text-white">{formatDate(invoice.dueDate)}</span>
                </div>
                {invoice.order && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Order:</span>
                    <Link to={`/admin/orders/${invoice.order.id}`} className="text-safety hover:underline">
                      {invoice.order.orderNumber}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white dark:bg-navy rounded-xl shadow-card overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-navy-light">
              <h3 className="font-medium text-gray-900 dark:text-white">Line Items</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-navy-light">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Item</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Price</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-navy-light">
                  {invoice.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{item.description || item.product?.name}</p>
                        {item.product?.sku && <p className="text-xs text-gray-500">SKU: {item.product.sku}</p>}
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-gray-900 dark:text-white">{item.quantity}</td>
                      <td className="px-4 py-4 text-right text-sm text-gray-900 dark:text-white">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-navy-light bg-gray-50 dark:bg-navy-light">
              <div className="space-y-2 max-w-xs ml-auto">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                  <span className="text-gray-900 dark:text-white">{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Discount</span>
                    <span className="text-green-600">-{formatCurrency(invoice.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">VAT (15%)</span>
                  <span className="text-gray-900 dark:text-white">{formatCurrency(invoice.tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-navy">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-gray-900 dark:text-white">{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-white dark:bg-navy rounded-xl p-6 shadow-card">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Notes</h3>
              <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="bg-white dark:bg-navy rounded-xl p-6 shadow-card">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">Payment Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Total</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(invoice.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Paid</span>
                <span className="font-medium text-green-600">{formatCurrency(invoice.amountPaid)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-navy-light">
                <span className="font-medium text-gray-900 dark:text-white">Balance Due</span>
                <span className={`font-bold text-lg ${invoice.amountDue > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {formatCurrency(invoice.amountDue)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment History */}
          {invoice.payments?.length > 0 && (
            <div className="bg-white dark:bg-navy rounded-xl p-6 shadow-card">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">Payment History</h3>
              <div className="space-y-3">
                {invoice.payments.map((payment, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-navy-light last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(payment.amount)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(payment.paymentDate)}</p>
                      {payment.reference && <p className="text-xs text-gray-400">{payment.reference}</p>}
                    </div>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                      {payment.method?.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-navy rounded-xl shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-gray-200 dark:border-navy-light flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Record Payment</h2>
              <button
                onClick={() => setPaymentModal(false)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleRecordPayment} className="p-4 space-y-4">
              <div className="bg-gray-50 dark:bg-navy-light rounded-lg p-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">Outstanding Balance</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(invoice.amountDue)}</p>
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
                  onClick={() => setPaymentModal(false)}
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
