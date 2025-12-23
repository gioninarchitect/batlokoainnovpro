import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' ? 'http://localhost:3016/api/v1' : `${window.location.origin}/api/v1`
)

export default function ReceiveStock() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [purchaseOrder, setPurchaseOrder] = useState(null)
  const [notes, setNotes] = useState('')
  const [receivingItems, setReceivingItems] = useState([])

  useEffect(() => {
    fetchPurchaseOrder()
  }, [id])

  const fetchPurchaseOrder = async () => {
    try {
      const res = await fetch(`${API_URL}/purchase-orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setPurchaseOrder(data)
        // Initialize receiving items from PO items
        setReceivingItems(
          data.items.map((item) => ({
            poItemId: item.id,
            productId: item.productId,
            description: item.description,
            orderedQty: item.quantity,
            previouslyReceived: item.quantityReceived || 0,
            remaining: item.quantity - (item.quantityReceived || 0),
            quantityReceived: 0,
            quantityAccepted: 0,
            quantityRejected: 0,
            rejectionReason: '',
          }))
        )
      } else {
        setError('Purchase order not found')
      }
    } catch (err) {
      setError('Failed to fetch purchase order')
    } finally {
      setLoading(false)
    }
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...receivingItems]
    newItems[index][field] = Number(value) || 0

    // Auto-calculate accepted if only received is changed
    if (field === 'quantityReceived') {
      const received = Number(value) || 0
      const rejected = newItems[index].quantityRejected || 0
      newItems[index].quantityAccepted = Math.max(0, received - rejected)
    }
    if (field === 'quantityRejected') {
      const received = newItems[index].quantityReceived || 0
      const rejected = Number(value) || 0
      newItems[index].quantityAccepted = Math.max(0, received - rejected)
    }

    setReceivingItems(newItems)
  }

  const handleReasonChange = (index, value) => {
    const newItems = [...receivingItems]
    newItems[index].rejectionReason = value
    setReceivingItems(newItems)
  }

  const handleReceiveAll = () => {
    setReceivingItems((items) =>
      items.map((item) => ({
        ...item,
        quantityReceived: item.remaining,
        quantityAccepted: item.remaining,
        quantityRejected: 0,
      }))
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    // Filter out items with 0 quantity received
    const itemsToReceive = receivingItems
      .filter((item) => item.quantityReceived > 0)
      .map((item) => ({
        poItemId: item.poItemId,
        productId: item.productId,
        description: item.description,
        quantityReceived: item.quantityReceived,
        quantityAccepted: item.quantityAccepted,
        quantityRejected: item.quantityRejected,
        rejectionReason: item.rejectionReason,
      }))

    if (itemsToReceive.length === 0) {
      setError('Please enter quantities for at least one item')
      setSaving(false)
      return
    }

    try {
      const res = await fetch(`${API_URL}/purchase-orders/${id}/receive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: itemsToReceive,
          notes,
        }),
      })

      if (res.ok) {
        navigate(`/admin/purchase-orders/${id}`)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to receive stock')
      }
    } catch (err) {
      setError('Failed to receive stock')
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

  if (!purchaseOrder) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Purchase order not found</p>
      </div>
    )
  }

  const totalReceiving = receivingItems.reduce((sum, item) => sum + item.quantityReceived, 0)
  const totalAccepted = receivingItems.reduce((sum, item) => sum + item.quantityAccepted, 0)
  const totalRejected = receivingItems.reduce((sum, item) => sum + item.quantityRejected, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/admin/purchase-orders/${id}`)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-navy-light rounded-lg"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Receive Stock
            </h1>
            <p className="text-sm text-gray-500">
              {purchaseOrder.poNumber} - {purchaseOrder.supplier?.name}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleReceiveAll}
          className="px-4 py-2 border border-gray-300 dark:border-navy-light rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-light text-sm"
        >
          Receive All Remaining
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Items to Receive */}
        <div className="bg-white dark:bg-navy rounded-xl shadow-sm overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-navy-light">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Item</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Ordered</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Previously Received</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Remaining</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Receiving</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Accepted</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Rejected</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rejection Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-navy-light">
                {receivingItems.map((item, index) => (
                  <tr key={index} className={item.remaining === 0 ? 'bg-green-50 dark:bg-green-900/10' : ''}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{item.description}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-900 dark:text-white">{item.orderedQty}</td>
                    <td className="px-4 py-3 text-center text-gray-500">{item.previouslyReceived}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={item.remaining === 0 ? 'text-green-600' : 'text-orange-600 font-medium'}>
                        {item.remaining}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        max={item.remaining}
                        value={item.quantityReceived}
                        onChange={(e) => handleItemChange(index, 'quantityReceived', e.target.value)}
                        disabled={item.remaining === 0}
                        className="w-20 px-2 py-1 border border-gray-300 dark:border-navy-light rounded bg-white dark:bg-navy-light text-center disabled:opacity-50"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        max={item.quantityReceived}
                        value={item.quantityAccepted}
                        onChange={(e) => handleItemChange(index, 'quantityAccepted', e.target.value)}
                        disabled={item.quantityReceived === 0}
                        className="w-20 px-2 py-1 border border-gray-300 dark:border-navy-light rounded bg-white dark:bg-navy-light text-center disabled:opacity-50"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        max={item.quantityReceived}
                        value={item.quantityRejected}
                        onChange={(e) => handleItemChange(index, 'quantityRejected', e.target.value)}
                        disabled={item.quantityReceived === 0}
                        className="w-20 px-2 py-1 border border-gray-300 dark:border-navy-light rounded bg-white dark:bg-navy-light text-center disabled:opacity-50"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.rejectionReason}
                        onChange={(e) => handleReasonChange(index, e.target.value)}
                        disabled={item.quantityRejected === 0}
                        placeholder={item.quantityRejected > 0 ? 'Required' : ''}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-navy-light rounded bg-white dark:bg-navy-light text-sm disabled:opacity-50"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-200 dark:divide-navy-light">
            {receivingItems.map((item, index) => (
              <div key={index} className={`p-4 space-y-3 ${item.remaining === 0 ? 'bg-green-50 dark:bg-green-900/10' : ''}`}>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900 dark:text-white">{item.description}</p>
                  <span className={`text-sm ${item.remaining === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                    {item.remaining} remaining
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div>
                    <p className="text-gray-500">Ordered</p>
                    <p className="font-medium text-gray-900 dark:text-white">{item.orderedQty}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Received</p>
                    <p className="font-medium text-gray-900 dark:text-white">{item.previouslyReceived}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Remaining</p>
                    <p className="font-medium text-orange-600">{item.remaining}</p>
                  </div>
                </div>
                {item.remaining > 0 && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Receiving</label>
                        <input
                          type="number"
                          min="0"
                          max={item.remaining}
                          value={item.quantityReceived}
                          onChange={(e) => handleItemChange(index, 'quantityReceived', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-navy-light rounded bg-white dark:bg-navy-light text-center text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Accepted</label>
                        <input
                          type="number"
                          min="0"
                          max={item.quantityReceived}
                          value={item.quantityAccepted}
                          onChange={(e) => handleItemChange(index, 'quantityAccepted', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-navy-light rounded bg-white dark:bg-navy-light text-center text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Rejected</label>
                        <input
                          type="number"
                          min="0"
                          max={item.quantityReceived}
                          value={item.quantityRejected}
                          onChange={(e) => handleItemChange(index, 'quantityRejected', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-navy-light rounded bg-white dark:bg-navy-light text-center text-sm"
                        />
                      </div>
                    </div>
                    {item.quantityRejected > 0 && (
                      <input
                        type="text"
                        value={item.rejectionReason}
                        onChange={(e) => handleReasonChange(index, e.target.value)}
                        placeholder="Rejection reason"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-navy-light rounded bg-white dark:bg-navy-light text-sm"
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white dark:bg-navy rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Receiving Summary</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-navy-light rounded-lg">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalReceiving}</p>
              <p className="text-sm text-gray-500">Total Receiving</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{totalAccepted}</p>
              <p className="text-sm text-gray-500">Accepted</p>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{totalRejected}</p>
              <p className="text-sm text-gray-500">Rejected</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Receiving Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any notes about this delivery..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-navy-light rounded-lg bg-white dark:bg-navy-light text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(`/admin/purchase-orders/${id}`)}
            className="px-4 py-2 border border-gray-300 dark:border-navy-light rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-light text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || totalReceiving === 0}
            className="px-6 py-2 bg-safety text-white rounded-lg hover:bg-safety/90 text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Processing...' : 'Confirm Receipt'}
          </button>
        </div>
      </form>
    </div>
  )
}
