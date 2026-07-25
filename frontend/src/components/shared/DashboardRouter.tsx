import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import SuperAdminDashboard from '@/pages/SuperAdminDashboard';

export default function DashboardRouter() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Route based on role
  switch (user.role) {
    case 'admin':
      return <SuperAdminDashboard />;
    case 'doctor':
      return <Navigate to="/doctor-dashboard" replace />;
    case 'pharmacy':
      return <Navigate to="/pharmacy" replace />;
    case 'lab':
      return <Navigate to="/lab" replace />;
    case 'staff':
      // Staff is now restricted to appointments and attendance. Defaulting to appointments.
      return <Navigate to="/appointments" replace />;
    case 'patient':
      return <Navigate to="/patient-dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}
