const STATUS_CLASS_NAMES = {
  healthy: "bg-[#DCFCE7] text-[#14532D] ring-[#86EFAC]",
  sick: "bg-red-50 text-[#DC2626] ring-red-200",
  online: "bg-[#DCFCE7] text-[#14532D] ring-[#86EFAC]",
  offline: "bg-slate-100 text-[#475569] ring-slate-300",
  unknown: "bg-slate-100 text-[#64748B] ring-slate-200",
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
