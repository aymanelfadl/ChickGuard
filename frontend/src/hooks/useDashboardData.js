import { useCallback, useEffect, useState } from "react";

import {
  fetchAlerts,
  fetchDashboardOverview,
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
      const [overviewData, latestStatusData, healthHistoryData, alertsData] = await Promise.all([
        fetchDashboardOverview(),
        fetchLatestStatus(),
        fetchHealthHistory(),
        fetchAlerts(),
      ]);

      setOverview(normalizeOverview(overviewData));
      setLatestStatus(normalizeLatestStatus(latestStatusData));
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
    healthHistory,
    alerts,
    isLoading,
    error,
    lastUpdatedAt,
    refreshDashboardData,
  };
}
