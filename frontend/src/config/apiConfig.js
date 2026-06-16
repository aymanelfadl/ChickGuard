export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const DASHBOARD_ENDPOINTS = {
  overview: "/api/dashboard/overview",
  latestStatus: "/api/dashboard/latest-status",
  dailyTraceability: "/api/dashboard/daily-traceability",
  healthHistory: "/api/dashboard/health-history",
  alerts: "/api/dashboard/alerts",
};

export const AUTH_ENDPOINTS = {
  register: "/api/auth/register",
  login: "/api/auth/login",
  me: "/api/auth/me",
};

export const FARM_ENDPOINTS = {
  farms: "/api/farms",
  farm: (farmId) => `/api/farms/${farmId}`,
  farmCoops: (farmId) => `/api/farms/${farmId}/coops`,
};

export const COOP_ENDPOINTS = {
  coop: (coopId) => `/api/coops/${coopId}`,
  coopDevices: (coopId) => `/api/coops/${coopId}/devices`,
};

export const DEVICE_ENDPOINTS = {
  devices: "/api/devices",
  register: "/api/devices/register",
  device: (deviceId) => `/api/devices/${deviceId}`,
  cameraPairing: (deviceId) => `/api/devices/${deviceId}/camera-pairing`,
};

export const IMAGE_GALLERY_ENDPOINTS = {
  gallery: "/api/image-gallery",
  detail: (readingId) => `/api/image-gallery/${readingId}`,
};

export const REPORT_ENDPOINTS = {
  options: "/api/reports/options",
  farmReport: (farmId) => `/api/farms/${farmId}/report`,
  coopReport: (coopId) => `/api/coops/${coopId}/report`,
};
