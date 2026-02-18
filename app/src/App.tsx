import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/hooks/useAuth';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import PublicRoute from '@/components/PublicRoute';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import DailyMetrics from '@/pages/DailyMetrics';
import FTIBoard from '@/pages/FTIBoard';
import Pipeline from '@/pages/Pipeline';
import YearlyTracking from '@/pages/YearlyTracking';
import Forecasting from '@/pages/Forecasting';
import UserManagement from '@/pages/UserManagement';
import TeamManagement from '@/pages/TeamManagement';
import Settings from '@/pages/Settings';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="daily-metrics" element={<DailyMetrics />} />
            <Route path="fti-board" element={<FTIBoard />} />
            <Route path="pipeline" element={<Pipeline />} />
            <Route path="yearly-tracking" element={<YearlyTracking />} />
            <Route path="forecasting" element={<Forecasting />} />
            <Route
              path="users"
              element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="teams"
              element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <TeamManagement />
                </ProtectedRoute>
              }
            />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
