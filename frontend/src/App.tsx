import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardRouter from './components/shared/DashboardRouter';
import SuperAdminDashboard from './pages/SuperAdminDashboard'; // Still needed for the router or if we keep the explicit route
import EmployeeList from './pages/employees/EmployeeList';
import AppointmentCalendar from './pages/appointments/AppointmentCalendar';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorHistoryPage from './pages/doctor/DoctorHistoryPage';
import ConsultationView from './pages/doctor/ConsultationView';
import ConsultationHistoryView from './pages/doctor/ConsultationHistoryView';
import { FormOWizard } from './pages/doctor/FormOWizard';
import { Form32Generator } from './pages/doctor/Form32Generator';
import { Form21Register } from './pages/doctor/Form21Register';
import PharmacyDashboard from './pages/pharmacy/PharmacyDashboard';
import IssueMedicine from './pages/pharmacy/IssueMedicine';
import LaboratoryDashboard from './pages/lab/LaboratoryDashboard';
import AttendanceDashboard from './pages/hr/AttendanceDashboard';
import BillingDashboard from './pages/billing/BillingDashboard';
import AuditLogsView from './pages/admin/AuditLogsView';
import UserManagement from './pages/admin/UserManagement';
import PatientDashboard from './pages/patient/PatientDashboard';
import ProfilePage from './pages/ProfilePage';

import RegisterPage from './pages/RegisterPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route path="/" element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardRouter />} />
              <Route path="profile" element={<ProfilePage />} />
              
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="employees" element={<EmployeeList />} />
              </Route>
              
              <Route element={<ProtectedRoute allowedRoles={['admin', 'staff', 'doctor', 'pharmacy', 'lab']} />}>
                <Route path="attendance" element={<AttendanceDashboard />} />
              </Route>
              
              <Route element={<ProtectedRoute allowedRoles={['admin', 'staff']} />}>
                <Route path="appointments" element={<AppointmentCalendar />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'staff']} />}>
                <Route path="doctor-dashboard" element={<DoctorDashboard />} />
                <Route path="doctor-history" element={<DoctorHistoryPage />} />
                <Route path="consultation/:appointmentId" element={<ConsultationView />} />
                <Route path="ohs/form-o" element={<FormOWizard />} />
                <Route path="ohs/form-32" element={<Form32Generator />} />
                <Route path="ohs/form-21" element={<Form21Register />} />
              </Route>
              
              <Route element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'patient', 'employee', 'staff']} />}>
                <Route path="consultation-history/:recordId" element={<ConsultationHistoryView />} />
              </Route>
              
              <Route element={<ProtectedRoute allowedRoles={['admin', 'pharmacy', 'staff']} />}>
                <Route path="pharmacy" element={<PharmacyDashboard />} />
                <Route path="pharmacy/issue" element={<IssueMedicine />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['admin', 'lab']} />}>
                <Route path="lab" element={<LaboratoryDashboard />} />
              </Route>
              
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="billing" element={<BillingDashboard />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="audit-logs" element={<AuditLogsView />} />
                <Route path="user-management" element={<UserManagement />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['patient', 'employee']} />}>
                <Route path="patient-dashboard" element={<PatientDashboard />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
