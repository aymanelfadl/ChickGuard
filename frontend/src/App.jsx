import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import LoginPage from "./components/auth/LoginPage.jsx";
import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";
import DashboardLayout from "./components/layout/DashboardLayout.jsx";
import Header from "./components/layout/Header.jsx";
import { useAuth } from "./hooks/useAuth.js";
import AlertsPage from "./pages/AlertsPage.jsx";
import CoopDetailsPage from "./pages/CoopDetailsPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import DevicesPage from "./pages/DevicesPage.jsx";
import FarmDetailsPage from "./pages/FarmDetailsPage.jsx";
import FarmsPage from "./pages/FarmsPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

function AppRoutes({ user, onLogout }) {
  return (
    <DashboardLayout
      user={user}
      header={
        <Header
          isRefreshing={false}
          onRefresh={() => window.location.reload()}
          user={user}
          onLogout={onLogout}
        />
      }
    >
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/farms" element={<FarmsPage user={user} />} />
        <Route path="/farms/:farmId" element={<FarmDetailsPage />} />
        <Route path="/coops/:coopId" element={<CoopDetailsPage />} />
        <Route path="/devices" element={<DevicesPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DashboardLayout>
  );
}

export default function App() {
  const {
    currentUser,
    isAuthenticated,
    isInitializing,
    isSubmitting,
    authError,
    login,
    logout,
  } = useAuth();

  return (
    <BrowserRouter>
      <ProtectedRoute
        isAuthenticated={isAuthenticated}
        isLoading={isInitializing}
        loginPage={<LoginPage onLogin={login} isLoading={isSubmitting} error={authError} />}
      >
        <AppRoutes user={currentUser} onLogout={logout} />
      </ProtectedRoute>
    </BrowserRouter>
  );
}
