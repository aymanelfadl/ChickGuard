import ErrorState from "../components/common/ErrorState.jsx";
import DecisionRules from "../components/common/DecisionRules.jsx";
import LiveUpdateStatus from "../components/common/LiveUpdateStatus.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import BusinessGuide from "../components/dashboard/BusinessGuide.jsx";
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
    <div className="w-full space-y-8 pb-12">
      <div className="space-y-4">
        <Breadcrumbs items={[{ label: "Dashboard", to: "/dashboard" }]} levelLabel="System Overview" />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#1C2B21]">Today</h1>
            <p className="mt-1 text-sm text-[#64748B]">
              What needs attention now, what is running, and where to go next.
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

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-[#1C2B21]">Admin Brief</h2>
        <RecommendedActions alerts={alerts} overview={overview} decisions={latestStatus?.decisions || []} />
        <DecisionRules
          decisions={latestStatus?.decisions || []}
          title="Current Decision"
          description="Latest rule output from sensors, droppings analysis, and day/night context."
          limit={3}
          compact
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-[#1C2B21]">Operational Snapshot</h2>
        <OperationsCards overview={overview} />
        <LatestStatus status={latestStatus} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-[#1C2B21]">Evidence And Trends</h2>
        <NeedsAttention alerts={alerts} />
        <DataActivityCards overview={overview} />
        <HealthHistoryChart history={healthHistory} />
      </section>
{/* 
      <BusinessGuide /> */}
    </div>
  );
}
