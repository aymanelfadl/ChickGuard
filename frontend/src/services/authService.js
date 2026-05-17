import { API_BASE_URL, AUTH_ENDPOINTS } from "../config/apiConfig.js";
import { clearToken, getToken } from "../utils/tokenStorage.js";

async function requestJson(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.detail || `Backend returned ${response.status}`);
  }

  return payload;
}

export function login(email, password) {
  return requestJson(AUTH_ENDPOINTS.login, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(email, fullName, password) {
  return requestJson(AUTH_ENDPOINTS.register, {
    method: "POST",
    body: JSON.stringify({ email, full_name: fullName, password }),
  });
}

export function getCurrentUser() {
  const token = getToken();
  if (!token) {
    throw new Error("No saved session");
  }

  return requestJson(AUTH_ENDPOINTS.me, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function logout() {
  clearToken();
}
