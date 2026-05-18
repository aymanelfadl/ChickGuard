import { AlertTriangle, BarChart3, Building2, Camera, LayoutDashboard, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard, roles: ["admin", "manager", "viewer"] },
  { label: "Farms", to: "/farms", icon: Building2, roles: ["admin", "manager"] },
  { label: "Devices / Cameras", to: "/devices", icon: Camera, roles: ["admin", "manager"] },
  { label: "Alerts", to: "/alerts", icon: AlertTriangle, roles: ["admin", "manager", "viewer"] },
  { label: "Reports", to: "/reports", icon: BarChart3, roles: ["admin", "manager", "viewer"] },
  { label: "Settings", to: "/settings", icon: Settings, roles: ["admin"] },
];

function Sidebar({ user }) {
  const visibleItems = navItems.filter((item) => item.roles.includes(user?.role || "viewer"));

  return (
    <aside className="rounded-lg border border-[#E2E8F0] bg-white p-3 shadow-sm lg:sticky lg:top-6 lg:h-fit">
      <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
        {visibleItems.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              [
                "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition",
                isActive
                  ? "bg-[#DCFCE7] text-[#14532D]"
                  : "text-[#64748B] hover:bg-[#F8FBF8] hover:text-[#14532D]",
              ].join(" ")
            }
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default function DashboardLayout({ header, children, user }) {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10">
        {header}
        <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
          <Sidebar user={user} />
          <div className="min-w-0 space-y-6">{children}</div>
        </div>
      </div>
    </main>
  );
}
