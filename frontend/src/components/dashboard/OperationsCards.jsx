import { Building2, Cpu, RadioTower } from "lucide-react";
import Card from "../common/Card.jsx";

export default function OperationsCards({ overview }) {
  const cards = [
    {
      label: "Farms Monitored",
      value: overview.totalFarms || 0,
      description: "Active poultry locations",
      icon: Building2,
    },
    {
      label: "Total Devices",
      value: overview.totalDevices || 0,
      description: "Registered edge units",
      icon: Cpu,
    },
    {
      label: "Active Devices",
      value: overview.activeDevices || 0,
      description: "Ready for telemetry",
      icon: RadioTower,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      {cards.map(({ label, value, description, icon: Icon }) => (
        <article
          key={label}
          className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-apple-sm transition duration-300 hover:shadow-apple hover:-translate-y-0.5"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#6B7280]">{label}</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-[#1C2B21]">{value}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F9FAF9] text-[#15803D] ring-1 ring-gray-100 transition-colors group-hover:bg-[#15803D] group-hover:text-white">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </div>
          </div>
          <p className="mt-4 text-xs font-medium text-[#6B7280]">{description}</p>
        </article>
      ))}
    </div>
  );
}
