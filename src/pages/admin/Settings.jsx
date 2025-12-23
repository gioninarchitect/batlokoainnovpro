import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'

const API_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' ? 'http://localhost:3016/api/v1' : `${window.location.origin}/api/v1`
)

export default function Settings() {
  const { user, token, logout } = useAuth()
  const { darkMode, toggleDarkMode } = useTheme()
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  // Profile form
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  })

  // Password form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Email notification settings
  const [emailSettings, setEmailSettings] = useState({
    adminEmail: '',
    orderNotifyEmails: '',
    lowStockNotifyEmails: '',
    sendOrderConfirmation: true,
    sendDispatchNotification: true,
    sendInvoiceEmail: true,
  })

  useEffect(() => {
    if (activeTab === 'notifications') {
      fetchEmailSettings()
    }
  }, [activeTab])

  const fetchEmailSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        // Data is already a key-value object with parsed values
        setEmailSettings(prev => ({ ...prev, ...data }))
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err)
    }
  }

  const handleSaveEmailSettings = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch(`${API_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(emailSettings)
      })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Email settings saved successfully' })
      } else {
        setMessage({ type: 'error', text: 'Failed to save email settings' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save email settings' })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch(`${API_URL}/auth/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully' })
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.message || 'Failed to update profile' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }
    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully' })
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.message || 'Failed to change password' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to change password' })
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'security', label: 'Security' },
    { id: 'appearance', label: 'Appearance' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-navy-light">
        <nav className="flex space-x-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-safety text-safety'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
            : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-navy rounded-xl shadow-card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile Information</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
              <input
                type="text"
                value={user?.role || ''}
                disabled
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-navy-light bg-gray-100 dark:bg-navy-dark text-gray-500 dark:text-gray-400"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-safety text-white rounded-lg hover:bg-safety-dark disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-white dark:bg-navy rounded-xl shadow-card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Email Notifications</h2>
          <form onSubmit={handleSaveEmailSettings} className="space-y-6">
            {/* Email Recipients */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Email Recipients</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Admin Email
                </label>
                <input
                  type="email"
                  value={emailSettings.adminEmail}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, adminEmail: e.target.value }))}
                  placeholder="admin@batlokoainnovpro.co.za"
                  className="w-full max-w-md px-3 py-2 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 mt-1">Primary admin email for system notifications</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Order Notification Emails
                </label>
                <input
                  type="text"
                  value={emailSettings.orderNotifyEmails}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, orderNotifyEmails: e.target.value }))}
                  placeholder="orders@example.com, sales@example.com"
                  className="w-full max-w-md px-3 py-2 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 mt-1">Comma-separated list of emails to receive new order notifications</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Low Stock Alert Emails
                </label>
                <input
                  type="text"
                  value={emailSettings.lowStockNotifyEmails}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, lowStockNotifyEmails: e.target.value }))}
                  placeholder="inventory@example.com"
                  className="w-full max-w-md px-3 py-2 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 mt-1">Comma-separated list of emails to receive low stock alerts</p>
              </div>
            </div>

            {/* Email Toggles */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-navy-light">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Customer Emails</h3>

              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-navy-light rounded-lg max-w-md">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Order Confirmation</p>
                  <p className="text-sm text-gray-500">Send confirmation email when order is created</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailSettings(prev => ({ ...prev, sendOrderConfirmation: !prev.sendOrderConfirmation }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    emailSettings.sendOrderConfirmation ? 'bg-safety' : 'bg-gray-200 dark:bg-navy-light'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    emailSettings.sendOrderConfirmation ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-navy-light rounded-lg max-w-md">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Dispatch Notification</p>
                  <p className="text-sm text-gray-500">Send email when order is dispatched</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailSettings(prev => ({ ...prev, sendDispatchNotification: !prev.sendDispatchNotification }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    emailSettings.sendDispatchNotification ? 'bg-safety' : 'bg-gray-200 dark:bg-navy-light'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    emailSettings.sendDispatchNotification ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-navy-light rounded-lg max-w-md">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Invoice Email</p>
                  <p className="text-sm text-gray-500">Send invoice PDF when invoice is generated</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailSettings(prev => ({ ...prev, sendInvoiceEmail: !prev.sendInvoiceEmail }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    emailSettings.sendInvoiceEmail ? 'bg-safety' : 'bg-gray-200 dark:bg-navy-light'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    emailSettings.sendInvoiceEmail ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-safety text-white rounded-lg hover:bg-safety-dark disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Email Settings'}
            </button>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-white dark:bg-navy rounded-xl shadow-card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-safety text-white rounded-lg hover:bg-safety-dark disabled:opacity-50"
            >
              {saving ? 'Changing...' : 'Change Password'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-navy-light">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Danger Zone</h3>
            <button
              onClick={logout}
              className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Appearance Tab */}
      {activeTab === 'appearance' && (
        <div className="bg-white dark:bg-navy rounded-xl shadow-card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appearance</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-navy-light rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Toggle between light and dark theme</p>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  darkMode ? 'bg-safety' : 'bg-gray-200 dark:bg-navy-light'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* App Info */}
      <div className="bg-white dark:bg-navy rounded-xl shadow-card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">About</h2>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p><strong>App:</strong> Batlokoa Admin Dashboard</p>
          <p><strong>Version:</strong> 1.0.0 (MVP)</p>
          <p><strong>Contact:</strong> info@batlokoainnovpro.co.za</p>
          <p><strong>Phone:</strong> +27 73 974 8317</p>
        </div>
      </div>
    </div>
  )
}
