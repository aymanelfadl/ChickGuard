export function formatDateTime(value) {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "N/A";
  }

  return Number(value).toFixed(decimals);
}

export function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "N/A";
  }

  return `${Math.round(Number(value) * 100)}%`;
}

export function formatTemperature(value) {
  return value === null || value === undefined ? "N/A" : `${formatNumber(value, 1)} C`;
}

export function formatWeight(value) {
  return value === null || value === undefined ? "N/A" : `${formatNumber(value, 2)} kg`;
}

export function formatHumidity(value) {
  return value === null || value === undefined ? "N/A" : `${formatNumber(value, 0)}%`;
}
