import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCustomerAuth } from '@/context/CustomerAuthContext'
import { useTheme } from '@/context/ThemeContext'

const API_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' ? 'http://localhost:3016/api/v1' : `${window.location.origin}/api/v1`
)

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  DISPATCHED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  SENT: 'bg-blue-100 text-blue-800',
  VIEWED: 'bg-purple-100 text-purple-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-gray-100 text-gray-800',
  OVERDUE: 'bg-red-100 text-red-800',
  PARTIAL: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
}

export default function Dashboard() {
  const { customer, token } = useCustomerAuth()
  const { darkMode } = useTheme()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`${API_URL}/portal/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const result = await res.json()
        setData(result)
      } else {
        setError('Failed to load dashboard')
      }
    } catch (err) {
      setError('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-safety"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        {error}
      </div>
    )
  }

  const customerName = customer?.company || `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim() || 'Customer'

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-industrial to-navy rounded-xl p-6 text-white">
        <h1 className="text-xl sm:text-2xl font-bold">Welcome back, {customerName}</h1>
        <p className="text-white/80 mt-1 text-sm sm:text-base">Here's an overview of your account</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`rounded-xl p-4 sm:p-6 shadow-sm ${darkMode ? 'bg-navy' : 'bg-white'}`}>
          <div className="flex items-center">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${darkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-3 sm:ml-4">
              <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Orders</p>
              <p className={`text-lg sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{data?.stats?.totalOrders || 0}</p>
            </div>
          </div>
        </div>

        <div className={`rounded-xl p-4 sm:p-6 shadow-sm ${darkMode ? 'bg-navy' : 'bg-white'}`}>
          <div className="flex items-center">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${darkMode ? 'bg-yellow-900/50' : 'bg-yellow-100'}`}>
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3 sm:ml-4">
              <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>In Progress</p>
              <p className={`text-lg sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{data?.stats?.pendingOrders || 0}</p>
            </div>
          </div>
        </div>

        <div className={`rounded-xl p-4 sm:p-6 shadow-sm ${darkMode ? 'bg-navy' : 'bg-white'}`}>
          <div className="flex items-center">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${darkMode ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-3 sm:ml-4">
              <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Quotes</p>
              <p className={`text-lg sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{data?.stats?.totalQuotes || 0}</p>
            </div>
          </div>
        </div>

        <div className={`rounded-xl p-4 sm:p-6 shadow-sm ${darkMode ? 'bg-navy' : 'bg-white'}`}>
          <div className="flex items-center">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${darkMode ? 'bg-red-900/50' : 'bg-red-100'}`}>
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3 sm:ml-4">
              <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Unpaid</p>
              <p className={`text-lg sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{data?.stats?.unpaidInvoices || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders and Pending Quotes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className={`rounded-xl shadow-sm ${darkMode ? 'bg-navy' : 'bg-white'}`}>
          <div className={`p-4 sm:p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between">
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Recent Orders</h2>
              <Link to="/portal/orders" className="text-sm text-industrial hover:underline">
                View all
              </Link>
            </div>
          </div>
          <div className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
            {data?.recentOrders?.length > 0 ? (
              data.recentOrders.map((order) => (
                <Link
                  key={order.id}
                  to={`/portal/orders/${order.id}`}
                  className={`flex items-center justify-between p-4 ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}
                >
                  <div>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{order.orderNumber}</p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>R{Number(order.total).toFixed(2)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                      {order.status}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className={`p-6 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <p>No orders yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Pending Quotes */}
        <div className={`rounded-xl shadow-sm ${darkMode ? 'bg-navy' : 'bg-white'}`}>
          <div className={`p-4 sm:p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between">
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Pending Quotes</h2>
              <Link to="/portal/quotes" className="text-sm text-industrial hover:underline">
                View all
              </Link>
            </div>
          </div>
          <div className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
            {data?.recentQuotes?.length > 0 ? (
              data.recentQuotes.map((quote) => (
                <Link
                  key={quote.id}
                  to={`/portal/quotes/${quote.id}`}
                  className={`flex items-center justify-between p-4 ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}
                >
                  <div>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{quote.quoteNumber}</p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Valid until: {new Date(quote.validUntil).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>R{Number(quote.total).toFixed(2)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[quote.status] || 'bg-gray-100 text-gray-800'}`}>
                      {quote.status}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className={`p-6 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <p>No pending quotes</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Unpaid Invoices Alert */}
      {data?.unpaidInvoices?.length > 0 && (
        <div className={`rounded-xl shadow-sm ${darkMode ? 'bg-navy' : 'bg-white'}`}>
          <div className={`p-4 sm:p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${darkMode ? 'bg-red-900/50' : 'bg-red-100'}`}>
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Outstanding Invoices</h2>
              </div>
              <Link to="/portal/invoices" className="text-sm text-industrial hover:underline">
                View all
              </Link>
            </div>
          </div>
          <div className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
            {data.unpaidInvoices.map((invoice) => (
              <Link
                key={invoice.id}
                to={`/portal/invoices/${invoice.id}`}
                className={`flex items-center justify-between p-4 ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}
              >
                <div>
                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{invoice.invoiceNumber}</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Due: {new Date(invoice.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-red-600">R{Number(invoice.balance).toFixed(2)}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColors[invoice.status] || 'bg-gray-100 text-gray-800'}`}>
                    {invoice.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className={`rounded-xl shadow-sm p-4 sm:p-6 ${darkMode ? 'bg-navy' : 'bg-white'}`}>
        <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            to="/portal/orders"
            className={`flex flex-col items-center p-4 border rounded-lg hover:border-safety hover:bg-safety/5 transition-colors ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
          >
            <svg className={`w-8 h-8 mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Track Orders</span>
          </Link>
          <Link
            to="/portal/quotes"
            className={`flex flex-col items-center p-4 border rounded-lg hover:border-safety hover:bg-safety/5 transition-colors ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
          >
            <svg className={`w-8 h-8 mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>View Quotes</span>
          </Link>
          <Link
            to="/portal/invoices"
            className={`flex flex-col items-center p-4 border rounded-lg hover:border-safety hover:bg-safety/5 transition-colors ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
          >
            <svg className={`w-8 h-8 mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Invoices</span>
          </Link>
          <Link
            to="/portal/profile"
            className={`flex flex-col items-center p-4 border rounded-lg hover:border-safety hover:bg-safety/5 transition-colors ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
          >
            <svg className={`w-8 h-8 mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>My Profile</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
