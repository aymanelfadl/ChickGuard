import { RefreshCw, Radio, WifiOff } from "lucide-react";

import { formatDateTime } from "../../utils/formatters.js";

function realtimeLabel(status) {
  if (status === "connected") {
    return "Realtime connected";
  }
  if (status === "connecting") {
    return "Connecting realtime";
  }
  return "Realtime disconnected";
}

function liveUpdateText(eventType, fallback) {
  if (eventType === "device_status_updated") {
    return "Device status updated";
  }
  return fallback;
}

export default function LiveUpdateStatus({
  realtimeStatus,
  lastUpdatedAt,
  liveUpdateReceived,
  liveUpdateLabel = "Live update received",
  lastEventType,
  isRefreshing,
  onRefresh,
}) {
  const isDisconnected = realtimeStatus === "disconnected" || realtimeStatus === "error";
  const Icon = isDisconnected ? WifiOff : Radio;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
        <span
          className={[
            "inline-flex items-center gap-2 rounded-full border px-3 py-1 font-semibold",
            isDisconnected
              ? "border-[#FECACA] bg-red-50 text-[#B91C1C]"
              : "border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]",
          ].join(" ")}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          {realtimeLabel(realtimeStatus)}
        </span>
        {liveUpdateReceived ? (
          <span className="rounded-full border border-[#BFDBFE] bg-blue-50 px-3 py-1 font-semibold text-[#1D4ED8]">
            {liveUpdateText(lastEventType, liveUpdateLabel)}
          </span>
        ) : null}
        <span className="text-[#64748B]">
          Last updated at {lastUpdatedAt ? formatDateTime(lastUpdatedAt) : "N/A"}
        </span>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#CFE8D7] bg-white px-4 py-2 text-sm font-semibold text-[#14532D] shadow-sm transition hover:bg-[#F0FDF4] disabled:cursor-not-allowed disabled:text-[#94A3B8]"
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden="true" />
        Refresh
      </button>
    </div>
  );
}
