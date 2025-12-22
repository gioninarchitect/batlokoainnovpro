import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' ? 'http://localhost:3016/api/v1' : `${window.location.origin}/api/v1`
)

export default function Dashboard() {
  const { token } = useAuth()
  const [stats, setStats] = useState({
    orders: { total: 0, pending: 0, processing: 0, completed: 0, revenue: 0, pendingPOP: 0 },
    invoices: { total: 0, paid: 0, unpaid: 0, overdue: 0, totalAmount: 0 },
    products: { total: 0, lowStock: 0 },
    customers: { total: 0 },
    quotes: { pending: 0, expiringSoon: 0 }
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [pendingQuotes, setPendingQuotes] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` }

      const [orderStatsRes, invoiceStatsRes, productsRes, customersRes, ordersRes, quotesRes] = await Promise.all([
        fetch(`${API_URL}/orders/stats`, { headers }),
        fetch(`${API_URL}/invoices/stats`, { headers }),
        fetch(`${API_URL}/products?limit=1`, { headers }),
        fetch(`${API_URL}/customers?limit=1`, { headers }),
        fetch(`${API_URL}/orders?limit=5&sortBy=createdAt&sortOrder=desc`, { headers }),
        fetch(`${API_URL}/quotes?status=PENDING&limit=10`, { headers })
      ])

      const [orderStats, invoiceStats, products, customers, orders, quotes] = await Promise.all([
        orderStatsRes.ok ? orderStatsRes.json() : {},
        invoiceStatsRes.ok ? invoiceStatsRes.json() : {},
        productsRes.ok ? productsRes.json() : { pagination: { total: 0 } },
        customersRes.ok ? customersRes.json() : { pagination: { total: 0 } },
        ordersRes.ok ? ordersRes.json() : { orders: [] },
        quotesRes.ok ? quotesRes.json() : { quotes: [], total: 0 }
      ])

      // Fetch low stock separately
      const lowStockRes = await fetch(`${API_URL}/products/low-stock`, { headers })
      const lowStock = lowStockRes.ok ? await lowStockRes.json() : { products: [] }

      // Calculate expiring quotes (within 7 days)
      const now = new Date()
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const expiringQuotes = (quotes.quotes || []).filter(q => {
        const validUntil = new Date(q.validUntil)
        return validUntil <= sevenDaysLater && validUntil >= now
      })

      setStats({
        orders: { ...orderStats, pendingPOP: orderStats.pendingPOP || 0 },
        invoices: invoiceStats.stats || {},
        products: {
          total: products.pagination?.total || 0,
          lowStock: lowStock.products?.length || 0
        },
        customers: {
          total: customers.pagination?.total || 0
        },
        quotes: {
          pending: quotes.total || 0,
          expiringSoon: expiringQuotes.length
        }
      })

      setPendingQuotes(quotes.quotes || [])
      setRecentOrders(orders.orders || [])

      // Build alerts
      const newAlerts = []
      if (orderStats.pendingPOP > 0) {
        newAlerts.push({ type: 'warning', icon: 'payment', message: `${orderStats.pendingPOP} POP awaiting verification`, link: '/admin/orders?status=AWAITING_PAYMENT' })
      }
      if (expiringQuotes.length > 0) {
        newAlerts.push({ type: 'info', icon: 'clock', message: `${expiringQuotes.length} quotes expiring soon`, link: '/admin/quotes' })
      }
      if ((lowStock.products?.length || 0) > 0) {
        newAlerts.push({ type: 'error', icon: 'stock', message: `${lowStock.products.length} products low on stock`, link: '/admin/products?filter=low-stock' })
      }
      if ((invoiceStats.stats?.overdue || 0) > 0) {
        newAlerts.push({ type: 'error', icon: 'invoice', message: `${invoiceStats.stats.overdue} overdue invoices`, link: '/admin/invoices?status=OVERDUE' })
      }
      setAlerts(newAlerts)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount || 0)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      PROCESSING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      SHIPPED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      DELIVERED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-safety"></div>
      </div>
    )
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

  return (
    <div className="space-y-6">
      {/* Alerts Panel */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, idx) => (
            <Link
              key={idx}
              to={alert.link}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                alert.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100' :
                alert.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100' :
                'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100'
              }`}
            >
              {alert.icon === 'payment' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              )}
              {alert.icon === 'clock' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {alert.icon === 'stock' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              )}
              {alert.icon === 'invoice' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              <span className="font-medium text-sm">{alert.message}</span>
              <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="bg-white dark:bg-navy rounded-xl p-4 sm:p-6 shadow-card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Revenue</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(stats.orders.revenue)}
              </p>
            </div>
          </div>
        </div>

        {/* Orders */}
        <div className="bg-white dark:bg-navy rounded-xl p-4 sm:p-6 shadow-card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Orders</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                {stats.orders.total || 0}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs text-gray-500 dark:text-gray-400">
            <span className="text-yellow-500">{stats.orders.pending || 0} pending</span>
            <span className="mx-2">|</span>
            <span className="text-blue-500">{stats.orders.processing || 0} processing</span>
          </div>
        </div>

        {/* Customers */}
        <div className="bg-white dark:bg-navy rounded-xl p-4 sm:p-6 shadow-card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Customers</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                {stats.customers.total}
              </p>
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="bg-white dark:bg-navy rounded-xl p-4 sm:p-6 shadow-card">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Products</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                {stats.products.total}
              </p>
            </div>
          </div>
          {stats.products.lowStock > 0 && (
            <div className="mt-3">
              <Link to="/admin/products?filter=low-stock" className="text-xs text-safety hover:underline">
                {stats.products.lowStock} low stock items
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Stats */}
      <div className="bg-white dark:bg-navy rounded-xl p-4 sm:p-6 shadow-card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Invoice Overview</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.invoices.total || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Invoices</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{stats.invoices.paid || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Paid</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-600">{stats.invoices.unpaid || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Unpaid</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">{stats.invoices.overdue || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Overdue</p>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white dark:bg-navy rounded-xl shadow-card overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-navy-light flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Orders</h3>
          <Link
            to="/admin/orders"
            className="text-sm text-safety hover:text-safety-dark font-medium"
          >
            View all
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No orders yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-navy-light">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase hidden sm:table-cell">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-navy-light">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-navy-light">
                    <td className="px-4 py-4">
                      <Link to={`/admin/orders/${order.id}`} className="text-sm font-medium text-industrial dark:text-industrial-light hover:underline">
                        #{order.orderNumber}
                      </Link>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <p className="text-sm text-gray-900 dark:text-white">{order.customer?.firstName} {order.customer?.lastName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{order.customer?.company || '-'}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(order.total)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Quotes - Follow Up */}
      {pendingQuotes.length > 0 && (
        <div className="bg-white dark:bg-navy rounded-xl shadow-card overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-navy-light flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pending Quotes - Follow Up</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{pendingQuotes.length} quote{pendingQuotes.length !== 1 ? 's' : ''} awaiting response</p>
            </div>
            <Link
              to="/admin/quotes?status=PENDING"
              className="text-sm text-safety hover:text-safety-dark font-medium"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-navy-light">
            {pendingQuotes.slice(0, 5).map((quote) => {
              const daysSinceCreated = Math.floor((new Date() - new Date(quote.createdAt)) / (1000 * 60 * 60 * 24))
              const daysUntilExpiry = Math.floor((new Date(quote.validUntil) - new Date()) / (1000 * 60 * 60 * 24))
              const isUrgent = daysUntilExpiry <= 3
              const needsFollowUp = daysSinceCreated >= 2

              return (
                <div key={quote.id} className={`p-4 ${needsFollowUp ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link to={`/admin/quotes/${quote.id}`} className="font-medium text-industrial dark:text-industrial-light hover:underline">
                          #{quote.quoteNumber}
                        </Link>
                        {needsFollowUp && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">
                            Follow up
                          </span>
                        )}
                        {isUrgent && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                            Expires in {daysUntilExpiry}d
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-900 dark:text-white mt-0.5">
                        {quote.customerName || `${quote.customer?.firstName || ''} ${quote.customer?.lastName || ''}`.trim() || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatCurrency(quote.total)} - Created {daysSinceCreated === 0 ? 'today' : `${daysSinceCreated}d ago`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {(quote.customerPhone || quote.customer?.phone) && (
                        <>
                          <button
                            onClick={() => openWhatsApp(quote.customerPhone || quote.customer?.phone, quote.customerName || quote.customer?.firstName || 'there')}
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title="WhatsApp"
                          >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => makeCall(quote.customerPhone || quote.customer?.phone)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Call"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </button>
                        </>
                      )}
                      {(quote.customerEmail || quote.customer?.email) && (
                        <button
                          onClick={() => sendEmail(quote.customerEmail || quote.customer?.email, quote.customerName || quote.customer?.firstName || 'there')}
                          className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                          title="Email"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </button>
                      )}
                      <Link
                        to={`/admin/quotes/${quote.id}`}
                        className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-navy-light rounded-lg transition-colors"
                        title="View Quote"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link
          to="/admin/orders/new"
          className="flex flex-col items-center p-4 bg-white dark:bg-navy rounded-xl shadow-card hover:shadow-card-hover transition-shadow"
        >
          <div className="p-3 bg-safety/10 rounded-full mb-2">
            <svg className="w-6 h-6 text-safety" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">New Order</span>
        </Link>

        <Link
          to="/admin/quotes/new"
          className="flex flex-col items-center p-4 bg-white dark:bg-navy rounded-xl shadow-card hover:shadow-card-hover transition-shadow"
        >
          <div className="p-3 bg-industrial/10 rounded-full mb-2">
            <svg className="w-6 h-6 text-industrial" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">New Quote</span>
        </Link>

        <Link
          to="/admin/customers/new"
          className="flex flex-col items-center p-4 bg-white dark:bg-navy rounded-xl shadow-card hover:shadow-card-hover transition-shadow"
        >
          <div className="p-3 bg-purple-500/10 rounded-full mb-2">
            <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">New Customer</span>
        </Link>

        <Link
          to="/admin/products/new"
          className="flex flex-col items-center p-4 bg-white dark:bg-navy rounded-xl shadow-card hover:shadow-card-hover transition-shadow"
        >
          <div className="p-3 bg-orange-500/10 rounded-full mb-2">
            <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">New Product</span>
        </Link>
      </div>
    </div>
  )
}
