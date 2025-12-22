import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' ? 'http://localhost:3016/api/v1' : `${window.location.origin}/api/v1`
)

export default function Products() {
  const { token } = useAuth()
  const [searchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 })
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [search, setSearch] = useState('')
  const [showLowStock, setShowLowStock] = useState(searchParams.get('filter') === 'low-stock')
  const [editingStock, setEditingStock] = useState(null)
  const [stockValue, setStockValue] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    if (showLowStock) {
      fetchLowStock()
    } else {
      fetchProducts()
    }
  }, [pagination.page, categoryFilter, showLowStock])

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/categories`)
      const data = await res.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        sortBy: 'name',
        sortOrder: 'asc'
      })
      if (categoryFilter) params.append('categoryId', categoryFilter)
      if (search) params.append('search', search)

      const res = await fetch(`${API_URL}/products?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setProducts(data.products || [])
      setPagination(prev => ({ ...prev, total: data.pagination?.total || 0 }))
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLowStock = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/products/low-stock`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setProducts(data.products || [])
      setPagination(prev => ({ ...prev, total: data.products?.length || 0 }))
    } catch (error) {
      console.error('Failed to fetch low stock:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStock = async (productId) => {
    try {
      await fetch(`${API_URL}/products/${productId}/stock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: parseInt(stockValue) })
      })
      setEditingStock(null)
      setStockValue('')
      showLowStock ? fetchLowStock() : fetchProducts()
    } catch (error) {
      console.error('Failed to update stock:', error)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount || 0)
  }

  const totalPages = Math.ceil(pagination.total / pagination.limit)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{pagination.total} products</p>
        </div>
        <Link
          to="/admin/products/new"
          className="inline-flex items-center justify-center px-4 py-2 bg-safety text-white rounded-lg hover:bg-safety-dark transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-safety focus:border-transparent"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy text-gray-900 dark:text-white focus:ring-2 focus:ring-safety focus:border-transparent"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <button
          onClick={() => setShowLowStock(!showLowStock)}
          className={`px-4 py-2 rounded-lg border transition-colors ${
            showLowStock
              ? 'bg-safety text-white border-safety'
              : 'border-gray-300 dark:border-navy-light text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-light'
          }`}
        >
          Low Stock
        </button>
      </div>

      {/* Products Grid/Table */}
      <div className="bg-white dark:bg-navy rounded-xl shadow-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-safety"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No products found
          </div>
        ) : (
          <>
            {/* Mobile View */}
            <div className="sm:hidden divide-y divide-gray-200 dark:divide-navy-light">
              {products.map((product) => (
                <div key={product.id} className="p-4">
                  <div className="flex gap-3">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-navy-light rounded-lg flex-shrink-0 overflow-hidden">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to={`/admin/products/${product.id}`} className="font-medium text-gray-900 dark:text-white hover:text-safety truncate block">
                        {product.name}
                      </Link>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{product.sku}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(product.price)}</span>
                        <span className={`text-sm ${product.stockQty <= product.lowStockThreshold ? 'text-red-500' : 'text-green-500'}`}>
                          Stock: {product.stockQty}
                        </span>
                      </div>
                    </div>
                  </div>
                  {editingStock === product.id ? (
                    <div className="mt-3 flex gap-2">
                      <input
                        type="number"
                        value={stockValue}
                        onChange={(e) => setStockValue(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light"
                        placeholder="New stock qty"
                      />
                      <button
                        onClick={() => handleUpdateStock(product.id)}
                        className="px-3 py-2 bg-safety text-white text-sm rounded-lg"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setEditingStock(null); setStockValue(''); }}
                        className="px-3 py-2 border border-gray-300 dark:border-navy-light text-sm rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingStock(product.id); setStockValue(product.stockQty); }}
                      className="mt-3 w-full px-3 py-2 text-sm border border-gray-300 dark:border-navy-light rounded-lg hover:bg-gray-100 dark:hover:bg-navy-light"
                    >
                      Update Stock
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-navy-light">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Category</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Price</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Stock</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-navy-light">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-navy-light">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 dark:bg-navy-light rounded-lg flex-shrink-0 overflow-hidden">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div>
                            <Link to={`/admin/products/${product.id}`} className="text-sm font-medium text-gray-900 dark:text-white hover:text-safety">
                              {product.name}
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">{product.sku}</td>
                      <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">{product.category?.name || '-'}</td>
                      <td className="px-4 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(product.price)}</td>
                      <td className="px-4 py-4 text-right">
                        {editingStock === product.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <input
                              type="number"
                              value={stockValue}
                              onChange={(e) => setStockValue(e.target.value)}
                              className="w-20 px-2 py-1 text-sm rounded border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light"
                            />
                            <button
                              onClick={() => handleUpdateStock(product.id)}
                              className="text-sm text-green-600 hover:text-green-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => { setEditingStock(null); setStockValue(''); }}
                              className="text-sm text-gray-500 hover:text-gray-700"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingStock(product.id); setStockValue(product.stockQty); }}
                            className={`text-sm font-medium ${
                              product.stockQty <= product.lowStockThreshold
                                ? 'text-red-500 hover:text-red-600'
                                : 'text-gray-900 dark:text-white hover:text-safety'
                            }`}
                          >
                            {product.stockQty}
                            {product.stockQty <= product.lowStockThreshold && (
                              <span className="ml-1 text-xs">(Low)</span>
                            )}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link
                          to={`/admin/products/${product.id}`}
                          className="text-sm text-safety hover:text-safety-dark"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!showLowStock && totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-navy-light flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Page {pagination.page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 text-sm rounded-lg border border-gray-300 dark:border-navy-light disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-navy-light"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === totalPages}
                    className="px-3 py-1 text-sm rounded-lg border border-gray-300 dark:border-navy-light disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-navy-light"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
