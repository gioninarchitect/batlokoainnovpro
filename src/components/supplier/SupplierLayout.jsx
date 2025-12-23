import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSupplierAuth } from '@/context/SupplierAuthContext'
import { useTheme } from '@/context/ThemeContext'

const menuItems = [
  { path: '/supplier', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', mobileNav: true },
  { path: '/supplier/orders', label: 'Purchase Orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', mobileNav: true },
  { path: '/supplier/products', label: 'Products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', mobileNav: true },
  { path: '/supplier/profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', mobileNav: true },
]

const mobileNavItems = menuItems.filter(item => item.mobileNav)

export default function SupplierLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { supplier, logout } = useSupplierAuth()
  const { darkMode, toggleDarkMode } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/supplier/login')
  }

  const supplierName = supplier?.name || supplier?.company || 'Supplier'

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-navy-dark' : 'bg-gray-50'}`}>
      {/* Sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - slide in/out */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 transform transition-transform duration-300 ease-in-out
        ${darkMode ? 'bg-navy' : 'bg-white'}
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className={`flex items-center justify-between h-16 px-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <Link to="/supplier" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-industrial rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className={`font-heading font-bold ${darkMode ? 'text-white' : 'text-navy'}`}>Supplier Portal</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className={`p-2 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
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
              (item.path !== '/supplier' && location.pathname.startsWith(item.path))
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-industrial/10 text-industrial'
                    : darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User info at bottom */}
        <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-industrial/20 flex items-center justify-center">
              <span className="text-industrial font-medium">{supplierName.charAt(0).toUpperCase()}</span>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {supplierName}
              </p>
              <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {supplier?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={`mt-3 w-full flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col min-h-screen pb-16">
        {/* Top bar */}
        <header className={`sticky top-0 z-30 h-16 flex items-center justify-between px-4 border-b ${
          darkMode ? 'bg-navy border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <button
            onClick={() => setSidebarOpen(true)}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
          >
            <svg className={`w-6 h-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center space-x-3">
            {/* Theme toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
              }`}
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

            {/* Back to main site */}
            <Link
              to="/"
              className={`text-sm ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Back to Site
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className={`fixed bottom-0 left-0 right-0 z-30 border-t ${
        darkMode ? 'bg-navy border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex justify-around">
          {mobileNavItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/supplier' && location.pathname.startsWith(item.path))
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center py-2 px-3 min-w-0 flex-1
                  ${isActive
                    ? 'text-industrial'
                    : darkMode ? 'text-gray-400' : 'text-gray-500'
                  }
                `}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                <span className="text-xs mt-1 truncate">{item.label.split(' ')[0]}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
