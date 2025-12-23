import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Upload, CheckCircle, AlertCircle, FileText, ArrowLeft } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' ? 'http://localhost:3016/api/v1' : `${window.location.origin}/api/v1`
)

export default function OrderPayment() {
  const { orderNumber } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)

  useEffect(() => {
    fetchOrder()
  }, [orderNumber])

  const fetchOrder = async () => {
    try {
      const res = await fetch(`${API_URL}/orders/lookup/${orderNumber}`)
      if (res.ok) {
        const data = await res.json()
        setOrder(data)
        if (data.popFile) {
          setUploadSuccess(true)
        }
      } else {
        setError('Order not found. Please check the order number.')
      }
    } catch (err) {
      setError('Failed to load order details.')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB')
        return
      }
      setSelectedFile(file)
      setError('')
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !order) return

    setUploading(true)
    setError('')

    const formData = new FormData()
    formData.append('popFile', selectedFile)

    try {
      const res = await fetch(`${API_URL}/orders/${order.id}/pop`, {
        method: 'POST',
        body: formData
      })

      if (res.ok) {
        setUploadSuccess(true)
        setSelectedFile(null)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to upload proof of payment')
      }
    } catch (err) {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount || 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-safety"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft size={20} />
          Back to website
        </Link>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-navy to-industrial px-6 py-8 text-white text-center">
            <FileText size={48} className="mx-auto mb-4 opacity-80" />
            <h1 className="text-2xl font-bold">Order Payment</h1>
            <p className="opacity-80">Upload your proof of payment</p>
          </div>

          {error && !order && (
            <div className="p-6">
              <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-xl">
                <AlertCircle size={24} />
                <p>{error}</p>
              </div>
            </div>
          )}

          {order && (
            <div className="p-6 space-y-6">
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h2 className="font-semibold text-gray-900 mb-3">Order Details</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Order Number</span>
                    <span className="font-medium text-gray-900">{order.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {order.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="font-semibold text-gray-900">Total Amount</span>
                    <span className="font-bold text-safety text-lg">{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>

              {/* Banking Details */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h2 className="font-semibold text-blue-900 mb-3">Banking Details</h2>
                <div className="space-y-1 text-sm">
                  <p><span className="text-blue-700">Bank:</span> <strong>First National Bank (FNB)</strong></p>
                  <p><span className="text-blue-700">Account Name:</span> <strong>Batlokoa Innovative Projects</strong></p>
                  <p><span className="text-blue-700">Account Number:</span> <strong>62000000000</strong></p>
                  <p><span className="text-blue-700">Branch Code:</span> <strong>250655</strong></p>
                  <p><span className="text-blue-700">Reference:</span> <strong>{order.orderNumber}</strong></p>
                </div>
              </div>

              {/* Upload Section */}
              {uploadSuccess || order.popFile ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <CheckCircle size={32} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {order.popVerified ? 'Payment Verified' : 'Proof of Payment Uploaded'}
                  </h3>
                  <p className="text-gray-500">
                    {order.popVerified
                      ? 'Thank you! Your payment has been verified.'
                      : 'Thank you! We will verify your payment shortly.'}
                  </p>
                </div>
              ) : (
                <div>
                  <h2 className="font-semibold text-gray-900 mb-3">Upload Proof of Payment</h2>

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg mb-4 text-sm">
                      <AlertCircle size={16} />
                      {error}
                    </div>
                  )}

                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-safety transition-colors">
                    <input
                      type="file"
                      id="pop-upload"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="pop-upload" className="cursor-pointer block">
                      <Upload size={32} className="mx-auto mb-3 text-gray-400" />
                      {selectedFile ? (
                        <p className="text-gray-900 font-medium">{selectedFile.name}</p>
                      ) : (
                        <>
                          <p className="text-gray-600 mb-1">Click to upload or drag and drop</p>
                          <p className="text-sm text-gray-400">PNG, JPG or PDF up to 10MB</p>
                        </>
                      )}
                    </label>
                  </div>

                  {selectedFile && (
                    <button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="w-full mt-4 px-4 py-3 bg-safety text-white rounded-xl font-semibold hover:bg-safety-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {uploading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={20} />
                          Upload Proof of Payment
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Need help? Contact us at:</p>
          <p className="font-medium">073 974 8317 | info@batlokoainnovpro.co.za</p>
        </div>
      </div>
    </div>
  )
}
