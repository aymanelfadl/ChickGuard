import ErrorState from "../components/common/ErrorState.jsx";
import LiveUpdateStatus from "../components/common/LiveUpdateStatus.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import HealthHistoryChart from "../components/dashboard/HealthHistoryChart.jsx";
import LatestStatus from "../components/dashboard/LatestStatus.jsx";
import OperationsCards from "../components/dashboard/OperationsCards.jsx";
import DataActivityCards from "../components/dashboard/DataActivityCards.jsx";
import RecommendedActions from "../components/dashboard/RecommendedActions.jsx";
import NeedsAttention from "../components/dashboard/NeedsAttention.jsx";
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
    <div className="w-full space-y-12 pb-12">
      {/* Header and Breadcrumbs */}
      <div className="space-y-4">
        <Breadcrumbs items={[{ label: "Dashboard", to: "/dashboard" }]} levelLabel="System Overview" />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#1C2B21]">Dashboard</h1>
            <p className="mt-1 text-sm text-[#6B7280]">
              Whole-system health, live events, sensor readings, and droppings analysis status.
            </p>
          </div>
        </div>
      </div>
      
      {/* A. System Status */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-[#1C2B21]">System Status</h2>
        <LiveUpdateStatus
          realtimeStatus={realtime?.status}
          lastUpdatedAt={lastUpdatedAt}
          liveUpdateReceived={liveUpdateReceived}
          lastEventType={lastRefreshEventType}
          isRefreshing={isRefreshing}
          onRefresh={refreshManually}
        />
        <RecommendedActions alerts={alerts} overview={overview} />
      </section>
      
      {/* B. Health Attention */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-[#1C2B21]">Health Attention</h2>
        <NeedsAttention alerts={alerts} />
        <LatestStatus status={latestStatus} />
      </section>

      {/* C. Operations */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-[#1C2B21]">Operations</h2>
        <OperationsCards overview={overview} />
      </section>

      {/* D. Data Activity */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-[#1C2B21]">Data Activity</h2>
        <DataActivityCards overview={overview} />
        <HealthHistoryChart history={healthHistory} />
      </section>
    </div>
  );
}
