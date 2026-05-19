import { FARM_ENDPOINTS } from "../config/apiConfig.js";
import { fetchJson } from "./apiClient.js";

export function fetchFarms() {
  return fetchJson(FARM_ENDPOINTS.farms);
}

export const getFarms = fetchFarms;

export function fetchFarm(farmId) {
  return fetchJson(FARM_ENDPOINTS.farm(farmId));
}

export const getFarm = fetchFarm;

export function fetchFarmCoops(farmId) {
  return fetchJson(FARM_ENDPOINTS.farmCoops(farmId));
}

export function createFarm(payload) {
  return fetchJson(FARM_ENDPOINTS.farms, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
