import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' ? 'http://localhost:3016/api/v1' : `${window.location.origin}/api/v1`
)

export default function Customers() {
  const { token } = useAuth()
  const [customers, setCustomers] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    province: '',
    postalCode: ''
  })
  const [saving, setSaving] = useState(false)

  // Calculate customer tags and lead score
  const getCustomerTags = (customer) => {
    const tags = []
    const now = new Date()
    const createdAt = new Date(customer.createdAt)
    const daysSinceCreated = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24))

    // New customer (less than 30 days)
    if (daysSinceCreated <= 30) {
      tags.push({ label: 'New', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' })
    }

    // VIP (high value or many orders)
    if ((customer._count?.orders || 0) >= 5 || (customer.totalSpent || 0) >= 50000) {
      tags.push({ label: 'VIP', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' })
    }

    // Repeat customer
    if ((customer._count?.orders || 0) >= 2) {
      tags.push({ label: 'Repeat', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' })
    }

    // Industry tag based on company name
    if (customer.company) {
      const company = customer.company.toLowerCase()
      if (company.includes('mining') || company.includes('mine')) {
        tags.push({ label: 'Mining', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' })
      } else if (company.includes('construction') || company.includes('build')) {
        tags.push({ label: 'Construction', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' })
      } else if (company.includes('engineering') || company.includes('tech')) {
        tags.push({ label: 'Engineering', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' })
      }
    }

    return tags
  }

  // Calculate lead score (0-100)
  const getLeadScore = (customer) => {
    let score = 0

    // Orders count (max 30 points)
    score += Math.min((customer._count?.orders || 0) * 10, 30)

    // Total spent (max 30 points)
    const spent = customer.totalSpent || 0
    if (spent >= 100000) score += 30
    else if (spent >= 50000) score += 25
    else if (spent >= 20000) score += 20
    else if (spent >= 10000) score += 15
    else if (spent >= 5000) score += 10
    else if (spent > 0) score += 5

    // Quotes (max 20 points)
    score += Math.min((customer._count?.quotes || 0) * 5, 20)

    // Has company (10 points)
    if (customer.company) score += 10

    // Recency (max 10 points)
    if (customer.lastOrderDate) {
      const daysSinceOrder = Math.floor((new Date() - new Date(customer.lastOrderDate)) / (1000 * 60 * 60 * 24))
      if (daysSinceOrder <= 30) score += 10
      else if (daysSinceOrder <= 60) score += 7
      else if (daysSinceOrder <= 90) score += 5
      else if (daysSinceOrder <= 180) score += 2
    }

    return Math.min(score, 100)
  }

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400'
    if (score >= 40) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400'
    return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400'
  }

  // Quick action handlers
  const openWhatsApp = (phone, name) => {
    const cleanPhone = phone.replace(/\D/g, '').replace(/^0/, '27')
    window.open(`https://wa.me/${cleanPhone}?text=Hi ${name}, following up from Batlokoa Innovative Projects.`, '_blank')
  }

  const makeCall = (phone) => {
    window.open(`tel:${phone}`, '_self')
  }

  const sendEmail = (email, name) => {
    window.open(`mailto:${email}?subject=Follow-up from Batlokoa Innovative Projects&body=Hi ${name},`, '_blank')
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount || 0)
  }

  useEffect(() => {
    fetchCustomers()
  }, [pagination.page])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })

      const res = await fetch(`${API_URL}/customers?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setCustomers(data.customers || [])
      setPagination(prev => ({ ...prev, total: data.pagination?.total || 0 }))
    } catch (error) {
      console.error('Failed to fetch customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!search.trim()) {
      fetchCustomers()
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/customers/search?q=${encodeURIComponent(search)}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setCustomers(data.customers || [])
      setPagination(prev => ({ ...prev, total: data.customers?.length || 0 }))
    } catch (error) {
      console.error('Failed to search customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCustomer = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`${API_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setShowAddModal(false)
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          company: '',
          address: '',
          city: '',
          province: '',
          postalCode: ''
        })
        fetchCustomers()
      }
    } catch (error) {
      console.error('Failed to add customer:', error)
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const totalPages = Math.ceil(pagination.total / pagination.limit)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{pagination.total} customers</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center px-4 py-2 bg-safety text-white rounded-lg hover:bg-safety-dark transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Customer
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search customers by name, email, phone, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-safety focus:border-transparent"
          />
        </div>
        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy text-gray-900 dark:text-white focus:ring-2 focus:ring-safety focus:border-transparent"
        >
          <option value="">All Customers</option>
          <option value="vip">VIP</option>
          <option value="new">New (30 days)</option>
          <option value="repeat">Repeat</option>
          <option value="mining">Mining</option>
          <option value="construction">Construction</option>
          <option value="engineering">Engineering</option>
        </select>
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-industrial text-white rounded-lg hover:bg-industrial-dark transition-colors"
        >
          Search
        </button>
      </div>

      {/* Customers List */}
      <div className="bg-white dark:bg-navy rounded-xl shadow-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-safety"></div>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No customers found
          </div>
        ) : (
          <>
            {/* Mobile View */}
            <div className="sm:hidden divide-y divide-gray-200 dark:divide-navy-light">
              {customers.map((customer) => {
                const tags = getCustomerTags(customer)
                const score = getLeadScore(customer)
                return (
                  <div key={customer.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-industrial flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-medium">
                          {customer.firstName?.charAt(0)}{customer.lastName?.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Link to={`/admin/customers/${customer.id}`} className="font-medium text-gray-900 dark:text-white hover:text-safety">
                            {customer.firstName} {customer.lastName}
                          </Link>
                          <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full ${getScoreColor(score)}`}>
                            {score}
                          </span>
                        </div>
                        {customer.company && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">{customer.company}</p>
                        )}
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {tags.map((tag, idx) => (
                              <span key={idx} className={`px-2 py-0.5 text-xs font-medium rounded-full ${tag.color}`}>
                                {tag.label}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span>{customer._count?.orders || 0} orders</span>
                          <span>{formatCurrency(customer.totalSpent || 0)}</span>
                        </div>
                      </div>
                    </div>
                    {/* Quick Actions */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-navy-light">
                      {customer.phone && (
                        <>
                          <button
                            onClick={() => openWhatsApp(customer.phone, customer.firstName)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            WhatsApp
                          </button>
                          <button
                            onClick={() => makeCall(customer.phone)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            Call
                          </button>
                        </>
                      )}
                      <Link
                        to={`/admin/customers/${customer.id}`}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 dark:bg-navy-light dark:text-gray-300 rounded-lg"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-navy-light">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tags</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Score</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Orders</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Contact</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-navy-light">
                  {customers.map((customer) => {
                    const tags = getCustomerTags(customer)
                    const score = getLeadScore(customer)
                    return (
                      <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-navy-light">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-industrial flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-medium text-sm">
                                {customer.firstName?.charAt(0)}{customer.lastName?.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {customer.firstName} {customer.lastName}
                              </p>
                              {customer.company && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">{customer.company}</p>
                              )}
                              <p className="text-xs text-gray-400 dark:text-gray-500">{customer.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-1">
                            {tags.map((tag, idx) => (
                              <span key={idx} className={`px-2 py-0.5 text-xs font-medium rounded-full ${tag.color}`}>
                                {tag.label}
                              </span>
                            ))}
                            {tags.length === 0 && <span className="text-xs text-gray-400">-</span>}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-flex items-center justify-center w-8 h-8 text-xs font-bold rounded-full ${getScoreColor(score)}`}>
                            {score}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-gray-900 dark:text-white">{customer._count?.orders || 0} orders</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formatCurrency(customer.totalSpent || 0)}</p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1">
                            {customer.phone && (
                              <>
                                <button
                                  onClick={() => openWhatsApp(customer.phone, customer.firstName)}
                                  className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                                  title="WhatsApp"
                                >
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                  </svg>
                                </button>
                                <button
                                  onClick={() => makeCall(customer.phone)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                  title="Call"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                </button>
                              </>
                            )}
                            {customer.email && (
                              <button
                                onClick={() => sendEmail(customer.email, customer.firstName)}
                                className="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"
                                title="Email"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Link
                            to={`/admin/customers/${customer.id}`}
                            className="text-sm text-safety hover:text-safety-dark"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
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

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-navy rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 dark:border-navy-light flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Customer</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddCustomer} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Province</label>
                  <input
                    type="text"
                    value={formData.province}
                    onChange={(e) => setFormData(prev => ({ ...prev, province: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-navy-light text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-light"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-safety text-white rounded-lg hover:bg-safety-dark disabled:opacity-50"
                >
                  {saving ? 'Adding...' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
