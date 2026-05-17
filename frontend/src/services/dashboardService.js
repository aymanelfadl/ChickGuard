import { API_BASE_URL, DASHBOARD_ENDPOINTS } from "../config/apiConfig.js";
import { getToken } from "../utils/tokenStorage.js";

async function fetchJson(endpoint) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error(`Backend returned ${response.status} for ${endpoint}`);
  }

  return response.json();
}

export function fetchDashboardOverview() {
  return fetchJson(DASHBOARD_ENDPOINTS.overview);
}

export function fetchLatestStatus() {
  return fetchJson(DASHBOARD_ENDPOINTS.latestStatus);
}

export function fetchHealthHistory() {
  return fetchJson(DASHBOARD_ENDPOINTS.healthHistory);
}

export function fetchAlerts() {
  return fetchJson(DASHBOARD_ENDPOINTS.alerts);
}
