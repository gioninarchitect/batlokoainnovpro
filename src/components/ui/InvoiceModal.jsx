import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, Download, Send, CheckCircle, Calendar, AlertCircle } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' ? 'http://localhost:3016/api/v1' : `${window.location.origin}/api/v1`
)

export default function InvoiceModal({ isOpen, onClose, order, token, onSuccess }) {
  const [step, setStep] = useState('preview') // preview | generating | success | error
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [invoice, setInvoice] = useState(null)
  const [error, setError] = useState('')

  // Calculate default due date based on customer payment terms
  useEffect(() => {
    if (order) {
      const days = order.customer?.paymentTerms || 30
      const due = new Date()
      due.setDate(due.getDate() + days)
      setDueDate(due.toISOString().split('T')[0])
    }
  }, [order])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount || 0)
  }

  const handleGenerate = async () => {
    setStep('generating')
    setError('')

    try {
      const res = await fetch(`${API_URL}/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: order.id,
          dueDate,
          notes
        })
      })

      if (res.ok) {
        const data = await res.json()
        setInvoice(data)
        setStep('success')
        if (onSuccess) onSuccess(data)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to generate invoice')
        setStep('error')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      setStep('error')
    }
  }

  const handleDownloadPDF = async () => {
    if (!invoice) return
    try {
      const res = await fetch(`${API_URL}/invoices/${invoice.id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${invoice.invoiceNumber}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download PDF:', err)
    }
  }

  const handleSendInvoice = async () => {
    if (!invoice) return
    try {
      await fetch(`${API_URL}/invoices/${invoice.id}/send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      // Could show toast notification here
      onClose()
    } catch (err) {
      console.error('Failed to send invoice:', err)
    }
  }

  const handleClose = () => {
    setStep('preview')
    setInvoice(null)
    setError('')
    setNotes('')
    onClose()
  }

  if (!order) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-navy rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>

              {/* Preview Step */}
              {step === 'preview' && (
                <>
                  <div className="flex items-center gap-4 p-6 border-b border-gray-100 dark:border-navy-light">
                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
                      <FileText size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Generate Invoice</h3>
                      <p className="text-sm text-gray-500">Order #{order.orderNumber}</p>
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-light">
                      <X size={20} className="text-gray-500" />
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    {/* Order Summary */}
                    <div className="bg-gray-50 dark:bg-navy-light rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Order Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Customer</span>
                          <span className="text-gray-900 dark:text-white font-medium">
                            {order.customer?.firstName} {order.customer?.lastName}
                          </span>
                        </div>
                        {order.customer?.company && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Company</span>
                            <span className="text-gray-900 dark:text-white">{order.customer.company}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-500">Items</span>
                          <span className="text-gray-900 dark:text-white">{order.items?.length || 0} items</span>
                        </div>
                        <div className="border-t border-gray-200 dark:border-navy pt-2 mt-2">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="text-gray-900 dark:text-white">{formatCurrency(order.subtotal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">VAT (15%)</span>
                            <span className="text-gray-900 dark:text-white">{formatCurrency(order.vatAmount)}</span>
                          </div>
                          <div className="flex justify-between font-bold mt-1">
                            <span className="text-gray-900 dark:text-white">Total</span>
                            <span className="text-safety">{formatCurrency(order.total)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Due Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <Calendar size={14} className="inline mr-1" />
                        Payment Due Date
                      </label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white focus:ring-2 focus:ring-safety focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Based on {order.customer?.paymentTerms || 30} day payment terms
                      </p>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Invoice Notes (optional)
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        placeholder="Special terms, payment instructions..."
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white focus:ring-2 focus:ring-safety focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 p-6 pt-0">
                    <button
                      onClick={handleClose}
                      className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-navy-light text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-navy-light"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleGenerate}
                      className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 flex items-center justify-center gap-2"
                    >
                      <FileText size={18} />
                      Generate Invoice
                    </button>
                  </div>
                </>
              )}

              {/* Generating Step */}
              {step === 'generating' && (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Generating Invoice...</h3>
                  <p className="text-gray-500">Please wait while we create your invoice</p>
                </div>
              )}

              {/* Success Step */}
              {step === 'success' && invoice && (
                <>
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                      <CheckCircle size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Invoice Created</h3>
                    <p className="text-2xl font-bold text-safety mb-1">{invoice.invoiceNumber}</p>
                    <p className="text-gray-500">Total: {formatCurrency(invoice.total)}</p>
                  </div>

                  <div className="px-6 pb-6 space-y-3">
                    <button
                      onClick={handleDownloadPDF}
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-navy-light text-gray-900 dark:text-white rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-navy flex items-center justify-center gap-2"
                    >
                      <Download size={18} />
                      Download PDF
                    </button>
                    <button
                      onClick={handleSendInvoice}
                      className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <Send size={18} />
                      Send to Customer
                    </button>
                    <button
                      onClick={handleClose}
                      className="w-full px-4 py-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white font-medium"
                    >
                      Done
                    </button>
                  </div>
                </>
              )}

              {/* Error Step */}
              {step === 'error' && (
                <>
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600">
                      <AlertCircle size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Generation Failed</h3>
                    <p className="text-gray-500">{error}</p>
                  </div>

                  <div className="flex gap-3 p-6 pt-0">
                    <button
                      onClick={handleClose}
                      className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-navy-light text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-navy-light"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => setStep('preview')}
                      className="flex-1 px-4 py-2.5 bg-safety text-white rounded-xl font-medium hover:bg-safety-dark"
                    >
                      Try Again
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
