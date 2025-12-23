import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' ? 'http://localhost:3016/api/v1' : `${window.location.origin}/api/v1`
)

export default function SupplierEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()
  const isNew = !id || id === 'new'

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    website: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'South Africa',
    bankName: '',
    bankAccount: '',
    bankBranch: '',
    paymentTerms: 30,
    leadTime: 7,
    categories: [],
    isActive: true,
    rating: '',
    notes: '',
  })

  const [recentPOs, setRecentPOs] = useState([])

  useEffect(() => {
    if (!isNew) {
      fetchSupplier()
    }
  }, [id])

  const fetchSupplier = async () => {
    try {
      const res = await fetch(`${API_URL}/suppliers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setFormData({
          name: data.name || '',
          contactPerson: data.contactPerson || '',
          email: data.email || '',
          phone: data.phone || '',
          website: data.website || '',
          addressLine1: data.addressLine1 || '',
          addressLine2: data.addressLine2 || '',
          city: data.city || '',
          province: data.province || '',
          postalCode: data.postalCode || '',
          country: data.country || 'South Africa',
          bankName: data.bankName || '',
          bankAccount: data.bankAccount || '',
          bankBranch: data.bankBranch || '',
          paymentTerms: data.paymentTerms || 30,
          leadTime: data.leadTime || 7,
          categories: data.categories || [],
          isActive: data.isActive !== false,
          rating: data.rating || '',
          notes: data.notes || '',
        })
        setRecentPOs(data.purchaseOrders || [])
      } else {
        setError('Supplier not found')
      }
    } catch (err) {
      setError('Failed to load supplier')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleCategoriesChange = (e) => {
    const value = e.target.value
    setFormData((prev) => ({
      ...prev,
      categories: value ? value.split(',').map((s) => s.trim()) : [],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name) {
      setError('Supplier name is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const url = isNew ? `${API_URL}/suppliers` : `${API_URL}/suppliers/${id}`
      const method = isNew ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        navigate('/admin/suppliers')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to save supplier')
      }
    } catch (err) {
      setError('Failed to save supplier')
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link to="/admin/suppliers" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 flex items-center mb-2">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Suppliers
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {isNew ? 'Add Supplier' : 'Edit Supplier'}
          </h1>
        </div>
        {!isNew && (
          <Link
            to={`/admin/purchase-orders/new?supplier=${id}`}
            className="px-4 py-2 bg-industrial text-white rounded-lg hover:bg-industrial/90 text-sm"
          >
            Create PO
          </Link>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white dark:bg-navy rounded-xl shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Supplier Name *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-light rounded-lg bg-white dark:bg-navy-light text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-light rounded-lg bg-white dark:bg-navy-light text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-light rounded-lg bg-white dark:bg-navy-light text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-light rounded-lg bg-white dark:bg-navy-light text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Website
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-light rounded-lg bg-white dark:bg-navy-light text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white dark:bg-navy rounded-xl shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Address</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address Line 1
              </label>
              <input
                type="text"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-light rounded-lg bg-white dark:bg-navy-light text-gray-900 dark:text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address Line 2
              </label>
              <input
                type="text"
                name="addressLine2"
                value={formData.addressLine2}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-light rounded-lg bg-white dark:bg-navy-light text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-light rounded-lg bg-white dark:bg-navy-light text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Province
              </label>
              <select
                name="province"
                value={formData.province}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-light rounded-lg bg-white dark:bg-navy-light text-gray-900 dark:text-white"
              >
                <option value="">Select Province</option>
                <option value="Eastern Cape">Eastern Cape</option>
                <option value="Free State">Free State</option>
                <option value="Gauteng">Gauteng</option>
                <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                <option value="Limpopo">Limpopo</option>
                <option value="Mpumalanga">Mpumalanga</option>
                <option value="North West">North West</option>
                <option value="Northern Cape">Northern Cape</option>
                <option value="Western Cape">Western Cape</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Postal Code
              </label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-light rounded-lg bg-white dark:bg-navy-light text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Banking */}
        <div className="bg-white dark:bg-navy rounded-xl shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Banking Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bank Name
              </label>
              <input
                type="text"
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-light rounded-lg bg-white dark:bg-navy-light text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Account Number
              </label>
              <input
                type="text"
                name="bankAccount"
                value={formData.bankAccount}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-light rounded-lg bg-white dark:bg-navy-light text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Branch Code
              </label>
              <input
                type="text"
                name="bankBranch"
                value={formData.bankBranch}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-light rounded-lg bg-white dark:bg-navy-light text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Terms & Categories */}
        <div className="bg-white dark:bg-navy rounded-xl shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Terms & Categories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Payment Terms (days)
              </label>
              <input
                type="number"
                name="paymentTerms"
                value={formData.paymentTerms}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-light rounded-lg bg-white dark:bg-navy-light text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Lead Time (days)
              </label>
              <input
                type="number"
                name="leadTime"
                value={formData.leadTime}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-light rounded-lg bg-white dark:bg-navy-light text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rating (1-5)
              </label>
              <select
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-light rounded-lg bg-white dark:bg-navy-light text-gray-900 dark:text-white"
              >
                <option value="">Not Rated</option>
                <option value="1">1 - Poor</option>
                <option value="2">2 - Fair</option>
                <option value="3">3 - Good</option>
                <option value="4">4 - Very Good</option>
                <option value="5">5 - Excellent</option>
              </select>
            </div>
            <div className="flex items-center pt-6">
              <input
                type="checkbox"
                name="isActive"
                id="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 text-safety focus:ring-safety border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Active Supplier
              </label>
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Categories (comma-separated)
              </label>
              <input
                type="text"
                value={formData.categories.join(', ')}
                onChange={handleCategoriesChange}
                placeholder="e.g. Steel, Pipes, Fittings"
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-light rounded-lg bg-white dark:bg-navy-light text-gray-900 dark:text-white"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-light rounded-lg bg-white dark:bg-navy-light text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Recent POs (only for existing suppliers) */}
        {!isNew && recentPOs.length > 0 && (
          <div className="bg-white dark:bg-navy rounded-xl shadow-sm p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Purchase Orders</h2>
            <div className="space-y-2">
              {recentPOs.map((po) => (
                <Link
                  key={po.id}
                  to={`/admin/purchase-orders/${po.id}`}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-navy-light rounded-lg hover:bg-gray-50 dark:hover:bg-navy-light"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{po.poNumber}</p>
                    <p className="text-sm text-gray-500">{new Date(po.orderDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">R{Number(po.total).toFixed(2)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      po.status === 'RECEIVED' ? 'bg-green-100 text-green-800' :
                      po.status === 'DRAFT' ? 'bg-gray-100 text-gray-600' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {po.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            to="/admin/suppliers"
            className="px-4 py-2 border border-gray-300 dark:border-navy-light text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-navy-light"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-safety text-white rounded-lg hover:bg-safety/90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : isNew ? 'Create Supplier' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
