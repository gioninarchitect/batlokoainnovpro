import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' ? 'http://localhost:3016/api/v1' : `${window.location.origin}/api/v1`
)

export default function Reports() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30') // days
  const [data, setData] = useState({
    summary: { revenue: 0, orders: 0, customers: 0, avgOrderValue: 0 },
    revenueByMonth: [],
    topProducts: [],
    topCustomers: [],
    ordersByStatus: [],
    recentActivity: []
  })

  useEffect(() => {
    fetchReportData()
  }, [period])

  const fetchReportData = async () => {
    setLoading(true)
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const res = await fetch(`${API_URL}/reports?period=${period}`, { headers })
      if (res.ok) {
        const reportData = await res.json()
        setData(reportData)
      }
    } catch (error) {
      console.error('Failed to fetch report data:', error)
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

  const getMaxValue = (arr, key) => Math.max(...arr.map(item => item[key] || 0), 1)

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Sales Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Analytics and insights for your business</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy text-gray-900 dark:text-white"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-gray-100 dark:bg-navy-light text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-navy-light/80 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-navy rounded-xl p-4 sm:p-6 shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Revenue</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(data.summary.revenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-navy rounded-xl p-4 sm:p-6 shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Orders</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{data.summary.orders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-navy rounded-xl p-4 sm:p-6 shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">New Customers</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{data.summary.customers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-navy rounded-xl p-4 sm:p-6 shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Order Value</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(data.summary.avgOrderValue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart (Simple Bar) */}
      <div className="bg-white dark:bg-navy rounded-xl p-4 sm:p-6 shadow-card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Trend</h3>
        {data.revenueByMonth.length > 0 ? (
          <div className="flex items-end gap-2 h-48">
            {data.revenueByMonth.map((item, idx) => {
              const maxRevenue = getMaxValue(data.revenueByMonth, 'revenue')
              const height = (item.revenue / maxRevenue) * 100
              return (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center justify-end h-40">
                    <span className="text-xs text-gray-500 mb-1">{formatCurrency(item.revenue)}</span>
                    <div
                      className="w-full bg-gradient-to-t from-safety to-safety/60 rounded-t-lg transition-all hover:from-safety-dark"
                      style={{ height: `${Math.max(height, 5)}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">{item.month}</span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No revenue data for this period</p>
        )}
      </div>

      {/* Two Column Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white dark:bg-navy rounded-xl p-4 sm:p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Products</h3>
            <Link to="/admin/products" className="text-sm text-safety hover:text-safety-dark">View all</Link>
          </div>
          {data.topProducts.length > 0 ? (
            <div className="space-y-3">
              {data.topProducts.map((product, idx) => {
                const maxSold = getMaxValue(data.topProducts, 'totalSold')
                const width = (product.totalSold / maxSold) * 100
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center text-xs font-bold bg-gray-100 dark:bg-navy-light rounded-full">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
                      <div className="h-2 bg-gray-100 dark:bg-navy-light rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-industrial rounded-full"
                          style={{ width: `${width}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{product.totalSold}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(product.revenue)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No product data</p>
          )}
        </div>

        {/* Top Customers */}
        <div className="bg-white dark:bg-navy rounded-xl p-4 sm:p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Customers</h3>
            <Link to="/admin/customers" className="text-sm text-safety hover:text-safety-dark">View all</Link>
          </div>
          {data.topCustomers.length > 0 ? (
            <div className="space-y-3">
              {data.topCustomers.map((customer, idx) => {
                const maxSpent = getMaxValue(data.topCustomers, 'totalSpent')
                const width = (customer.totalSpent / maxSpent) * 100
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="w-8 h-8 flex items-center justify-center text-sm font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full">
                      {customer.name?.charAt(0) || 'C'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{customer.name || customer.companyName}</p>
                      <div className="h-2 bg-gray-100 dark:bg-navy-light rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${width}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(customer.totalSpent)}</p>
                      <p className="text-xs text-gray-500">{customer.orderCount} orders</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No customer data</p>
          )}
        </div>
      </div>

      {/* Orders by Status */}
      <div className="bg-white dark:bg-navy rounded-xl p-4 sm:p-6 shadow-card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Orders by Status</h3>
        {data.ordersByStatus.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {data.ordersByStatus.map((item, idx) => (
              <div key={idx} className="text-center p-4 bg-gray-50 dark:bg-navy-light rounded-lg">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{item.count}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{item.status?.toLowerCase().replace(/_/g, ' ')}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No order status data</p>
        )}
      </div>
    </div>
  )
}
