import { ArrowRight, BarChart3, Building2, Cpu, FileText } from "lucide-react";
import { Link } from "react-router-dom";

const guideItems = [
  {
    title: "Farms",
    to: "/farms",
    icon: Building2,
    contains: "Farm list, coop count, droppings image alerts, and farm-level reports.",
  },
  {
    title: "Coops",
    to: "/farms",
    icon: FileText,
    contains: "Coop devices, latest sensor values, latest droppings analysis, and coop report link.",
  },
  {
    title: "Devices",
    to: "/devices",
    icon: Cpu,
    contains: "ESP32 sensor registry, API-key status, last seen time, and latest telemetry.",
  },
  {
    title: "Reports",
    to: "/reports",
    icon: BarChart3,
    contains: "Daily traceability, rule actions, image alerts, device readiness, and evidence summary.",
  },
];

export default function BusinessGuide() {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight text-[#1C2B21]">Business Navigation</h2>
        <p className="text-sm leading-6 text-[#64748B]">
          The console is organized by operational depth: farm, coop, device, and daily report.
        </p>
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {guideItems.map(({ title, to, icon: Icon, contains }) => (
          <Link
            key={title}
            to={to}
            className="group flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-[#F8FAFC] p-4 transition-colors hover:border-[#86EFAC] hover:bg-[#F0FDF4]"
          >
            <div className="flex min-w-0 gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#14532D] ring-1 ring-gray-200">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[#1C2B21]">{title}</p>
                <p className="mt-1 text-sm leading-6 text-[#64748B]">{contains}</p>
              </div>
            </div>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#94A3B8] transition-colors group-hover:text-[#14532D]" />
          </Link>
        ))}
      </div>
    </section>
  );
}
