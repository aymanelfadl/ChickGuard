import { Activity, Camera, CheckCircle2, Siren } from "lucide-react";

export default function DataActivityCards({ overview }) {
  const cards = [
    {
      label: "Sensor Readings",
      value: overview.totalSensorReadings || 0,
      description: "Environment samples",
      icon: Activity,
    },
    {
      label: "Droppings Images",
      value: overview.totalImageReadings || 0,
      description: "Fecal captures",
      icon: Camera,
    },
    {
      label: "Healthy Detections",
      value: overview.healthyDetections || 0,
      description: "Clear droppings",
      icon: CheckCircle2,
    },
    {
      label: "Sick Detections",
      value: overview.sickDetections || 0,
      description: "Health alerts",
      icon: Siren,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
