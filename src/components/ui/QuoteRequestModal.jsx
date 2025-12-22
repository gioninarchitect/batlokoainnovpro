import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Check, AlertCircle, MessageCircle } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

function QuoteRequestModal({ isOpen, onClose, service }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    quantity: '',
    message: ''
  })
  const [status, setStatus] = useState('idle') // idle, loading, success, error
  const [errors, setErrors] = useState({})

  const whatsappNumber = '27739748317'

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email'
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setStatus('loading')

    // Build WhatsApp message
    const productName = service?.title || 'General Inquiry'
    const message = `
*New Quote Request*
-------------------
*Product:* ${productName}
*Name:* ${formData.name}
*Email:* ${formData.email}
*Phone:* ${formData.phone}
*Company:* ${formData.company || 'N/A'}
*Quantity:* ${formData.quantity || 'To be discussed'}
*Message:* ${formData.message || 'N/A'}
    `.trim()

    // Open WhatsApp with the message
    const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappLink, '_blank')

    setStatus('success')

    // Reset after 3 seconds
    setTimeout(() => {
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        quantity: '',
        message: ''
      })
      setStatus('idle')
      onClose()
    }, 2000)
  }

  const inputClasses = (field) => `
    w-full px-4 py-3 rounded-lg border transition-colors
    ${errors[field]
      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
      : 'border-gray-200 focus:border-safety focus:ring-safety/20'
    }
    focus:outline-none focus:ring-2
  `

  if (status === 'success') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="sm" title="Quote Request">
        <div className="p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Check size={40} className="text-green-500" />
          </motion.div>
          <h3 className="font-heading text-h4 text-navy mb-2">Quote Request Sent!</h3>
          <p className="text-gray-600">
            Your request has been sent via WhatsApp. We'll get back to you shortly.
          </p>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" title={`Request Quote${service ? `: ${service.title}` : ''}`}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Product Info */}
        {service && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-500">Requesting quote for:</p>
            <p className="font-semibold text-navy">{service.title}</p>
          </div>
        )}

        {/* Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={inputClasses('name')}
              placeholder="John Doe"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle size={14} /> {errors.name}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={inputClasses('email')}
              placeholder="john@company.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle size={14} /> {errors.email}
              </p>
            )}
          </div>
        </div>

        {/* Phone & Company */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={inputClasses('phone')}
              placeholder="073 974 8317"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle size={14} /> {errors.phone}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name
            </label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              className={inputClasses('company')}
              placeholder="Your Company"
            />
          </div>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estimated Quantity
          </label>
          <input
            type="text"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            className={inputClasses('quantity')}
            placeholder="e.g., 100 units, bulk order, etc."
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Details
          </label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={4}
            className={inputClasses('message')}
            placeholder="Tell us more about your requirements, specifications, delivery timeline, etc."
          />
        </div>

        {/* Submit */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="submit"
            disabled={status === 'loading'}
            className="flex-1"
          >
            {status === 'loading' ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <MessageCircle size={18} />
                Send via WhatsApp
              </>
            )}
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          By submitting, your quote request will be sent directly to our WhatsApp for quick response.
        </p>
      </form>
    </Modal>
  )
}

export default QuoteRequestModal
