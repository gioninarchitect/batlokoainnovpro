import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' ? 'http://localhost:3016/api/v1' : `${window.location.origin}/api/v1`
)

export default function CustomerEdit() {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const { token } = useAuth()

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    company: '',
    email: '',
    phone: '',
    vatNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'South Africa',
    source: '',
    paymentTerms: '0',
    creditLimit: ''
  })

  useEffect(() => {
    if (!isNew) fetchCustomer()
  }, [id])

  const fetchCustomer = async () => {
    try {
      const res = await fetch(`${API_URL}/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Customer not found')
      const customer = await res.json()
      setForm({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        company: customer.company || '',
        email: customer.email || '',
        phone: customer.phone || '',
        vatNumber: customer.vatNumber || '',
        addressLine1: customer.addressLine1 || '',
        addressLine2: customer.addressLine2 || '',
        city: customer.city || '',
        province: customer.province || '',
        postalCode: customer.postalCode || '',
        country: customer.country || 'South Africa',
        source: customer.source || '',
        paymentTerms: customer.paymentTerms?.toString() || '0',
        creditLimit: customer.creditLimit?.toString() || ''
      })
    } catch (error) {
      setError('Failed to load customer')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const payload = {
        ...form,
        paymentTerms: parseInt(form.paymentTerms) || 0,
        creditLimit: form.creditLimit ? parseFloat(form.creditLimit) : null
      }

      const url = isNew ? `${API_URL}/customers` : `${API_URL}/customers/${id}`
      const method = isNew ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save customer')
      }

      navigate('/admin/customers')
    } catch (error) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-safety"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/customers" className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-navy-light">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          {isNew ? 'Add Customer' : 'Edit Customer'}
        </h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-navy rounded-xl shadow-card p-4 sm:p-6 space-y-5">
        {/* Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name *</label>
            <input type="text" name="firstName" value={form.firstName} onChange={handleChange} required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white focus:ring-2 focus:ring-safety focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name *</label>
            <input type="text" name="lastName" value={form.lastName} onChange={handleChange} required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white focus:ring-2 focus:ring-safety focus:border-transparent" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company</label>
            <input type="text" name="company" value={form.company} onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white focus:ring-2 focus:ring-safety focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white focus:ring-2 focus:ring-safety focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
            <input type="tel" name="phone" value={form.phone} onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white focus:ring-2 focus:ring-safety focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">VAT Number</label>
            <input type="text" name="vatNumber" value={form.vatNumber} onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white focus:ring-2 focus:ring-safety focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Source</label>
            <select name="source" value={form.source} onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white focus:ring-2 focus:ring-safety focus:border-transparent">
              <option value="">Select source</option>
              <option value="Website">Website</option>
              <option value="Referral">Referral</option>
              <option value="Walk-in">Walk-in</option>
              <option value="Phone">Phone</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Address */}
        <div className="border-t border-gray-200 dark:border-navy-light pt-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Address</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address Line 1</label>
              <input type="text" name="addressLine1" value={form.addressLine1} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white focus:ring-2 focus:ring-safety focus:border-transparent" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address Line 2</label>
              <input type="text" name="addressLine2" value={form.addressLine2} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white focus:ring-2 focus:ring-safety focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
              <input type="text" name="city" value={form.city} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white focus:ring-2 focus:ring-safety focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Province</label>
              <select name="province" value={form.province} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white focus:ring-2 focus:ring-safety focus:border-transparent">
                <option value="">Select province</option>
                <option value="Gauteng">Gauteng</option>
                <option value="Western Cape">Western Cape</option>
                <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                <option value="Eastern Cape">Eastern Cape</option>
                <option value="Free State">Free State</option>
                <option value="Limpopo">Limpopo</option>
                <option value="Mpumalanga">Mpumalanga</option>
                <option value="North West">North West</option>
                <option value="Northern Cape">Northern Cape</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Postal Code</label>
              <input type="text" name="postalCode" value={form.postalCode} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white focus:ring-2 focus:ring-safety focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
              <input type="text" name="country" value={form.country} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white focus:ring-2 focus:ring-safety focus:border-transparent" />
            </div>
          </div>
        </div>

        {/* Payment Terms */}
        <div className="border-t border-gray-200 dark:border-navy-light pt-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Account Settings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Terms (days)</label>
              <select name="paymentTerms" value={form.paymentTerms} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white focus:ring-2 focus:ring-safety focus:border-transparent">
                <option value="0">COD / Upfront</option>
                <option value="7">7 Days</option>
                <option value="14">14 Days</option>
                <option value="30">30 Days</option>
                <option value="60">60 Days</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Credit Limit (R)</label>
              <input type="number" name="creditLimit" value={form.creditLimit} onChange={handleChange} min="0" step="100"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white focus:ring-2 focus:ring-safety focus:border-transparent" placeholder="0.00" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 dark:border-navy-light pt-5 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <Link to="/admin/customers" className="px-4 py-2.5 text-center border border-gray-300 dark:border-navy-light text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-light transition-colors">
            Cancel
          </Link>
          <button type="submit" disabled={saving} className="px-6 py-2.5 bg-safety text-white rounded-lg hover:bg-safety-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : (
              isNew ? 'Create Customer' : 'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
