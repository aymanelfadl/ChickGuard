import { API_BASE_URL, IMAGE_GALLERY_ENDPOINTS } from "../config/apiConfig.js";
import { fetchJson } from "./apiClient.js";
import { getToken } from "../utils/tokenStorage.js";

function queryString(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      if (key === "date_from" && String(value).length === 10) {
        searchParams.set(key, `${value}T00:00:00Z`);
      } else if (key === "date_to" && String(value).length === 10) {
        searchParams.set(key, `${value}T23:59:59Z`);
      } else {
        searchParams.set(key, value);
      }
    }
  });
  const serialized = searchParams.toString();
  return serialized ? `?${serialized}` : "";
}

export function fetchImageGallery(filters = {}) {
  return fetchJson(`${IMAGE_GALLERY_ENDPOINTS.gallery}${queryString(filters)}`);
}

export function fetchImageAnalysisDetail(readingId) {
  return fetchJson(IMAGE_GALLERY_ENDPOINTS.detail(readingId));
}

export function authenticatedImageUrl(imageUrl) {
  const token = getToken();
  const absoluteUrl = imageUrl?.startsWith("http") ? imageUrl : `${API_BASE_URL}${imageUrl}`;
  if (!token) {
    return absoluteUrl;
  }

  const separator = absoluteUrl.includes("?") ? "&" : "?";
  return `${absoluteUrl}${separator}token=${encodeURIComponent(token)}`;
}
