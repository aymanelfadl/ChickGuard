import { COOP_ENDPOINTS, FARM_ENDPOINTS } from "../config/apiConfig.js";
import { fetchJson } from "./apiClient.js";

export function fetchCoop(coopId) {
  return fetchJson(COOP_ENDPOINTS.coop(coopId));
}

export const getCoop = fetchCoop;

export function fetchCoopDevices(coopId) {
  return fetchJson(COOP_ENDPOINTS.coopDevices(coopId));
}

export function getFarmCoops(farmId) {
  return fetchJson(FARM_ENDPOINTS.farmCoops(farmId));
}

export function createCoop(farmId, payload) {
  return fetchJson(FARM_ENDPOINTS.farmCoops(farmId), {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
