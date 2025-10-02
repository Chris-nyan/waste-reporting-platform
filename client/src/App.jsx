import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
// Note: Ensure this is in main.jsx: import 'react-toastify/dist/ReactToastify.css';

import useAuth from './hooks/use-auth';
import { AuthProvider } from './contexts/AuthContext';

// --- Core Pages ---
import LoginPage from './pages/LoginPage';
import TenantDashboardPage from './pages/Tenant/TenantDashboardPage';
import ClientsPage from './pages/Tenant/ClientPage';
import ClientDetailPage from './pages/Tenant/ClientDetailsPage';
import ReportsPage from './pages/Tenant/ReportsPage';
import GenerateReportPage from './pages/Tenant/GenerateReportPage';
import ReportPreviewPage from './pages/Tenant/ReportPreviewPage';
import SuperAdminDashboardPage from './pages/SuperAdmin/SuperAdminDashboardPage';
import AppLayout from './components/layout/AppLayout';


// --- Protected Route Wrapper ---
const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading Session...</div>;
  }

  return user ? <AppLayout /> : <Navigate to="/login" state={{ from: location }} replace />;
};

// --- Role-Based Redirector (with fix) ---
const DashboardRedirect = () => {
  const { user, loading } = useAuth(); // Also get the loading state

  // If the initial auth check is still running, wait.
  // This prevents the redirect from happening before the user state is confirmed.
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Authenticating...</div>;
  }

  switch (user?.role) {
    case 'SUPER_ADMIN':
      return <Navigate to="/superadmin/dashboard" replace />;
    case 'ADMIN':
    case 'MEMBER':
      return <Navigate to="/app/dashboard" replace />;
    default:
      // If loading is false and there's still no valid user/role, send to login.
      return <Navigate to="/login" replace />;
  }
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardRedirect />} />

          {/* Universal Layout for authenticated users */}
          <Route element={<Outlet />}>
            {/* Tenant Routes */}
            <Route path="/app/dashboard" element={<TenantDashboardPage />} />
            <Route path="/app/clients" element={<ClientsPage />} />
            <Route path="/app/clients/:clientId" element={<ClientDetailPage />} />
            <Route path="/app/reports" element={<ReportsPage />} />
            <Route path="/app/reports/generate" element={<GenerateReportPage />} />
            <Route path="/app/reports/preview/:id" element={<ReportPreviewPage />} />



            {/* Super Admin Routes */}
            <Route path="/superadmin/dashboard" element={<SuperAdminDashboardPage />} />
          </Route>
        </Route>
      </Routes>
      <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} />
    </AuthProvider>
  );
}

export default App;

