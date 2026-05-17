import { useCallback, useEffect, useState } from "react";

import { getAlerts, getHealthHistory, getLatestStatus, getOverview } from "./api.js";
import AlertsTable from "./components/AlertsTable.jsx";
import HealthHistoryChart from "./components/HealthHistoryChart.jsx";
import LatestStatus from "./components/LatestStatus.jsx";
import OverviewCards from "./components/OverviewCards.jsx";

export default function App() {
  const [overview, setOverview] = useState(null);
  const [latestStatus, setLatestStatus] = useState(null);
  const [healthHistory, setHealthHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [overviewData, latestStatusData, healthHistoryData, alertsData] = await Promise.all([
        getOverview(),
        getLatestStatus(),
        getHealthHistory(),
        getAlerts(),
      ]);

      setOverview(overviewData);
      setLatestStatus(latestStatusData);
      setHealthHistory(healthHistoryData);
      setAlerts(alertsData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard data from the backend.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-950">Poultry Health Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">
              Live backend data for devices, sensor readings, predictions, and alerts.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDashboardData}
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        {isLoading ? (
          <section className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            Loading dashboard...
          </section>
        ) : error ? (
          <section className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
            Could not load dashboard data. Make sure the FastAPI backend is running at
            http://localhost:8000. Details: {error}
          </section>
        ) : (
          <>
            <OverviewCards overview={overview} />
            <LatestStatus status={latestStatus} />
            <HealthHistoryChart history={healthHistory} />
            <AlertsTable alerts={alerts} />
          </>
        )}
      </div>
    </main>
  );
}
