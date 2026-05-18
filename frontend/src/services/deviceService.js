import { DEVICE_ENDPOINTS } from "../config/apiConfig.js";
import { fetchJson } from "./apiClient.js";

export function fetchDevices() {
  return fetchJson(DEVICE_ENDPOINTS.devices);
}

export function fetchDevice(deviceId) {
  return fetchJson(DEVICE_ENDPOINTS.device(deviceId));
}
