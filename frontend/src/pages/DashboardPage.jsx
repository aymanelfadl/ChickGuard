import ErrorState from "../components/common/ErrorState.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import AlertsTable from "../components/dashboard/AlertsTable.jsx";
import HealthHistoryChart from "../components/dashboard/HealthHistoryChart.jsx";
import LatestStatus from "../components/dashboard/LatestStatus.jsx";
import OverviewCards from "../components/dashboard/OverviewCards.jsx";
import { useDashboardData } from "../hooks/useDashboardData.js";

export default function DashboardPage() {
  const { overview, latestStatus, healthHistory, alerts, isLoading, error } = useDashboardData();

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <>
      <OverviewCards overview={overview} />
      <LatestStatus status={latestStatus} />
      <HealthHistoryChart history={healthHistory} />
      <AlertsTable alerts={alerts} />
    </>
  );
}
