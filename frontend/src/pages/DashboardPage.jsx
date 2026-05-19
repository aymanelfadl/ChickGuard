import ErrorState from "../components/common/ErrorState.jsx";
import LiveUpdateStatus from "../components/common/LiveUpdateStatus.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import AlertsTable from "../components/dashboard/AlertsTable.jsx";
import HealthHistoryChart from "../components/dashboard/HealthHistoryChart.jsx";
import LatestStatus from "../components/dashboard/LatestStatus.jsx";
import OverviewCards from "../components/dashboard/OverviewCards.jsx";
import Breadcrumbs from "../components/navigation/Breadcrumbs.jsx";
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
    <div className="w-full space-y-6">
      <div className="space-y-3">
        <Breadcrumbs items={[{ label: "Dashboard", to: "/dashboard" }]} levelLabel="System Overview" />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-bold uppercase text-[#14532D]">
              System Overview
            </span>
            <h1 className="mt-2 text-2xl font-bold text-[#102A1C]">Dashboard</h1>
            <p className="text-sm text-[#64748B]">
              Whole-system health, live events, sensor readings, and droppings analysis status.
            </p>
          </div>
        </div>
      </div>
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
    </div>
  );
}
