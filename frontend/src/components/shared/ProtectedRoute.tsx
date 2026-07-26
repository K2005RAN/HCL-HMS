import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && user) {
    const userRole = (user.role || '').toLowerCase();
    const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());
    if (!normalizedAllowed.includes(userRole) && userRole !== 'admin' && userRole !== 'super admin') {
      // Super Admin bypasses role checks, otherwise redirect if not authorized
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
}
