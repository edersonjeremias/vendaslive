import React, { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useSupabase } from './contexts/SupabaseContext';
import { usePermissions } from './contexts/PermissionsContext';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import Dashboard from './pages/Dashboard';
import ClientsPage from './pages/clients/ClientsPage';
import NewClientPage from './pages/clients/NewClientPage';
import SalesPage from './pages/sales/SalesPage';
import NewSalePage from './pages/sales/NewSalePage';
import SaleDetailsPage from './pages/sales/SaleDetailsPage';
import UsersPage from './pages/admin/UsersPage';
import Layout from './components/layout/Layout';
import LoadingScreen from './components/ui/LoadingScreen';

// Protected route component with permission check
const ProtectedRoute = ({ 
  children, 
  requiredPermission 
}: { 
  children: React.ReactNode;
  requiredPermission?: keyof UserPermissions;
}) => {
  const { user, loading: authLoading } = useSupabase();
  const { permissions, loading: permissionsLoading } = usePermissions();
  
  if (authLoading || permissionsLoading) {
    return <LoadingScreen />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredPermission && !permissions[requiredPermission]) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  const { user, loading: authLoading } = useSupabase();
  const { loading: permissionsLoading } = usePermissions();
  const location = useLocation();
  
  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (authLoading || permissionsLoading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path="/login" 
        element={user ? <Navigate to="/" replace /> : <Login />} 
      />
      <Route 
        path="/register" 
        element={user ? <Navigate to="/" replace /> : <Register />} 
      />
      <Route 
        path="/forgot-password" 
        element={user ? <Navigate to="/" replace /> : <ForgotPassword />} 
      />
      
      {/* Protected routes */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        
        <Route 
          path="clients" 
          element={
            <ProtectedRoute requiredPermission="canViewClients">
              <ClientsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="clients/new" 
          element={
            <ProtectedRoute requiredPermission="canCreateClients">
              <NewClientPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="sales" 
          element={
            <ProtectedRoute requiredPermission="canViewSales">
              <SalesPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="sales/new" 
          element={
            <ProtectedRoute requiredPermission="canCreateSales">
              <NewSalePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="sales/:id" 
          element={
            <ProtectedRoute requiredPermission="canViewSales">
              <SaleDetailsPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="admin/users" 
          element={
            <ProtectedRoute>
              <UsersPage />
            </ProtectedRoute>
          } 
        />
      </Route>
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;