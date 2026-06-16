import { DASHBOARD_ENDPOINTS } from "../config/apiConfig.js";
import { fetchJson } from "./apiClient.js";

export function fetchDashboardOverview() {
  return fetchJson(DASHBOARD_ENDPOINTS.overview);
}

export function fetchLatestStatus() {
  return fetchJson(DASHBOARD_ENDPOINTS.latestStatus);
}

export function fetchDailyTraceability() {
  return fetchJson(DASHBOARD_ENDPOINTS.dailyTraceability);
}

export function fetchHealthHistory() {
  return fetchJson(DASHBOARD_ENDPOINTS.healthHistory);
}

export function fetchAlerts() {
  return fetchJson(DASHBOARD_ENDPOINTS.alerts);
}
