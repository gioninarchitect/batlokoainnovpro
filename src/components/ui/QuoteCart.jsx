import { useState, Fragment } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, Plus, Minus, FileText, Send, MessageCircle, ShoppingBag, AlertCircle } from 'lucide-react'
import { useQuoteCart } from '@/context/QuoteCartContext'
import Button from './Button'

function QuoteCartItem({ item, onUpdate, onRemove }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex gap-4 p-4 bg-gray-50 rounded-xl"
    >
      {/* Image */}
      {item.image && (
        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-navy truncate">{item.title}</h4>

        {/* Quantity Controls */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => onUpdate(item.id, { quantity: Math.max(1, item.quantity - 1) })}
            className="w-7 h-7 rounded-md bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <Minus size={14} />
          </button>
          <span className="w-8 text-center font-medium">{item.quantity}</span>
          <button
            onClick={() => onUpdate(item.id, { quantity: item.quantity + 1 })}
            className="w-7 h-7 rounded-md bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Notes */}
        {item.notes && (
          <p className="text-xs text-gray-500 mt-1 truncate">{item.notes}</p>
        )}
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(item.id)}
        className="p-2 text-gray-400 hover:text-red-500 transition-colors self-start"
      >
        <Trash2 size={18} />
      </button>
    </motion.div>
  )
}

function QuoteCart() {
  const { items, itemCount, isCartOpen, closeCart, updateItem, removeItem, clearCart } = useQuoteCart()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    delivery: '',
    notes: ''
  })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')

  const whatsappNumber = '27739748317'

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Required'
    if (!formData.email.trim()) newErrors.email = 'Required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email'
    if (!formData.phone.trim()) newErrors.phone = 'Required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setStatus('loading')

    const API_URL = window.location.hostname === 'localhost'
      ? 'http://localhost:3016/api/v1'
      : `${window.location.origin}/api/v1`

    const adminUrl = (quoteId) => window.location.hostname === 'localhost'
      ? `http://localhost:5173/admin/quotes/${quoteId}`
      : `${window.location.origin}/admin/quotes/${quoteId}`

    const isQuote = items.length > 0

    try {
      // Save to database
      const response = await fetch(`${API_URL}/quotes/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          customerCompany: formData.company,
          deliveryCity: formData.delivery,
          notes: formData.notes,
          items: isQuote ? items.map(item => ({
            title: item.title,
            quantity: item.quantity,
            notes: item.notes
          })) : [{ title: 'General Enquiry', quantity: 1 }]
        })
      })

      const data = await response.json()

      // Build WhatsApp message
      let message
      if (isQuote) {
        const itemsList = items.map((item, index) =>
          `${index + 1}. ${item.title} (Qty: ${item.quantity})${item.notes ? ' - ' + item.notes : ''}`
        ).join('\n')

        message = `*QUOTE REQUEST*
*Ref:* ${data.quoteNumber || 'Pending'}

*From:* ${formData.name}
*Phone:* ${formData.phone}
*Email:* ${formData.email}
*Company:* ${formData.company || 'N/A'}
*Delivery:* ${formData.delivery || 'TBD'}

*Items (${itemCount}):*
${itemsList}

*Notes:* ${formData.notes || 'None'}

Please send me a quote. Thanks!

---
Admin: ${adminUrl(data.quoteId || data.id)}`
      } else {
        message = `*ENQUIRY*
*Ref:* ${data.quoteNumber || 'Pending'}

*From:* ${formData.name}
*Phone:* ${formData.phone}
*Email:* ${formData.email}
*Company:* ${formData.company || 'N/A'}

*Message:*
${formData.notes || 'No message provided'}

---
Admin: ${adminUrl(data.quoteId || data.id)}`
      }

      // Open WhatsApp
      window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank')

      setStatus('success')

      // Reset after delay
      setTimeout(() => {
        clearCart()
        setShowForm(false)
        setFormData({ name: '', email: '', phone: '', company: '', delivery: '', notes: '' })
        setStatus('idle')
        closeCart()
      }, 2000)
    } catch (error) {
      console.error('Failed to submit quote:', error)
      setStatus('error')
    }
  }

  const inputClass = (field) => `
    w-full px-3 py-2 rounded-lg border text-sm transition-colors
    ${errors[field] ? 'border-red-300' : 'border-gray-200'}
    focus:outline-none focus:ring-2 focus:ring-safety/20 focus:border-safety
  `

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-50"
            onClick={closeCart}
          />

          {/* Cart Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-safety/10 rounded-xl flex items-center justify-center">
                  <FileText size={20} className="text-safety" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-navy">Quote Cart</h2>
                  <p className="text-sm text-gray-500">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <button
                onClick={closeCart}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {showForm || items.length === 0 ? (
                /* Quote Form / Enquiry Form */
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <h4 className="font-semibold text-navy text-sm mb-2">
                      {itemCount > 0 ? 'Quote Request' : 'General Enquiry'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {itemCount > 0
                        ? `${itemCount} product${itemCount !== 1 ? 's' : ''} selected`
                        : 'Send us a message and we\'ll get back to you'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={inputClass('name')}
                        placeholder="Full name"
                      />
                      {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Phone *</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className={inputClass('phone')}
                        placeholder="073 000 0000"
                      />
                      {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={inputClass('email')}
                      placeholder="you@company.com"
                    />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className={inputClass('company')}
                      placeholder="Company name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Delivery Location</label>
                    <input
                      type="text"
                      value={formData.delivery}
                      onChange={(e) => setFormData({ ...formData, delivery: e.target.value })}
                      className={inputClass('delivery')}
                      placeholder="City, Province"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Additional Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className={inputClass('notes')}
                      placeholder="Any specific requirements..."
                    />
                  </div>

                  {status === 'success' ? (
                    <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-center">
                      Quote sent successfully!
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="flex-1 px-4 py-3 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                      >
                        {status === 'loading' ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <MessageCircle size={18} />
                            {itemCount > 0 ? 'Send Quote' : 'Send Enquiry'}
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </form>
              ) : (
                /* Items List */
                <div className="p-6 space-y-3">
                  <AnimatePresence mode="popLayout">
                    {items.map(item => (
                      <QuoteCartItem
                        key={item.id}
                        item={item}
                        onUpdate={updateItem}
                        onRemove={removeItem}
                      />
                    ))}
                  </AnimatePresence>

                  {items.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="w-full mt-4 px-4 py-2 text-sm text-gray-500 hover:text-red-500 transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && !showForm && (
              <div className="border-t border-gray-100 p-6">
                <Button onClick={() => setShowForm(true)} className="w-full">
                  <Send size={18} />
                  Request Quote ({itemCount} item{itemCount !== 1 ? 's' : ''})
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Floating Cart Button
export function QuoteCartButton() {
  const { itemCount, openCart } = useQuoteCart()

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={openCart}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-safety text-white rounded-full shadow-lg flex items-center justify-center hover:bg-safety-dark transition-colors"
    >
      <FileText size={24} />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 w-6 h-6 bg-navy text-white text-xs font-bold rounded-full flex items-center justify-center">
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      )}
    </motion.button>
  )
}

export default QuoteCart
