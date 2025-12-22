import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' ? 'http://localhost:3016/api/v1' : `${window.location.origin}/api/v1`
)

export default function QuoteEdit() {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const { token } = useAuth()

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Customer search
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showCustomerSearch, setShowCustomerSearch] = useState(false)

  // Product search
  const [productSearch, setProductSearch] = useState('')
  const [productResults, setProductResults] = useState([])
  const [showProductSearch, setShowProductSearch] = useState(false)

  // Quote data
  const [items, setItems] = useState([])
  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerCompany: '',
    validDays: '30',
    notes: ''
  })

  useEffect(() => {
    if (!isNew) fetchQuote()
  }, [id])

  const fetchQuote = async () => {
    try {
      const res = await fetch(`${API_URL}/quotes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Quote not found')
      const quote = await res.json()
      if (quote.customerId && quote.customer) {
        setSelectedCustomer(quote.customer)
      }
      setItems((quote.items || []).map(item => ({
        id: item.id || Date.now(),
        productId: item.productId,
        name: item.description || item.product?.name || 'Item',
        sku: item.sku || item.product?.sku || '',
        quantity: item.quantity,
        unitPrice: item.unitPrice
      })))
      setForm({
        customerName: quote.customerName || '',
        customerEmail: quote.customerEmail || '',
        customerPhone: quote.customerPhone || '',
        customerCompany: quote.customerCompany || '',
        validDays: '30',
        notes: quote.notes || ''
      })
    } catch (error) {
      setError('Failed to load quote')
    } finally {
      setLoading(false)
    }
  }

  // Customer search
  useEffect(() => {
    if (customerSearch.length < 2) {
      setCustomerResults([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/customers/search?q=${encodeURIComponent(customerSearch)}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        setCustomerResults(data || [])
      } catch (e) {
        console.error('Customer search error:', e)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [customerSearch])

  // Product search
  useEffect(() => {
    if (productSearch.length < 2) {
      setProductResults([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/products?search=${encodeURIComponent(productSearch)}&limit=10`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        setProductResults(data.products || [])
      } catch (e) {
        console.error('Product search error:', e)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [productSearch])

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer)
    setCustomerSearch('')
    setShowCustomerSearch(false)
    setForm(prev => ({
      ...prev,
      customerName: `${customer.firstName} ${customer.lastName}`.trim(),
      customerEmail: customer.email || '',
      customerPhone: customer.phone || '',
      customerCompany: customer.company || ''
    }))
  }

  const addProduct = (product) => {
    setItems(prev => [...prev, {
      id: Date.now(),
      productId: product.id,
      name: product.name,
      sku: product.sku,
      quantity: 1,
      unitPrice: product.price
    }])
    setProductSearch('')
    setShowProductSearch(false)
  }

  const addCustomItem = () => {
    setItems(prev => [...prev, {
      id: Date.now(),
      productId: null,
      name: '',
      sku: '',
      quantity: 1,
      unitPrice: 0
    }])
  }

  const updateItem = (itemId, field, value) => {
    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, [field]: value } : item
    ))
  }

  const removeItem = (itemId) => {
    setItems(prev => prev.filter(item => item.id !== itemId))
  }

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  const vatAmount = subtotal * 0.15
  const total = subtotal + vatAmount

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (items.length === 0) {
      setError('Please add at least one item')
      return
    }
    if (!form.customerName && !selectedCustomer) {
      setError('Please provide customer details')
      return
    }
    setError('')
    setSaving(true)

    try {
      const validUntil = new Date()
      validUntil.setDate(validUntil.getDate() + parseInt(form.validDays))

      const payload = {
        customerId: selectedCustomer?.id || null,
        customerName: form.customerName || (selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : ''),
        customerEmail: form.customerEmail || selectedCustomer?.email || '',
        customerPhone: form.customerPhone || selectedCustomer?.phone || '',
        customerCompany: form.customerCompany || selectedCustomer?.company || '',
        validUntil: validUntil.toISOString(),
        notes: form.notes,
        items: items.map(item => ({
          productId: item.productId,
          description: item.name,
          sku: item.sku,
          quantity: parseInt(item.quantity),
          unitPrice: parseFloat(item.unitPrice)
        })),
        source: 'ADMIN'
      }

      const url = isNew ? `${API_URL}/quotes` : `${API_URL}/quotes/${id}`
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
        throw new Error(data.error || 'Failed to save quote')
      }

      navigate('/admin/quotes')
    } catch (error) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (amount) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount || 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-safety"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/quotes" className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-navy-light">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          {isNew ? 'New Quote' : 'Edit Quote'}
        </h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer */}
        <div className="bg-white dark:bg-navy rounded-xl shadow-card p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Customer</h3>

          {/* Customer Search */}
          <div className="relative mb-4">
            <input type="text" value={customerSearch} onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerSearch(true); }}
              placeholder="Search existing customer..."
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white focus:ring-2 focus:ring-safety" />
            {showCustomerSearch && customerResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-navy-light border border-gray-200 dark:border-navy rounded-lg shadow-lg max-h-60 overflow-auto">
                {customerResults.map(customer => (
                  <button type="button" key={customer.id} onClick={() => selectCustomer(customer)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-navy border-b border-gray-100 dark:border-navy last:border-0">
                    <p className="font-medium text-gray-900 dark:text-white">{customer.company || `${customer.firstName} ${customer.lastName}`}</p>
                    <p className="text-sm text-gray-500">{customer.email}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="text-xs text-gray-500 mb-3">Or enter customer details manually:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
              <input type="text" value={form.customerName} onChange={(e) => setForm(prev => ({ ...prev, customerName: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white focus:ring-2 focus:ring-safety" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company</label>
              <input type="text" value={form.customerCompany} onChange={(e) => setForm(prev => ({ ...prev, customerCompany: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white focus:ring-2 focus:ring-safety" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input type="email" value={form.customerEmail} onChange={(e) => setForm(prev => ({ ...prev, customerEmail: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white focus:ring-2 focus:ring-safety" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
              <input type="tel" value={form.customerPhone} onChange={(e) => setForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white focus:ring-2 focus:ring-safety" />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white dark:bg-navy rounded-xl shadow-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Quote Items *</h3>
            <button type="button" onClick={addCustomItem} className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900">+ Custom Item</button>
          </div>

          <div className="relative mb-4">
            <input type="text" value={productSearch} onChange={(e) => { setProductSearch(e.target.value); setShowProductSearch(true); }}
              placeholder="Search products..."
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white focus:ring-2 focus:ring-safety" />
            {showProductSearch && productResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-navy-light border border-gray-200 dark:border-navy rounded-lg shadow-lg max-h-60 overflow-auto">
                {productResults.map(product => (
                  <button type="button" key={product.id} onClick={() => addProduct(product)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-navy border-b border-gray-100 dark:border-navy last:border-0 flex justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.sku}</p>
                    </div>
                    <span className="font-medium">{formatCurrency(product.price)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {items.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No items. Search products above.</p>
          ) : (
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 dark:bg-navy-light rounded-lg">
                  <div className="flex-1">
                    <input type="text" value={item.name} onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                      placeholder="Item" className="w-full px-3 py-2 text-sm rounded border border-gray-200 dark:border-navy bg-white dark:bg-navy" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                      min="1" className="w-16 px-2 py-2 text-sm rounded border border-gray-200 dark:border-navy bg-white dark:bg-navy" />
                    <input type="number" value={item.unitPrice} onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      min="0" step="0.01" className="w-24 px-2 py-2 text-sm rounded border border-gray-200 dark:border-navy bg-white dark:bg-navy" />
                    <span className="w-24 text-right font-medium">{formatCurrency(item.quantity * item.unitPrice)}</span>
                    <button type="button" onClick={() => removeItem(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              <div className="border-t border-gray-200 dark:border-navy pt-3 text-right space-y-1">
                <p className="text-sm text-gray-500">Subtotal: {formatCurrency(subtotal)}</p>
                <p className="text-sm text-gray-500">VAT (15%): {formatCurrency(vatAmount)}</p>
                <p className="text-lg font-bold">Total: {formatCurrency(total)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Quote Settings */}
        <div className="bg-white dark:bg-navy rounded-xl shadow-card p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valid For (days)</label>
              <select value={form.validDays} onChange={(e) => setForm(prev => ({ ...prev, validDays: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white focus:ring-2 focus:ring-safety">
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
                <option value="60">60 days</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))} rows={2}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white focus:ring-2 focus:ring-safety resize-none" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <Link to="/admin/quotes" className="px-4 py-2.5 text-center border border-gray-300 dark:border-navy-light text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100">
            Cancel
          </Link>
          <button type="submit" disabled={saving} className="px-6 py-2.5 bg-safety text-white rounded-lg hover:bg-safety-dark disabled:opacity-50 flex items-center justify-center">
            {saving ? 'Saving...' : isNew ? 'Create Quote' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
