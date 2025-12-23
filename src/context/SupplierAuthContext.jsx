import { createContext, useContext, useState, useEffect } from 'react'

const SupplierAuthContext = createContext(null)

const API_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' ? 'http://localhost:3016/api/v1' : `${window.location.origin}/api/v1`
)

export function SupplierAuthProvider({ children }) {
  const [supplier, setSupplier] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('supplierToken'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      fetchSupplier()
    } else {
      setLoading(false)
    }
  }, [token])

  const fetchSupplier = async () => {
    try {
      const response = await fetch(`${API_URL}/portal/supplier/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setSupplier(data.supplier || data)
      } else {
        logout()
      }
    } catch (error) {
      console.error('Supplier fetch error:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    const response = await fetch(`${API_URL}/portal/supplier/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Login failed')
    }

    localStorage.setItem('supplierToken', data.token)
    setToken(data.token)
    setSupplier(data.supplier || data.user)
    return data
  }

  const logout = () => {
    localStorage.removeItem('supplierToken')
    setToken(null)
    setSupplier(null)
  }

  const value = {
    supplier,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token && !!supplier
  }

  return (
    <SupplierAuthContext.Provider value={value}>
      {children}
    </SupplierAuthContext.Provider>
  )
}

export function useSupplierAuth() {
  const context = useContext(SupplierAuthContext)
  if (!context) {
    throw new Error('useSupplierAuth must be used within a SupplierAuthProvider')
  }
  return context
}
