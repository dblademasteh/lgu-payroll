import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './stores/auth.js';
import { OVERSIGHT_ROLES, PAYROLL_ROLES, REPORT_ROLES } from './lib/roles.js';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Payroll from './pages/Payroll.jsx';
import Payslips from './pages/Payslips.jsx';
import Deductions from './pages/Deductions.jsx';
import Employees from './pages/Employees.jsx';
import Departments from './pages/Departments.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';
import NotFound from './components/NotFound.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

const ROLES = {
  ADMIN: 'ADMIN',
  HR_MANAGER: 'HR_MANAGER',
  PAYROLL_MANAGER: 'PAYROLL_MANAGER',
  DEPARTMENT_HEAD: 'DEPARTMENT_HEAD',
  AUDITOR: 'AUDITOR',
  VIEWER: 'VIEWER',
};

function Protected({ children, roles }) {
  const user = useAuth((s) => s.user);
  if (!user) return <Navigate to="/" replace />;
  if (roles && !roles.includes(user.role)) return <NotFound />;
  return children;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/payroll" element={<Protected roles={PAYROLL_ROLES}><Payroll /></Protected>} />
            <Route path="/payslips" element={<Protected roles={REPORT_ROLES}><Payslips /></Protected>} />
            <Route path="/deductions" element={<Protected roles={PAYROLL_ROLES}><Deductions /></Protected>} />
            <Route path="/employees" element={<Protected roles={OVERSIGHT_ROLES}><Employees /></Protected>} />
            <Route path="/departments" element={<Protected roles={OVERSIGHT_ROLES}><Departments /></Protected>} />
            <Route path="/reports" element={<Protected roles={REPORT_ROLES}><Reports /></Protected>} />
            <Route path="/settings" element={<Protected><Settings /></Protected>} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}