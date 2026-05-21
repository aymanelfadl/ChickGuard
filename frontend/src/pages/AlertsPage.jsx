import { useCallback, useEffect, useState } from "react";

import ErrorState from "../components/common/ErrorState.jsx";
import LiveUpdateStatus from "../components/common/LiveUpdateStatus.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import AlertsTable from "../components/dashboard/AlertsTable.jsx";
import { useRealtimeRefresh } from "../hooks/useRealtimeRefresh.js";
import { normalizeAlerts } from "../models/dashboardModels.js";
import { fetchAlerts } from "../services/dashboardService.js";
import Breadcrumbs from "../components/navigation/Breadcrumbs.jsx";

export default function AlertsPage({ realtime }) {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const loadAlerts = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const alertData = await fetchAlerts();
      setAlerts(normalizeAlerts(alertData));
      setLastUpdatedAt(new Date().toISOString());
      return true;
    } catch (loadError) {
      if (showLoading) {
        setError(loadError.message || "Unable to load alerts.");
      }
      return false;
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, []);
  const { isRefreshing, lastRefreshEventType, liveUpdateReceived, refreshManually } = useRealtimeRefresh(
    realtime,
    loadAlerts,
  );

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <section className="space-y-4">
      <Breadcrumbs items={[{ label: "Alerts", to: "/alerts" }]} levelLabel="System Alerts" />
      <LiveUpdateStatus
        realtimeStatus={realtime?.status}
        lastUpdatedAt={lastUpdatedAt}
        liveUpdateReceived={liveUpdateReceived}
        lastEventType={lastRefreshEventType}
        isRefreshing={isRefreshing}
        onRefresh={refreshManually}
      />
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#1C2B21]">Health Alerts</h2>
        <p className="mt-1 text-sm text-[#6B7280]">Farm and coop health alerts generated from poultry droppings analysis.</p>
      </div>
      <AlertsTable alerts={alerts} />
    </section>
  );
}
