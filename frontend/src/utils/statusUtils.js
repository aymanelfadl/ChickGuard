const STATUS_CLASS_NAMES = {
  healthy: "bg-green-50 text-[#15803D] ring-green-200",
  sick: "bg-red-50 text-red-700 ring-red-200",
  online: "bg-green-50 text-[#15803D] ring-green-200",
  offline: "bg-gray-50 text-[#6B7280] ring-gray-200",
  unknown: "bg-gray-50 text-[#6B7280] ring-gray-200",
};

export function getStatusLabel(status) {
  if (isOnlineStatus(status)) {
    return "Online";
  }

  if (isOfflineStatus(status)) {
    return "Offline";
  }

  if (isHealthyStatus(status)) {
    return "Healthy";
  }

  if (isSickStatus(status)) {
    return "Sick";
  }

  return "Unknown";
}

export function getStatusClassName(status) {
  const normalized = status?.toLowerCase?.() || "unknown";
  return STATUS_CLASS_NAMES[normalized] || STATUS_CLASS_NAMES.unknown;
}

export function isSickStatus(status) {
  return status?.toLowerCase?.() === "sick";
}

export function isHealthyStatus(status) {
  return status?.toLowerCase?.() === "healthy";
}

export function isOnlineStatus(status) {
  return status?.toLowerCase?.() === "online";
}

export function isOfflineStatus(status) {
  return status?.toLowerCase?.() === "offline";
}
