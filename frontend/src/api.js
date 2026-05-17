const API_BASE_URL = "http://localhost:8000";

async function fetchJson(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`Backend returned ${response.status} for ${path}`);
  }

  return response.json();
}

export function getOverview() {
  return fetchJson("/api/dashboard/overview");
}

export function getLatestStatus() {
  return fetchJson("/api/dashboard/latest-status");
}

export function getHealthHistory() {
  return fetchJson("/api/dashboard/health-history");
}

export function getAlerts() {
  return fetchJson("/api/dashboard/alerts");
}

export { API_BASE_URL };
