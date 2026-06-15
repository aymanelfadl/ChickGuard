import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import LoginPage from "./components/auth/LoginPage.jsx";
import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";
import DashboardLayout from "./components/layout/DashboardLayout.jsx";
import Header from "./components/layout/Header.jsx";
import { useAuth } from "./hooks/useAuth.js";
import { useRealtimeEvents } from "./hooks/useRealtimeEvents.js";
import AlertsPage from "./pages/AlertsPage.jsx";
import CoopDetailsPage from "./pages/CoopDetailsPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import DeviceDetailsPage from "./pages/DeviceDetailsPage.jsx";
import DevicesPage from "./pages/DevicesPage.jsx";
import FarmDetailsPage from "./pages/FarmDetailsPage.jsx";
import FarmsPage from "./pages/FarmsPage.jsx";
import ImageAnalysisDetailsPage from "./pages/ImageAnalysisDetailsPage.jsx";
import ImageGalleryPage from "./pages/ImageGalleryPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

function AppRoutes({ user, onLogout }) {
  const realtime = useRealtimeEvents({ enabled: Boolean(user) });

  return (
    <DashboardLayout
      user={user}
      header={
        <Header
          isRefreshing={false}
          onRefresh={() => window.location.reload()}
          realtimeStatus={realtime.status}
          user={user}
          onLogout={onLogout}
        />
      }
    >
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage realtime={realtime} />} />
        <Route path="/farms" element={<FarmsPage user={user} />} />
        <Route path="/farms/:farmId" element={<FarmDetailsPage realtime={realtime} user={user} />} />
        <Route path="/coops/:coopId" element={<CoopDetailsPage realtime={realtime} user={user} />} />
        <Route path="/devices" element={<DevicesPage realtime={realtime} user={user} />} />
        <Route path="/devices/:deviceId" element={<DeviceDetailsPage realtime={realtime} user={user} />} />
        <Route path="/gallery" element={<ImageGalleryPage realtime={realtime} />} />
        <Route path="/gallery/:imageReadingId" element={<ImageAnalysisDetailsPage />} />
        <Route path="/alerts" element={<AlertsPage realtime={realtime} />} />
        <Route path="/reports" element={<ReportsPage realtime={realtime} />} />
        <Route path="/settings" element={<SettingsPage user={user} />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
