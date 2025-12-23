import { createContext, useContext, useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' ? 'http://localhost:3016/api/v1' : `${window.location.origin}/api/v1`
)

const CustomerAuthContext = createContext(null)

export function CustomerAuthProvider({ children }) {
  const [customer, setCustomer] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('customerToken'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      fetchCustomer()
    } else {
      setLoading(false)
    }
  }, [token])

  const fetchCustomer = async () => {
    try {
      const res = await fetch(`${API_URL}/portal/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setCustomer(data)
      } else {
        logout()
      }
    } catch (err) {
      console.error('Failed to fetch customer:', err)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/portal/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Login failed')
    }

    const data = await res.json()
    localStorage.setItem('customerToken', data.token)
    setToken(data.token)
    setCustomer(data.customer)
    return data.customer
  }

  const register = async (userData) => {
    const res = await fetch(`${API_URL}/portal/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Registration failed')
    }

    const data = await res.json()
    localStorage.setItem('customerToken', data.token)
    setToken(data.token)
    setCustomer(data.customer)
    return data.customer
  }

  const logout = () => {
    localStorage.removeItem('customerToken')
    setToken(null)
    setCustomer(null)
  }

  const updateProfile = async (profileData) => {
    const res = await fetch(`${API_URL}/portal/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Update failed')
    }

    const data = await res.json()
    setCustomer(data)
    return data
  }

  const value = {
    customer,
    token,
    loading,
    isAuthenticated: !!customer,
    login,
    register,
    logout,
    updateProfile,
    refreshCustomer: fetchCustomer
  }

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  )
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext)
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider')
  }
  return context
}
