import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' ? 'http://localhost:3016/api/v1' : `${window.location.origin}/api/v1`
)

export default function OrderEdit() {
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

  // Order data
  const [items, setItems] = useState([])
  const [form, setForm] = useState({
    deliveryAddress: '',
    deliveryCity: '',
    deliveryProvince: '',
    deliveryPostalCode: '',
    deliveryNotes: '',
    paymentMethod: 'EFT',
    notes: '',
    priority: 'NORMAL'
  })

  useEffect(() => {
    if (!isNew) fetchOrder()
  }, [id])

  const fetchOrder = async () => {
    try {
      const res = await fetch(`${API_URL}/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Order not found')
      const order = await res.json()
      setSelectedCustomer(order.customer)
      setItems(order.items.map(item => ({
        id: item.id,
        productId: item.productId,
        name: item.description || item.product?.name || 'Item',
        sku: item.sku || item.product?.sku || '',
        quantity: item.quantity,
        unitPrice: item.unitPrice
      })))
      setForm({
        deliveryAddress: order.deliveryAddress || '',
        deliveryCity: order.deliveryCity || '',
        deliveryProvince: order.deliveryProvince || '',
        deliveryPostalCode: order.deliveryPostalCode || '',
        deliveryNotes: order.deliveryNotes || '',
        paymentMethod: order.paymentMethod || 'EFT',
        notes: order.notes || '',
        priority: order.priority || 'NORMAL'
      })
    } catch (error) {
      setError('Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  // Customer search with debounce
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
    // Auto-fill delivery address from customer
    if (customer.addressLine1) {
      setForm(prev => ({
        ...prev,
        deliveryAddress: customer.addressLine1,
        deliveryCity: customer.city || '',
        deliveryProvince: customer.province || '',
        deliveryPostalCode: customer.postalCode || ''
      }))
    }
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
    if (!selectedCustomer) {
      setError('Please select a customer')
      return
    }
    if (items.length === 0) {
      setError('Please add at least one item')
      return
    }
    setError('')
    setSaving(true)

    try {
      const payload = {
        customerId: selectedCustomer.id,
        items: items.map(item => ({
          productId: item.productId,
          description: item.name,
          sku: item.sku,
          quantity: parseInt(item.quantity),
          unitPrice: parseFloat(item.unitPrice)
        })),
        ...form,
        source: 'ADMIN'
      }

      const url = isNew ? `${API_URL}/orders` : `${API_URL}/orders/${id}`
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
        throw new Error(data.error || 'Failed to save order')
      }

      navigate('/admin/orders')
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
        <Link to="/admin/orders" className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-navy-light">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          {isNew ? 'New Order' : 'Edit Order'}
        </h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Selection */}
        <div className="bg-white dark:bg-navy rounded-xl shadow-card p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Customer *</h3>
          {selectedCustomer ? (
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-navy-light rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedCustomer.company || `${selectedCustomer.firstName} ${selectedCustomer.lastName}`}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedCustomer.email}</p>
              </div>
              <button type="button" onClick={() => { setSelectedCustomer(null); setShowCustomerSearch(true); }}
                className="text-sm text-safety hover:text-safety-dark">Change</button>
            </div>
          ) : (
            <div className="relative">
              <input type="text" value={customerSearch} onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerSearch(true); }}
                placeholder="Search customer by name, company or email..."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white focus:ring-2 focus:ring-safety focus:border-transparent" />
              {showCustomerSearch && customerResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-navy-light border border-gray-200 dark:border-navy rounded-lg shadow-lg max-h-60 overflow-auto">
                  {customerResults.map(customer => (
                    <button type="button" key={customer.id} onClick={() => selectCustomer(customer)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-navy border-b border-gray-100 dark:border-navy last:border-0">
                      <p className="font-medium text-gray-900 dark:text-white">{customer.company || `${customer.firstName} ${customer.lastName}`}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{customer.email} {customer.phone && `| ${customer.phone}`}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="bg-white dark:bg-navy rounded-xl shadow-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Order Items *</h3>
            <div className="flex gap-2">
              <button type="button" onClick={addCustomItem} className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900">+ Custom Item</button>
            </div>
          </div>

          {/* Product Search */}
          <div className="relative mb-4">
            <input type="text" value={productSearch} onChange={(e) => { setProductSearch(e.target.value); setShowProductSearch(true); }}
              placeholder="Search products to add..."
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white focus:ring-2 focus:ring-safety focus:border-transparent" />
            {showProductSearch && productResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-navy-light border border-gray-200 dark:border-navy rounded-lg shadow-lg max-h-60 overflow-auto">
                {productResults.map(product => (
                  <button type="button" key={product.id} onClick={() => addProduct(product)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-navy border-b border-gray-100 dark:border-navy last:border-0 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{product.sku}</p>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(product.price)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Items List */}
          {items.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No items added. Search for products above.</p>
          ) : (
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={item.id} className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 dark:bg-navy-light rounded-lg">
                  <div className="flex-1 min-w-0">
                    <input type="text" value={item.name} onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                      placeholder="Item description" className="w-full px-3 py-2 text-sm rounded border border-gray-200 dark:border-navy bg-white dark:bg-navy" />
                    {item.sku && <p className="text-xs text-gray-500 mt-1">SKU: {item.sku}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <div>
                      <label className="text-xs text-gray-500">Qty</label>
                      <input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        min="1" className="w-16 px-2 py-2 text-sm rounded border border-gray-200 dark:border-navy bg-white dark:bg-navy" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Price</label>
                      <input type="number" value={item.unitPrice} onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        min="0" step="0.01" className="w-24 px-2 py-2 text-sm rounded border border-gray-200 dark:border-navy bg-white dark:bg-navy" />
                    </div>
                    <div className="text-right">
                      <label className="text-xs text-gray-500">Total</label>
                      <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(item.quantity * item.unitPrice)}</p>
                    </div>
                    <button type="button" onClick={() => removeItem(item.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}

              {/* Totals */}
              <div className="border-t border-gray-200 dark:border-navy pt-3 space-y-1 text-right">
                <p className="text-sm text-gray-500">Subtotal: {formatCurrency(subtotal)}</p>
                <p className="text-sm text-gray-500">VAT (15%): {formatCurrency(vatAmount)}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">Total: {formatCurrency(total)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Delivery & Payment */}
        <div className="bg-white dark:bg-navy rounded-xl shadow-card p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Delivery & Payment</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Delivery Address</label>
              <input type="text" value={form.deliveryAddress} onChange={(e) => setForm(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white focus:ring-2 focus:ring-safety" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
              <input type="text" value={form.deliveryCity} onChange={(e) => setForm(prev => ({ ...prev, deliveryCity: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white focus:ring-2 focus:ring-safety" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Province</label>
              <select value={form.deliveryProvince} onChange={(e) => setForm(prev => ({ ...prev, deliveryProvince: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white focus:ring-2 focus:ring-safety">
                <option value="">Select</option>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Method</label>
              <select value={form.paymentMethod} onChange={(e) => setForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white focus:ring-2 focus:ring-safety">
                <option value="EFT">EFT</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="ACCOUNT">On Account</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
              <select value={form.priority} onChange={(e) => setForm(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white focus:ring-2 focus:ring-safety">
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
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
          <Link to="/admin/orders" className="px-4 py-2.5 text-center border border-gray-300 dark:border-navy-light text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-light transition-colors">
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
              isNew ? 'Create Order' : 'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
