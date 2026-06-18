import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Building2,
  ChevronRight,
  Cpu,
  Images,
  LayoutDashboard,
  Menu,
  Settings,
  X,
} from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";

const navSections = [
  {
    title: "Operate",
    items: [
      {
        label: "Dashboard",
        description: "Today status and next actions",
        to: "/dashboard",
        icon: LayoutDashboard,
        roles: ["admin", "manager", "viewer"],
      },
      {
        label: "Farms",
        description: "Farm -> coop structure",
        to: "/farms",
        icon: Building2,
        roles: ["admin", "manager"],
      },
      {
        label: "Devices",
        description: "ESP32 sensors and cameras",
        to: "/devices",
        icon: Cpu,
        roles: ["admin", "manager"],
      },
    ],
  },
  {
    title: "Health Evidence",
    items: [
      {
        label: "Image Alerts",
        description: "Disease alerts from droppings images",
        to: "/alerts",
        icon: AlertTriangle,
        roles: ["admin", "manager"],
      },
      {
        label: "Image Gallery",
        description: "Droppings analysis evidence",
        to: "/gallery",
        icon: Images,
        roles: ["admin", "manager"],
      },
    ],
  },
  {
    title: "Business",
    items: [
      {
        label: "Reports",
        description: "Daily traceability and decisions",
        to: "/reports",
        icon: BarChart3,
        roles: ["admin", "manager", "viewer"],
      },
      {
        label: "Settings",
        description: "Admin configuration",
        to: "/settings",
        icon: Settings,
        roles: ["admin"],
      },
    ],
  },
];

const workflowSteps = ["Farms", "Farm", "Coop", "Device", "Report"];

function Sidebar({ user, onNavigate }) {
  const role = user?.role || "viewer";
  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((section) => section.items.length);

  return (
    <aside className="flex h-full w-full flex-col bg-white">
      <div className="border-b border-gray-200 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#14532D] text-sm font-bold text-white">
            PH
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[#1C2B21]">Poultry Health</p>
            <p className="truncate text-xs text-[#6B7280]">Operations console</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {visibleSections.map((section) => (
          <div key={section.title}>
            <p className="px-3 text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">
              {section.title}
            </p>
            <div className="mt-2 space-y-1">
              {section.items.map(({ label, description, to, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/dashboard"}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    [
                      "group flex items-start gap-3 rounded-lg px-3 py-3 text-sm transition-colors",
                      isActive
                        ? "bg-[#ECFDF3] text-[#14532D] ring-1 ring-[#BBF7D0]"
                        : "text-[#475569] hover:bg-gray-50 hover:text-[#1C2B21]",
                    ].join(" ")
                  }
                >
                  <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block font-semibold">{label}</span>
                    <span className="mt-0.5 block truncate text-xs opacity-75">{description}</span>
                  </span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default function DashboardLayout({ header, children, user }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans text-[#1C2B21]">
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#14532D] text-xs font-bold text-white">
            PH
          </div>
          <span className="font-semibold tracking-tight text-[#1C2B21]">Operations</span>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="rounded-lg p-2 text-[#475569] hover:bg-gray-100"
          aria-label="Open navigation"
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/20" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 flex w-[86vw] max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <span className="font-semibold text-[#1C2B21]">Navigation</span>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-lg p-2 text-[#64748B] hover:bg-gray-100"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <Sidebar user={user} onNavigate={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="min-h-screen lg:grid lg:grid-cols-[296px_minmax(0,1fr)]">
        <div className="hidden border-r border-gray-200 bg-white lg:block">
          <div className="sticky top-0 h-screen">
            <Sidebar user={user} />
          </div>
        </div>
        <div className="min-w-0">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
            {header}
            <div className="min-w-0">{children}</div>
          </div>
        </div>
      </div>
    </main>
  );
}
