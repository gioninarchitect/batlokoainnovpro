import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' ? 'http://localhost:3016/api/v1' : `${window.location.origin}/api/v1`
)

const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
  SENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  CONFIRMED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  PARTIAL: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  RECEIVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

export default function PurchaseOrderEdit() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { token } = useAuth()
  const isNew = id === 'new'

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])

  const [formData, setFormData] = useState({
    supplierId: searchParams.get('supplier') || '',
    expectedDate: '',
    notes: '',
    internalNotes: '',
    items: [{ description: '', sku: '', quantity: 1, unitPrice: 0, productId: '' }],
  })
  const [purchaseOrder, setPurchaseOrder] = useState(null)

  useEffect(() => {
    fetchSuppliers()
    fetchProducts()
    if (!isNew) {
      fetchPurchaseOrder()
    }
  }, [id])

  const fetchSuppliers = async () => {
    try {
      const res = await fetch(`${API_URL}/suppliers?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setSuppliers(data.suppliers)
      }
    } catch (err) {
      console.error('Failed to fetch suppliers:', err)
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/products?limit=500`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || data)
      }
    } catch (err) {
      console.error('Failed to fetch products:', err)
    }
  }

  const fetchPurchaseOrder = async () => {
    try {
      const res = await fetch(`${API_URL}/purchase-orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setPurchaseOrder(data)
        setFormData({
          supplierId: data.supplierId,
          expectedDate: data.expectedDate ? data.expectedDate.split('T')[0] : '',
          notes: data.notes || '',
          internalNotes: data.internalNotes || '',
          items: data.items.map((item) => ({
            id: item.id,
            description: item.description,
            sku: item.sku || '',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            productId: item.productId || '',
          })),
        })
      } else {
        setError('Purchase order not found')
      }
    } catch (err) {
      setError('Failed to fetch purchase order')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items]
    newItems[index][field] = value

    // If selecting a product, auto-fill description and sku
    if (field === 'productId' && value) {
      const product = products.find((p) => p.id === value)
      if (product) {
        newItems[index].description = product.name
        newItems[index].sku = product.sku || ''
        newItems[index].unitPrice = product.costPrice || product.price || 0
      }
    }

    setFormData((prev) => ({ ...prev, items: newItems }))
  }

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { description: '', sku: '', quantity: 1, unitPrice: 0, productId: '' }],
    }))
  }

  const removeItem = (index) => {
    if (formData.items.length === 1) return
    const newItems = formData.items.filter((_, i) => i !== index)
    setFormData((prev) => ({ ...prev, items: newItems }))
  }

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const url = isNew
        ? `${API_URL}/purchase-orders`
        : `${API_URL}/purchase-orders/${id}`

      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        const data = await res.json()
        navigate(`/admin/purchase-orders/${data.id}`)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to save purchase order')
      }
    } catch (err) {
      setError('Failed to save purchase order')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await fetch(`${API_URL}/purchase-orders/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        fetchPurchaseOrder()
      }
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this purchase order?')) return

    try {
      const res = await fetch(`${API_URL}/purchase-orders/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        navigate('/admin/purchase-orders')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to delete')
      }
    } catch (err) {
      setError('Failed to delete purchase order')
    }
  }

  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-safety"></div>
      </div>
    )
  }

  const subtotal = calculateSubtotal()
  const vatAmount = subtotal * 0.15
  const total = subtotal + vatAmount
  const canEdit = isNew || purchaseOrder?.status === 'DRAFT'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/purchase-orders')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-navy-light rounded-lg"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {isNew ? 'New Purchase Order' : purchaseOrder?.poNumber}
              </h1>
              {!isNew && purchaseOrder && (
                <p className="text-sm text-gray-500">Created {formatDate(purchaseOrder.createdAt)}</p>
              )}
            </div>
          </div>
        </div>
        {!isNew && purchaseOrder && (
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${STATUS_COLORS[purchaseOrder.status]}`}>
              {purchaseOrder.status}
            </span>
            {purchaseOrder.status === 'DRAFT' && (
              <button
                onClick={() => handleStatusChange('SENT')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Mark as Sent
              </button>
            )}
            {purchaseOrder.status === 'SENT' && (
              <button
                onClick={() => handleStatusChange('CONFIRMED')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
              >
                Confirm
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white dark:bg-navy rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Supplier *
              </label>
              <select
                name="supplierId"
                value={formData.supplierId}
                onChange={handleChange}
                required
                disabled={!canEdit}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-light rounded-lg bg-white dark:bg-navy-light text-gray-900 dark:text-white disabled:opacity-50"
              >
                <option value="">Select a supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.code} - {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Expected Delivery Date
              </label>
              <input
                type="date"
                name="expectedDate"
                value={formData.expectedDate}
                onChange={handleChange}
                disabled={!canEdit}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-light rounded-lg bg-white dark:bg-navy-light text-gray-900 dark:text-white disabled:opacity-50"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes (visible on PO)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={2}
                disabled={!canEdit}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-light rounded-lg bg-white dark:bg-navy-light text-gray-900 dark:text-white disabled:opacity-50"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Internal Notes
              </label>
              <textarea
                name="internalNotes"
                value={formData.internalNotes}
                onChange={handleChange}
                rows={2}
                disabled={!canEdit}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-light rounded-lg bg-white dark:bg-navy-light text-gray-900 dark:text-white disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white dark:bg-navy rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Line Items</h2>
            {canEdit && (
              <button
                type="button"
                onClick={addItem}
                className="text-sm text-safety hover:text-safety/80 font-medium"
              >
                + Add Item
              </button>
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-navy-light">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">SKU</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Unit Price</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                  {canEdit && <th className="px-4 py-2"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-navy-light">
                {formData.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2">
                      <select
                        value={item.productId}
                        onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                        disabled={!canEdit}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-navy-light rounded bg-white dark:bg-navy-light text-sm disabled:opacity-50"
                      >
                        <option value="">Select or custom</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        required
                        disabled={!canEdit}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-navy-light rounded bg-white dark:bg-navy-light text-sm disabled:opacity-50"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={item.sku}
                        onChange={(e) => handleItemChange(index, 'sku', e.target.value)}
                        disabled={!canEdit}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-navy-light rounded bg-white dark:bg-navy-light text-sm disabled:opacity-50"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        required
                        disabled={!canEdit}
                        className="w-20 px-2 py-1 border border-gray-300 dark:border-navy-light rounded bg-white dark:bg-navy-light text-sm text-right disabled:opacity-50"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                        required
                        disabled={!canEdit}
                        className="w-28 px-2 py-1 border border-gray-300 dark:border-navy-light rounded bg-white dark:bg-navy-light text-sm text-right disabled:opacity-50"
                      />
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-gray-900 dark:text-white">
                      R{(Number(item.quantity) * Number(item.unitPrice)).toFixed(2)}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-2">
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="p-1 text-red-500 hover:text-red-700"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {formData.items.map((item, index) => (
              <div key={index} className="p-4 border border-gray-200 dark:border-navy-light rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Item {index + 1}</span>
                  {canEdit && formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-500 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <select
                  value={item.productId}
                  onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-navy-light rounded-lg bg-white dark:bg-navy-light text-sm"
                >
                  <option value="">Select product or enter custom</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                  required
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-navy-light rounded-lg bg-white dark:bg-navy-light text-sm"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Qty"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    required
                    disabled={!canEdit}
                    className="px-3 py-2 border border-gray-300 dark:border-navy-light rounded-lg bg-white dark:bg-navy-light text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Unit Price"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                    required
                    disabled={!canEdit}
                    className="px-3 py-2 border border-gray-300 dark:border-navy-light rounded-lg bg-white dark:bg-navy-light text-sm"
                  />
                </div>
                <div className="text-right font-medium text-gray-900 dark:text-white">
                  Total: R{(Number(item.quantity) * Number(item.unitPrice)).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-navy-light">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-900 dark:text-white">R{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">VAT (15%)</span>
                  <span className="text-gray-900 dark:text-white">R{vatAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-200 dark:border-navy-light">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-gray-900 dark:text-white">R{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Receivings History */}
        {!isNew && purchaseOrder?.receivings?.length > 0 && (
          <div className="bg-white dark:bg-navy rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Receiving History</h2>
            <div className="space-y-3">
              {purchaseOrder.receivings.map((receiving) => (
                <div key={receiving.id} className="p-4 bg-gray-50 dark:bg-navy-light rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatDate(receiving.receivedDate)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {receiving.items?.length} items received
                    </span>
                  </div>
                  {receiving.notes && (
                    <p className="text-sm text-gray-500">{receiving.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            {!isNew && purchaseOrder?.status === 'DRAFT' && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Delete Purchase Order
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/purchase-orders')}
              className="px-4 py-2 border border-gray-300 dark:border-navy-light rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-light text-sm"
            >
              Cancel
            </button>
            {canEdit && (
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-safety text-white rounded-lg hover:bg-safety/90 text-sm font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : isNew ? 'Create Purchase Order' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
