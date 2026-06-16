import { useCallback, useEffect, useState } from "react";

import {
  fetchAlerts,
  fetchDashboardOverview,
  fetchDailyTraceability,
  fetchHealthHistory,
  fetchLatestStatus,
} from "../services/dashboardService.js";
import {
  normalizeAlerts,
  normalizeHealthHistory,
  normalizeLatestStatus,
  normalizeOverview,
} from "../models/dashboardModels.js";

export function useDashboardData() {
  const [overview, setOverview] = useState(normalizeOverview());
  const [latestStatus, setLatestStatus] = useState(normalizeLatestStatus());
  const [dailyTraceability, setDailyTraceability] = useState(null);
  const [healthHistory, setHealthHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const refreshDashboardData = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const [overviewData, latestStatusData, traceabilityData, healthHistoryData, alertsData] = await Promise.all([
        fetchDashboardOverview(),
        fetchLatestStatus(),
        fetchDailyTraceability(),
        fetchHealthHistory(),
        fetchAlerts(),
      ]);

      setOverview(normalizeOverview(overviewData));
      setLatestStatus(normalizeLatestStatus(latestStatusData));
      setDailyTraceability(traceabilityData);
      setHealthHistory(normalizeHealthHistory(healthHistoryData));
      setAlerts(normalizeAlerts(alertsData));
      setLastUpdatedAt(new Date().toISOString());
      return true;
    } catch (err) {
      if (showLoading) {
        setError(
          err instanceof Error ? err.message : "Unable to load dashboard data from the backend.",
        );
      }
      return false;
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    refreshDashboardData();
  }, [refreshDashboardData]);

  return {
    overview,
    latestStatus,
    dailyTraceability,
    healthHistory,
    alerts,
    isLoading,
    error,
    lastUpdatedAt,
    refreshDashboardData,
  };
}
