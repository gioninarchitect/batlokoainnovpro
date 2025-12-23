import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useSupplierAuth } from '@/context/SupplierAuthContext'
import { useTheme } from '@/context/ThemeContext'

export default function SupplierLogin() {
  const navigate = useNavigate()
  const { login } = useSupplierAuth()
  const { darkMode, toggleDarkMode } = useTheme()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login(formData.email, formData.password)
      navigate('/supplier')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${
      darkMode ? 'bg-navy-dark' : 'bg-gray-100'
    }`}>
      {/* Theme toggle */}
      <button
        onClick={toggleDarkMode}
        className={`fixed top-4 right-4 p-2 rounded-lg transition-colors ${
          darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-200 text-gray-600'
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

      <div className="max-w-md w-full">
        <div className={`rounded-lg shadow-lg p-8 ${darkMode ? 'bg-navy' : 'bg-white'}`}>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-industrial rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">S</span>
            </div>
            <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Supplier Portal
            </h2>
            <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Sign in to manage your orders and products
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-industrial focus:border-industrial ${
                  darkMode
                    ? 'bg-navy-dark border-gray-600 text-white placeholder-gray-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
                placeholder="supplier@company.com"
              />
            </div>

            <div>
              <label htmlFor="password" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-industrial focus:border-industrial ${
                  darkMode
                    ? 'bg-navy-dark border-gray-600 text-white placeholder-gray-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-industrial hover:bg-industrial/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-industrial disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/" className={`text-sm ${darkMode ? 'text-industrial hover:text-industrial/80' : 'text-industrial hover:text-industrial/80'}`}>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
