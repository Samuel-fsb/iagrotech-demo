import { Routes, Route, Navigate } from 'react-router-dom';
import { DEMO_MODE } from '../config/demo';
import { useAuth } from '../hooks/useAuth';
import { MainLayout } from '../components/layout/MainLayout/MainLayout';
import { AdminLayout } from '../components/layout/AdminLayout/AdminLayout';
import { About } from '../pages/About/About';
import { ForgotPassword } from '../pages/ForgotPassword/ForgotPassword';
import { PrivacyPolicy, TermsOfUse } from '../pages/Legal/Legal';
import { Login } from '../pages/Login/Login';
import { Register } from '../pages/Register/Register';
import { Dashboard } from '../pages/Dashboard/Dashboard';
import {
  AlertsPage,
  AdminArticlesPage,
  AdminUsersPage,
  AssistantPage,
  CalendarPage,
  FinancialPage,
  InformationPage,
  InventoryPage,
  LivestockPage,
  PlantationsPage,
  ProfilePage,
  SettingsPage,
} from '../pages/Operations/Operations';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return null;
  if (DEMO_MODE) return <>{children}</>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'ADMIN') return <Navigate to="/admin/usuarios" replace />;
  
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (DEMO_MODE) return <Navigate to="/dashboard" replace />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/sobre" element={<About />} />
      <Route path="/login" element={DEMO_MODE ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/recuperar-senha" element={DEMO_MODE ? <Navigate to="/dashboard" replace /> : <ForgotPassword />} />
      <Route path="/privacidade" element={<PrivacyPolicy />} />
      <Route path="/termos" element={<TermsOfUse />} />
      <Route path="/registrar" element={DEMO_MODE ? <Navigate to="/dashboard" replace /> : <Register />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="financeiro" element={<FinancialPage />} />
        <Route path="plantacoes" element={<PlantationsPage />} />
        <Route path="criacoes" element={<LivestockPage />} />
        <Route path="estoque" element={<InventoryPage />} />
        <Route path="calendario" element={<CalendarPage />} />
        <Route path="informacoes" element={<InformationPage />} />
        <Route path="alertas" element={<AlertsPage />} />
        <Route path="ia" element={<AssistantPage />} />
        <Route path="perfil" element={<ProfilePage />} />
        <Route path="configuracoes" element={<SettingsPage />} />
        <Route path="*" element={<Dashboard />} />
      </Route>

      <Route path="/admin" element={
        <AdminRoute>
          <AdminLayout />
        </AdminRoute>
      }>
        <Route index element={<Navigate to="/admin/usuarios" replace />} />
        <Route path="usuarios" element={<AdminUsersPage />} />
        <Route path="artigos" element={<AdminArticlesPage />} />
      </Route>
    </Routes>
  );
}
