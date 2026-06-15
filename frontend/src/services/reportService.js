import { REPORT_ENDPOINTS } from "../config/apiConfig.js";
import { fetchJson } from "./apiClient.js";

export function fetchReportOptions() {
  return fetchJson(REPORT_ENDPOINTS.options);
}

export function fetchFarmReport(farmId, options = {}) {
  return fetchJson(withQuery(REPORT_ENDPOINTS.farmReport(farmId), options));
}

export function fetchCoopReport(coopId, options = {}) {
  return fetchJson(withQuery(REPORT_ENDPOINTS.coopReport(coopId), options));
}

function withQuery(path, options = {}) {
  const params = new URLSearchParams();
  if (options.date) {
    params.set("date", options.date);
  }
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
