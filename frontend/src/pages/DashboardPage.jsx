import ErrorState from "../components/common/ErrorState.jsx";
import LiveUpdateStatus from "../components/common/LiveUpdateStatus.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import AlertsTable from "../components/dashboard/AlertsTable.jsx";
import HealthHistoryChart from "../components/dashboard/HealthHistoryChart.jsx";
import LatestStatus from "../components/dashboard/LatestStatus.jsx";
import OverviewCards from "../components/dashboard/OverviewCards.jsx";
import { useDashboardData } from "../hooks/useDashboardData.js";
import { useRealtimeRefresh } from "../hooks/useRealtimeRefresh.js";

export default function DashboardPage({ realtime }) {
  const {
    overview,
    latestStatus,
    healthHistory,
    alerts,
    isLoading,
    error,
    lastUpdatedAt,
    refreshDashboardData,
  } = useDashboardData();
  const { isRefreshing, lastRefreshEventType, liveUpdateReceived, refreshManually } = useRealtimeRefresh(
    realtime,
    refreshDashboardData,
  );

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <>
      <LiveUpdateStatus
        realtimeStatus={realtime?.status}
        lastUpdatedAt={lastUpdatedAt}
        liveUpdateReceived={liveUpdateReceived}
        lastEventType={lastRefreshEventType}
        isRefreshing={isRefreshing}
        onRefresh={refreshManually}
      />
      <OverviewCards overview={overview} />
      <LatestStatus status={latestStatus} />
      <HealthHistoryChart history={healthHistory} />
      <AlertsTable alerts={alerts} />
    </>
  );
}
