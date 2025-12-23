import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCustomerAuth } from '@/context/CustomerAuthContext'
import { useTheme } from '@/context/ThemeContext'

const menuItems = [
  { path: '/portal', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', mobileNav: true },
  { path: '/portal/orders', label: 'My Orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', mobileNav: true },
  { path: '/portal/quotes', label: 'Quotes', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', mobileNav: true },
  { path: '/portal/invoices', label: 'Invoices', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z', mobileNav: true },
  { path: '/portal/profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', mobileNav: true },
]

const mobileNavItems = menuItems.filter(item => item.mobileNav)

export default function PortalLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { customer, logout } = useCustomerAuth()
  const { darkMode, toggleDarkMode } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/portal/login')
  }

  const customerName = customer?.company || `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim() || 'Customer'

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
          <Link to="/portal" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-safety rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className={`font-heading font-bold ${darkMode ? 'text-white' : 'text-navy'}`}>My Account</span>
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
              (item.path !== '/portal' && location.pathname.startsWith(item.path))
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-safety/10 text-safety'
                    : darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
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
        <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-4`}>
          <div className="flex items-center mb-3">
            <div className={`w-10 h-10 rounded-full ${darkMode ? 'bg-industrial/20' : 'bg-industrial/10'} flex items-center justify-center`}>
              <span className="text-industrial font-medium">
                {customerName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'} truncate`}>
                {customerName}
              </p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} truncate`}>
                {customer?.email}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Link
              to="/"
              className={`flex-1 px-3 py-1.5 text-xs text-center rounded-lg ${darkMode ? 'text-gray-300 bg-gray-800 hover:bg-gray-700' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'}`}
            >
              Main Site
            </Link>
            <button
              onClick={handleLogout}
              className={`flex-1 px-3 py-1.5 text-xs text-center rounded-lg ${darkMode ? 'text-red-400 bg-red-900/30 hover:bg-red-900/50' : 'text-red-600 bg-red-50 hover:bg-red-100'}`}
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div>
        {/* Top header */}
        <header className={`sticky top-0 z-30 shadow-sm ${darkMode ? 'bg-navy' : 'bg-white'}`}>
          <div className="flex items-center justify-between h-16 px-4">
            {/* Menu button and Logo */}
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className={`p-2 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              {/* Clickable logo - always visible */}
              <Link to="/portal" className="flex items-center space-x-2 ml-2">
                <div className="w-8 h-8 bg-safety rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">B</span>
                </div>
                <span className={`hidden sm:inline font-heading font-bold ${darkMode ? 'text-white' : 'text-navy'}`}>My Account</span>
              </Link>
            </div>

            {/* Page title */}
            <h1 className={`text-lg font-semibold whitespace-nowrap ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {menuItems.find(item =>
                location.pathname === item.path ||
                (item.path !== '/portal' && location.pathname.startsWith(item.path))
              )?.label || 'Dashboard'}
            </h1>

            <div className="flex items-center space-x-2">
              {/* Dark mode toggle */}
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg ${darkMode ? 'text-yellow-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
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
              <Link
                to="/"
                className={`hidden sm:flex items-center px-3 py-2 text-sm ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Site
              </Link>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className={`flex items-center px-3 py-2 text-sm rounded-lg ${darkMode ? 'text-gray-300 hover:text-safety hover:bg-gray-800' : 'text-gray-600 hover:text-safety hover:bg-gray-100'}`}
              >
                <svg className="w-4 h-4 sm:mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t safe-area-inset-bottom ${darkMode ? 'bg-navy border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex justify-around items-center h-16">
            {mobileNavItems.slice(0, 4).map((item) => {
              const isActive = location.pathname === item.path ||
                (item.path !== '/portal' && location.pathname.startsWith(item.path))
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center justify-center flex-1 h-full py-2 ${
                    isActive
                      ? 'text-safety'
                      : darkMode ? 'text-gray-400' : 'text-gray-500'
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
              className={`flex flex-col items-center justify-center flex-1 h-full py-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
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
