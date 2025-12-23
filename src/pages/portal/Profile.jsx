import { useState } from 'react'
import { useCustomerAuth } from '@/context/CustomerAuthContext'
import { useTheme } from '@/context/ThemeContext'

const API_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' ? 'http://localhost:3016/api/v1' : `${window.location.origin}/api/v1`
)

export default function Profile() {
  const { customer, token, updateProfile, logout } = useCustomerAuth()
  const { darkMode } = useTheme()
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  const [profileData, setProfileData] = useState({
    firstName: customer?.firstName || '',
    lastName: customer?.lastName || '',
    phone: customer?.phone || '',
    company: customer?.company || '',
    addressLine1: customer?.addressLine1 || '',
    addressLine2: customer?.addressLine2 || '',
    city: customer?.city || '',
    province: customer?.province || '',
    postalCode: customer?.postalCode || '',
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileData(prev => ({ ...prev, [name]: value }))
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      await updateProfile(profileData)
      setMessage({ type: 'success', text: 'Profile updated successfully' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setMessage(null)

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' })
      return
    }

    setSaving(true)

    try {
      const res = await fetch(`${API_URL}/portal/profile/password`, {
        method: 'PUT',
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
        setMessage({ type: 'error', text: data.error || 'Failed to change password' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to change password' })
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'address', label: 'Address' },
    { id: 'security', label: 'Security' }
  ]

  return (
    <div className="space-y-6">
      <h1 className={`text-xl sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>My Profile</h1>

      {/* Tabs */}
      <div className={`rounded-xl shadow-sm ${darkMode ? 'bg-navy' : 'bg-white'}`}>
        <div className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setMessage(null)
                }}
                className={`px-4 sm:px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-safety text-safety'
                    : darkMode ? 'border-transparent text-gray-400 hover:text-white' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          {/* Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={profileData.firstName}
                    onChange={handleProfileChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-safety focus:border-safety ${darkMode ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={profileData.lastName}
                    onChange={handleProfileChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-safety focus:border-safety ${darkMode ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300'}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Company
                </label>
                <input
                  type="text"
                  name="company"
                  value={profileData.company}
                  onChange={handleProfileChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-safety focus:border-safety ${darkMode ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Email
                </label>
                <input
                  type="email"
                  value={customer?.email || ''}
                  disabled
                  className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'border-gray-700 bg-gray-900 text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-500'}`}
                />
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email cannot be changed</p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-safety focus:border-safety ${darkMode ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300'}`}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-safety text-white rounded-lg hover:bg-safety/90 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}

          {/* Address Tab */}
          {activeTab === 'address' && (
            <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-lg">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Address Line 1
                </label>
                <input
                  type="text"
                  name="addressLine1"
                  value={profileData.addressLine1}
                  onChange={handleProfileChange}
                  placeholder="Street address"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-safety focus:border-safety ${darkMode ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500' : 'border-gray-300'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Address Line 2
                </label>
                <input
                  type="text"
                  name="addressLine2"
                  value={profileData.addressLine2}
                  onChange={handleProfileChange}
                  placeholder="Apartment, suite, unit, etc."
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-safety focus:border-safety ${darkMode ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500' : 'border-gray-300'}`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={profileData.city}
                    onChange={handleProfileChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-safety focus:border-safety ${darkMode ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Province
                  </label>
                  <select
                    name="province"
                    value={profileData.province}
                    onChange={handleProfileChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-safety focus:border-safety ${darkMode ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300'}`}
                  >
                    <option value="">Select Province</option>
                    <option value="Eastern Cape">Eastern Cape</option>
                    <option value="Free State">Free State</option>
                    <option value="Gauteng">Gauteng</option>
                    <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                    <option value="Limpopo">Limpopo</option>
                    <option value="Mpumalanga">Mpumalanga</option>
                    <option value="North West">North West</option>
                    <option value="Northern Cape">Northern Cape</option>
                    <option value="Western Cape">Western Cape</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Postal Code
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={profileData.postalCode}
                  onChange={handleProfileChange}
                  className={`w-full max-w-[150px] px-3 py-2 border rounded-lg focus:ring-safety focus:border-safety ${darkMode ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300'}`}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-safety text-white rounded-lg hover:bg-safety/90 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Address'}
              </button>
            </form>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="max-w-lg">
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Change Password</h3>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-safety focus:border-safety ${darkMode ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300'}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-safety focus:border-safety ${darkMode ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300'}`}
                  />
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>At least 8 characters</p>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-safety focus:border-safety ${darkMode ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300'}`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-safety text-white rounded-lg hover:bg-safety/90 disabled:opacity-50"
                >
                  {saving ? 'Changing...' : 'Change Password'}
                </button>
              </form>

              <div className={`mt-8 pt-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Account Actions</h3>
                <button
                  onClick={logout}
                  className={`px-6 py-2 border rounded-lg ${darkMode ? 'border-red-700 text-red-400 hover:bg-red-900/30' : 'border-red-300 text-red-600 hover:bg-red-50'}`}
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
