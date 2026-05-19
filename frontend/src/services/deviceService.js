import { DEVICE_ENDPOINTS } from "../config/apiConfig.js";
import { fetchJson } from "./apiClient.js";

export function fetchDevices() {
  return fetchJson(DEVICE_ENDPOINTS.devices);
}

export const getDevices = fetchDevices;

export function fetchDevice(deviceId) {
  return fetchJson(DEVICE_ENDPOINTS.device(deviceId));
}

export const getDevice = fetchDevice;

export function registerDevice(payload) {
  return fetchJson(DEVICE_ENDPOINTS.register, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateDevice(deviceId, payload) {
  return fetchJson(DEVICE_ENDPOINTS.device(deviceId), {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
