import { Navigate, useLocation } from 'react-router-dom'
import { Spinner } from 'react-bootstrap'
import { useAuth, ROLE_HOME } from '../context/AuthContext'

/**
 * ProtectedRoute
 *
 * Usage:
 *   <ProtectedRoute allowedRoles={['admin']}>
 *     <AdminDashboard />
 *   </ProtectedRoute>
 *
 * - While session is rehydrating → show full-screen spinner
 * - Not logged in → redirect to /login (preserves intended URL in state)
 * - Wrong role → redirect to the user's own home route
 */
export default function ProtectedRoute({ allowedRoles = [], children }) {
  const { user, loading } = useAuth()
  const location          = useLocation()

  if (loading) {
    return (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{ minHeight: '60vh' }}
      >
        <Spinner animation="border" style={{ color: '#EB0A1E' }} />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role] || '/login'} replace />
  }

  return children
}
