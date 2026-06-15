import { LogOut, RefreshCw, UserCircle } from "lucide-react";

export default function Header({ isRefreshing, onRefresh, realtimeStatus, user, onLogout }) {
  const isRealtimeDisconnected = realtimeStatus === "disconnected" || realtimeStatus === "error";

  return (
    <header className="flex flex-col gap-4 border-b border-gray-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="hidden lg:flex lg:flex-col">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C2B21]">
          Operations Console
        </h1>
        <p className="mt-1 text-sm text-[#64748B]">
          Focused health monitoring, device activity, and daily traceability.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 lg:justify-end">
        <div
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-[#1C2B21] shadow-sm"
          title={`Realtime Status: ${realtimeStatus}`}
        >
          <span
            className={`h-2.5 w-2.5 rounded-full ${isRealtimeDisconnected ? "bg-red-500" : "bg-[#15803D]"}`}
          />
          <span className="truncate max-w-[120px] sm:max-w-none">
            {isRealtimeDisconnected ? "Offline" : "Live"}
          </span>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-[#1C2B21] shadow-sm">
          <UserCircle className="h-4 w-4 text-[#64748B]" />
          <span className="truncate max-w-[120px] sm:max-w-none">
            {user?.full_name || user?.email || "User"}
          </span>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-[#64748B] shadow-sm transition-colors hover:bg-gray-50 hover:text-[#1C2B21] disabled:opacity-50"
          title="Refresh Data"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>

        <button
          type="button"
          onClick={onLogout}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-[#64748B] shadow-sm transition-colors hover:bg-gray-50 hover:text-red-600"
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
