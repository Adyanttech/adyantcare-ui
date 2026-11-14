import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import Layout from './Layout';
import type { Role } from './types';
import Login from './pages/Login';
import Forgot from './pages/Forgot';
import ChangePassword from './pages/ChangePassword';
import Dashboard from './pages/Dashboard';
import Hospitals from './pages/Hospitals';
import Insights from './pages/Insights';
import Staff from './pages/Staff';
import Patients from './pages/Patients';
import Appointments from './pages/Appointments';
import Consult from './pages/Consult';
import Lab from './pages/Lab';
import Billing from './pages/Billing';
import MyRecord from './pages/MyRecord';
import Schedule from './pages/Schedule';
import Reminders from './pages/Reminders';
import BookAppointment from './pages/BookAppointment';
import Reports from './pages/Reports';
import Branding from './pages/Branding';

// Wraps a page: must be signed in, and (optionally) have one of the roles.
// Users whose password was set by someone else must change it first.
function Guard({ roles, allowForced = false, children }: { roles?: Role[]; allowForced?: boolean; children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword && !allowForced) return <Navigate to="/change-password" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="center"><span className="spinner big" aria-label="Loading" /></div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/forgot" element={user ? <Navigate to="/dashboard" replace /> : <Forgot />} />
      <Route path="/change-password" element={<Guard allowForced><ChangePassword /></Guard>} />
      <Route path="/dashboard" element={<Guard><Dashboard /></Guard>} />
      <Route path="/hospitals" element={<Guard roles={['SUPER_ADMIN']}><Hospitals /></Guard>} />
      <Route path="/insights" element={<Guard roles={['SUPER_ADMIN']}><Insights /></Guard>} />
      <Route path="/staff" element={<Guard roles={['ADMIN']}><Staff /></Guard>} />
      <Route path="/reports" element={<Guard roles={['ADMIN']}><Reports /></Guard>} />
      <Route path="/branding" element={<Guard roles={['ADMIN']}><Branding /></Guard>} />
      <Route path="/patients" element={<Guard roles={['ADMIN', 'FRONT_DESK']}><Patients /></Guard>} />
      <Route path="/appointments" element={<Guard roles={['ADMIN', 'FRONT_DESK', 'DOCTOR']}><Appointments /></Guard>} />
      <Route path="/schedule" element={<Guard roles={['ADMIN', 'FRONT_DESK', 'DOCTOR']}><Schedule /></Guard>} />
      <Route path="/reminders" element={<Guard roles={['ADMIN', 'FRONT_DESK', 'DOCTOR']}><Reminders /></Guard>} />
      <Route path="/book" element={<Guard roles={['PATIENT']}><BookAppointment /></Guard>} />
      <Route path="/consult/:id" element={<Guard roles={['DOCTOR']}><Consult /></Guard>} />
      <Route path="/lab" element={<Guard roles={['LAB_TECH']}><Lab /></Guard>} />
      <Route path="/billing" element={<Guard roles={['ADMIN', 'FRONT_DESK']}><Billing /></Guard>} />
      <Route path="/my" element={<Guard roles={['PATIENT']}><MyRecord /></Guard>} />
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}
