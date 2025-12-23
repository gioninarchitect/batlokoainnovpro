import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' ? 'http://localhost:3016/api/v1' : `${window.location.origin}/api/v1`
)

export default function Suppliers() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 })

  useEffect(() => {
    fetchSuppliers()
  }, [pagination.page, activeFilter])

  const fetchSuppliers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(search && { search }),
        ...(activeFilter && { isActive: activeFilter }),
      })
      const res = await fetch(`${API_URL}/suppliers?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setSuppliers(data.suppliers)
        setPagination(data.pagination)
      }
    } catch (err) {
      console.error('Failed to fetch suppliers:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPagination((p) => ({ ...p, page: 1 }))
    fetchSuppliers()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Suppliers</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your suppliers</p>
        </div>
        <Link
          to="/admin/suppliers/new"
          className="inline-flex items-center px-4 py-2 bg-safety text-white rounded-lg hover:bg-safety/90 text-sm font-medium"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Supplier
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-navy rounded-xl shadow-sm p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search suppliers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-navy-light rounded-lg bg-white dark:bg-navy-light text-gray-900 dark:text-white text-sm"
            />
          </div>
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-navy-light rounded-lg bg-white dark:bg-navy-light text-gray-900 dark:text-white text-sm"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-industrial text-white rounded-lg hover:bg-industrial/90 text-sm"
          >
            Search
          </button>
        </form>
      </div>

      {/* Suppliers List */}
      <div className="bg-white dark:bg-navy rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-safety"></div>
          </div>
        ) : suppliers.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-navy-light">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Supplier</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Terms</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Orders</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-navy-light">
                  {suppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-gray-50 dark:hover:bg-navy-light">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{supplier.name}</p>
                          <p className="text-sm text-gray-500">{supplier.code}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm">
                          <p className="text-gray-900 dark:text-white">{supplier.contactPerson || '-'}</p>
                          <p className="text-gray-500">{supplier.email || supplier.phone || '-'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          <p>{supplier.paymentTerms} days</p>
                          <p>Lead: {supplier.leadTime} days</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm">
                          <p className="text-gray-900 dark:text-white">{supplier._count?.purchaseOrders || 0} POs</p>
                          <p className="text-gray-500">R{Number(supplier.totalSpent || 0).toFixed(2)}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          supplier.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {supplier.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/suppliers/${supplier.id}`}
                            className="p-2 text-gray-400 hover:text-industrial"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          <Link
                            to={`/admin/purchase-orders/new?supplier=${supplier.id}`}
                            className="p-2 text-gray-400 hover:text-safety"
                            title="Create PO"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-200 dark:divide-navy-light">
              {suppliers.map((supplier) => (
                <Link
                  key={supplier.id}
                  to={`/admin/suppliers/${supplier.id}`}
                  className="block p-4 hover:bg-gray-50 dark:hover:bg-navy-light"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{supplier.name}</p>
                      <p className="text-sm text-gray-500">{supplier.code}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      supplier.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {supplier.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{supplier.contactPerson || supplier.email || '-'}</span>
                    <span>{supplier._count?.purchaseOrders || 0} POs</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-navy-light flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                    disabled={pagination.page <= 1}
                    className="px-3 py-1 border border-gray-300 dark:border-navy-light rounded text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                    disabled={pagination.page >= pagination.pages}
                    className="px-3 py-1 border border-gray-300 dark:border-navy-light rounded text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No suppliers found</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first supplier.</p>
            <Link
              to="/admin/suppliers/new"
              className="inline-flex items-center px-4 py-2 bg-safety text-white rounded-lg hover:bg-safety/90"
            >
              Add Supplier
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
