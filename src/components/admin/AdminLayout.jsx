import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3016/api/v1'

const menuItems = [
  { path: '/admin', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', mobileNav: true },
  { path: '/admin/orders', label: 'Orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', mobileNav: true },
  { path: '/admin/quotes', label: 'Quotes', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', mobileNav: true },
  { path: '/admin/products', label: 'Products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', mobileNav: true },
  { path: '/admin/categories', label: 'Categories', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
  { path: '/admin/customers', label: 'Customers', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', mobileNav: true },
  { path: '/admin/invoices', label: 'Invoices', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
  { path: '/admin/suppliers', label: 'Suppliers', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { path: '/admin/purchase-orders', label: 'Purchase Orders', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { path: '/admin/reports', label: 'Reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { path: '/admin/audit', label: 'Audit Log', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { path: '/admin/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
]

// Mobile bottom nav items (subset for quick access)
const mobileNavItems = menuItems.filter(item => item.mobileNav)

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const searchRef = useRef(null)
  const { user, logout } = useAuth()
  const { darkMode, toggleDarkMode } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null)
      return
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setSearchResults(data)
          setSearchOpen(true)
        }
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setSearchLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleResultClick = (type, id) => {
    setSearchOpen(false)
    setSearchQuery('')
    if (type === 'order') navigate(`/admin/orders?view=${id}`)
    else if (type === 'customer') navigate(`/admin/customers?view=${id}`)
    else if (type === 'product') navigate(`/admin/products?edit=${id}`)
    else if (type === 'quote') navigate(`/admin/quotes?view=${id}`)
    else if (type === 'invoice') navigate(`/admin/invoices?view=${id}`)
  }

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-navy-dark">
      {/* Sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - collapsed by default */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-navy transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-navy-light">
          <Link to="/admin" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-safety rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="font-heading font-bold text-navy dark:text-white">Batlokoa</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/admin' && location.pathname.startsWith(item.path))
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-safety/10 text-safety'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-light'
                  }
                `}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                </svg>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-gray-200 dark:border-navy-light p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-industrial flex items-center justify-center">
              <span className="text-white font-medium">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.role || 'Staff'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div>
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white dark:bg-navy shadow-sm">
          <div className="flex items-center justify-between h-16 px-4">
            {/* Menu button and Logo */}
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              {/* Clickable logo - always visible */}
              <Link to="/admin" className="flex items-center space-x-2 ml-2">
                <div className="w-8 h-8 bg-safety rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">B</span>
                </div>
                <span className="hidden sm:inline font-heading font-bold text-navy dark:text-white">Batlokoa</span>
              </Link>
            </div>

            {/* Global Search */}
            <div ref={searchRef} className="relative flex-1 max-w-md mx-4">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchResults && setSearchOpen(true)}
                  placeholder="Search orders, customers, products..."
                  className="w-full pl-10 pr-4 py-2 text-sm bg-gray-100 dark:bg-navy-light border-0 rounded-lg focus:ring-2 focus:ring-safety focus:bg-white dark:focus:bg-navy text-gray-900 dark:text-white placeholder-gray-500"
                />
                {searchLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-safety border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Search Results Dropdown */}
              {searchOpen && searchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-navy rounded-lg shadow-xl border border-gray-200 dark:border-navy-light max-h-96 overflow-y-auto z-50">
                  {searchResults.orders?.length > 0 && (
                    <div className="p-2">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 mb-1">ORDERS</p>
                      {searchResults.orders.map(o => (
                        <button key={o.id} onClick={() => handleResultClick('order', o.id)} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-navy-light rounded-lg text-left">
                          <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg flex items-center justify-center text-xs font-bold">ORD</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{o.orderNumber}</p>
                            <p className="text-xs text-gray-500 truncate">{o.customer?.name || o.customer?.email}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${o.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{o.status}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.customers?.length > 0 && (
                    <div className="p-2 border-t border-gray-100 dark:border-navy-light">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 mb-1">CUSTOMERS</p>
                      {searchResults.customers.map(c => (
                        <button key={c.id} onClick={() => handleResultClick('customer', c.id)} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-navy-light rounded-lg text-left">
                          <span className="w-8 h-8 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg flex items-center justify-center text-xs font-bold">{c.name?.charAt(0) || 'C'}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.name || c.companyName}</p>
                            <p className="text-xs text-gray-500 truncate">{c.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.products?.length > 0 && (
                    <div className="p-2 border-t border-gray-100 dark:border-navy-light">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 mb-1">PRODUCTS</p>
                      {searchResults.products.map(p => (
                        <button key={p.id} onClick={() => handleResultClick('product', p.id)} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-navy-light rounded-lg text-left">
                          <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg flex items-center justify-center text-xs font-bold">PRD</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                            <p className="text-xs text-gray-500 truncate">SKU: {p.sku} | Stock: {p.stockQty}</p>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">R{p.price?.toFixed(2)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.quotes?.length > 0 && (
                    <div className="p-2 border-t border-gray-100 dark:border-navy-light">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 mb-1">QUOTES</p>
                      {searchResults.quotes.map(q => (
                        <button key={q.id} onClick={() => handleResultClick('quote', q.id)} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-navy-light rounded-lg text-left">
                          <span className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-lg flex items-center justify-center text-xs font-bold">QUO</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{q.quoteNumber}</p>
                            <p className="text-xs text-gray-500 truncate">{q.customerName || q.customer?.name}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.invoices?.length > 0 && (
                    <div className="p-2 border-t border-gray-100 dark:border-navy-light">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 mb-1">INVOICES</p>
                      {searchResults.invoices.map(i => (
                        <button key={i.id} onClick={() => handleResultClick('invoice', i.id)} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-navy-light rounded-lg text-left">
                          <span className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 text-teal-600 rounded-lg flex items-center justify-center text-xs font-bold">INV</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{i.invoiceNumber}</p>
                            <p className="text-xs text-gray-500 truncate">{i.customer?.name}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {(!searchResults.orders?.length && !searchResults.customers?.length && !searchResults.products?.length && !searchResults.quotes?.length && !searchResults.invoices?.length) && (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      <p className="text-sm">No results found for "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Page title */}
            <h1 className="hidden lg:block text-lg font-semibold text-gray-900 dark:text-white whitespace-nowrap">
              {menuItems.find(item =>
                location.pathname === item.path ||
                (item.path !== '/admin' && location.pathname.startsWith(item.path))
              )?.label || 'Dashboard'}
            </h1>

            <div className="flex items-center space-x-2">
              {/* Dark mode toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-navy-light"
              >
                {darkMode ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {/* View site link */}
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View Site
              </a>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-safety rounded-lg hover:bg-gray-100 dark:hover:bg-navy-light"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6 pb-20 lg:pb-6">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-navy border-t border-gray-200 dark:border-navy-light safe-area-inset-bottom">
          <div className="flex justify-around items-center h-16">
            {mobileNavItems.slice(0, 5).map((item) => {
              const isActive = location.pathname === item.path ||
                (item.path !== '/admin' && location.pathname.startsWith(item.path))
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center justify-center flex-1 h-full py-2 ${
                    isActive
                      ? 'text-safety'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                  </svg>
                  <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                </Link>
              )
            })}
            {/* More menu */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex flex-col items-center justify-center flex-1 h-full py-2 text-gray-500 dark:text-gray-400"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="text-[10px] mt-1 font-medium">More</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  )
}
