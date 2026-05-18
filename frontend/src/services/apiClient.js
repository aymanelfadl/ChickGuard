import { API_BASE_URL } from "../config/apiConfig.js";
import { getToken } from "../utils/tokenStorage.js";

export async function fetchJson(endpoint, options = {}) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.detail || `Backend returned ${response.status} for ${endpoint}`);
  }

  return payload;
}
