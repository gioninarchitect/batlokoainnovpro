import { Navigate, useLocation } from 'react-router-dom'
import { useCustomerAuth } from '@/context/CustomerAuthContext'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useCustomerAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-safety"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/portal/login" state={{ from: location }} replace />
  }

  return children
}
