import ErrorState from "../components/common/ErrorState.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import AlertsTable from "../components/dashboard/AlertsTable.jsx";
import { useDashboardData } from "../hooks/useDashboardData.js";

export default function AlertsPage() {
  const { alerts, isLoading, error } = useDashboardData();

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-[#102A1C]">Health Alerts</h2>
        <p className="text-sm text-[#64748B]">Farm and coop health alerts generated from poultry droppings analysis.</p>
      </div>
      <AlertsTable alerts={alerts} />
    </section>
  );
}
