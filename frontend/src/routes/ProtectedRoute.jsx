/**
 *
 * Route guard for authenticated pages.
 *
 * Behaviour:
 *   - While session is being checked (isLoading) → show a full-page spinner
 *   - If not authenticated → redirect to /login
 *   - If authenticated → render the requested page
 *
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  // Wait for session restoration before making any routing decision
  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <div className="spinner" style={{ width: 36, height: 36 }} />
      </div>
    );
  }

  // Not authenticated — send to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated — render the child route
  return <Outlet />;
}