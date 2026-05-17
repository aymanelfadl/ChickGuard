import ErrorState from "./components/common/ErrorState.jsx";
import LoadingState from "./components/common/LoadingState.jsx";
import LoginPage from "./components/auth/LoginPage.jsx";
import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";
import AlertsTable from "./components/dashboard/AlertsTable.jsx";
import HealthHistoryChart from "./components/dashboard/HealthHistoryChart.jsx";
import LatestStatus from "./components/dashboard/LatestStatus.jsx";
import OverviewCards from "./components/dashboard/OverviewCards.jsx";
import DashboardLayout from "./components/layout/DashboardLayout.jsx";
import Header from "./components/layout/Header.jsx";
import { useAuth } from "./hooks/useAuth.js";
import { useDashboardData } from "./hooks/useDashboardData.js";

function DashboardPage({ user, onLogout }) {
  const { overview, latestStatus, healthHistory, alerts, isLoading, error, refreshDashboardData } = useDashboardData();

  return (
    <DashboardLayout
      header={
        <Header
          isRefreshing={isLoading}
          onRefresh={refreshDashboardData}
          user={user}
          onLogout={onLogout}
        />
      }
    >
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} />
      ) : (
        <>
          <OverviewCards overview={overview} />
          <LatestStatus status={latestStatus} />
          <HealthHistoryChart history={healthHistory} />
          <AlertsTable alerts={alerts} />
        </>
      )}
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
    <ProtectedRoute
      isAuthenticated={isAuthenticated}
      isLoading={isInitializing}
      loginPage={<LoginPage onLogin={login} isLoading={isSubmitting} error={authError} />}
    >
      <DashboardPage user={currentUser} onLogout={logout} />
    </ProtectedRoute>
  );
}
