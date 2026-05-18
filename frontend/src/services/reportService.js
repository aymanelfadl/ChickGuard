import { REPORT_ENDPOINTS } from "../config/apiConfig.js";
import { fetchJson } from "./apiClient.js";

export function fetchReportOptions() {
  return fetchJson(REPORT_ENDPOINTS.options);
}

export function fetchFarmReport(farmId) {
  return fetchJson(REPORT_ENDPOINTS.farmReport(farmId));
}

export function fetchCoopReport(coopId) {
  return fetchJson(REPORT_ENDPOINTS.coopReport(coopId));
}
