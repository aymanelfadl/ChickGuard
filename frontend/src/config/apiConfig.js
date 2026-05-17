export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const DASHBOARD_ENDPOINTS = {
  overview: "/api/dashboard/overview",
  latestStatus: "/api/dashboard/latest-status",
  healthHistory: "/api/dashboard/health-history",
  alerts: "/api/dashboard/alerts",
};

export const AUTH_ENDPOINTS = {
  register: "/api/auth/register",
  login: "/api/auth/login",
  me: "/api/auth/me",
};
