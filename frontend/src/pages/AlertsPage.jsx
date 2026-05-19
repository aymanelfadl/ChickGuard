import { useCallback, useEffect, useState } from "react";

import ErrorState from "../components/common/ErrorState.jsx";
import LiveUpdateStatus from "../components/common/LiveUpdateStatus.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import AlertsTable from "../components/dashboard/AlertsTable.jsx";
import { useRealtimeRefresh } from "../hooks/useRealtimeRefresh.js";
import { normalizeAlerts } from "../models/dashboardModels.js";
import { fetchAlerts } from "../services/dashboardService.js";

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
      <LiveUpdateStatus
        realtimeStatus={realtime?.status}
        lastUpdatedAt={lastUpdatedAt}
        liveUpdateReceived={liveUpdateReceived}
        lastEventType={lastRefreshEventType}
        isRefreshing={isRefreshing}
        onRefresh={refreshManually}
      />
      <div>
        <h2 className="text-xl font-bold text-[#102A1C]">Health Alerts</h2>
        <p className="text-sm text-[#64748B]">Farm and coop health alerts generated from poultry droppings analysis.</p>
      </div>
      <AlertsTable alerts={alerts} />
    </section>
  );
}
