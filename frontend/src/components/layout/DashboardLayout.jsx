import { AlertTriangle, BarChart3, Building2, Camera, Images, LayoutDashboard, Settings, Menu, X } from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, roles: ["admin", "manager", "viewer"] },
  { label: "Farms", to: "/farms", icon: Building2, roles: ["admin", "manager"] },
  { label: "Devices / Cameras", to: "/devices", icon: Camera, roles: ["admin", "manager"] },
  { label: "Image Gallery", to: "/gallery", icon: Images, roles: ["admin", "manager"] },
  { label: "Alerts", to: "/alerts", icon: AlertTriangle, roles: ["admin", "manager"] },
  { label: "Reports", to: "/reports", icon: BarChart3, roles: ["admin", "manager", "viewer"] },
  { label: "Settings", to: "/settings", icon: Settings, roles: ["admin"] },
];

function Sidebar({ user, onNavigate }) {
  const visibleItems = navItems.filter((item) => item.roles.includes(user?.role || "viewer"));

  return (
    <aside className="flex h-full w-full flex-col bg-white lg:bg-transparent">
      <nav className="flex flex-col gap-1 p-4 lg:p-0">
        {visibleItems.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/dashboard"}
            onClick={onNavigate}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all duration-200",
                isActive
                  ? "bg-gray-100 text-[#1C2B21] font-bold shadow-sm"
                  : "text-[#6B7280] font-medium hover:bg-gray-50 hover:text-[#1C2B21]",
              ].join(" ")
            }
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default function DashboardLayout({ header, children, user }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#F9FAF9] font-sans text-[#1C2B21]">
      {/* Mobile Top Bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between bg-white/80 px-4 py-3 shadow-sm backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#15803D] text-sm font-bold text-white shadow-apple-sm">
            P
          </div>
          <span className="font-semibold tracking-tight text-[#1C2B21]">Poultry Health</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="rounded-lg p-2 text-[#6B7280] transition-colors hover:bg-gray-100"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Slide-Over */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 right-0 flex w-72 flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 p-4">
              <span className="font-semibold text-[#1C2B21]">Menu</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar user={user} onNavigate={() => setIsMobileMenuOpen(false)} />
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {header}
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Desktop Sidebar */}
          <div className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-8">
              <Sidebar user={user} />
            </div>
          </div>
          {/* Main Content */}
          <div className="min-w-0 flex-1 space-y-8">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
