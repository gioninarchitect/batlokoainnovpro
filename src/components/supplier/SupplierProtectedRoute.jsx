import { Navigate } from 'react-router-dom'
import { useSupplierAuth } from '@/context/SupplierAuthContext'

export default function SupplierProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useSupplierAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-industrial"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/supplier/login" replace />
  }

  return children
}
