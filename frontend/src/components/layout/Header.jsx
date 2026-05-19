import { Activity, LogOut, RefreshCw, UserCircle } from "lucide-react";

function realtimeLabel(status) {
  if (status === "connected") {
    return "Live operations";
  }
  if (status === "connecting") {
    return "Connecting realtime";
  }
  return "Realtime disconnected";
}

export default function Header({ isRefreshing, onRefresh, realtimeStatus, user, onLogout }) {
  const isRealtimeDisconnected = realtimeStatus === "disconnected" || realtimeStatus === "error";

  return (
    <header className="rounded-lg border border-[#BFE7C8] bg-gradient-to-br from-[#F8FBF8] via-[#ECFDF3] to-[#DCFCE7] p-5 shadow-[0_24px_70px_rgba(20,83,45,0.12)] sm:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#BFE7C8] bg-white/80 px-3 py-1 text-xs font-semibold uppercase text-[#14532D]">
            <span className="h-2 w-2 rounded-full bg-[#22C55E] shadow-[0_0_0_4px_rgba(34,197,94,0.16)]" />
            System Online
          </div>
          <h1 className="text-3xl font-bold text-[#102A1C] sm:text-4xl">
            Poultry Health Intelligence
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[#64748B]">
            Real-time IoT monitoring, growth tracking, and AI analysis based on poultry droppings images.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
          <div className="inline-flex items-center gap-2 rounded-lg border border-[#CFE8D7] bg-white/85 px-4 py-3 text-sm font-medium text-[#14532D] shadow-sm">
            <Activity
              className={`h-4 w-4 ${isRealtimeDisconnected ? "text-[#DC2626]" : "text-[#16A34A]"}`}
              aria-hidden="true"
            />
            {realtimeLabel(realtimeStatus)}
          </div>
          <div className="inline-flex min-w-0 items-center gap-2 rounded-lg border border-[#CFE8D7] bg-white/85 px-4 py-3 text-sm text-[#102A1C] shadow-sm">
            <UserCircle className="h-4 w-4 shrink-0 text-[#16A34A]" aria-hidden="true" />
            <span className="min-w-0 truncate font-medium" title={user?.email}>
              {user?.full_name || user?.email || "Dashboard User"}
            </span>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#14532D] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(20,83,45,0.24)] transition hover:bg-[#166534] disabled:cursor-not-allowed disabled:bg-[#94A3B8] disabled:shadow-none"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden="true" />
            {isRefreshing ? "Refreshing" : "Refresh Data"}
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#CFE8D7] bg-white/90 px-5 py-3 text-sm font-semibold text-[#14532D] shadow-sm transition hover:bg-[#F0FDF4]"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
