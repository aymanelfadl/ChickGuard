import { Activity, Camera, CheckCircle2, Cpu, RadioTower, Siren } from "lucide-react";

const overviewCards = [
  {
    label: "Total Devices",
    key: "totalDevices",
    description: "Registered edge units",
    icon: Cpu,
  },
  {
    label: "Active Devices",
    key: "activeDevices",
    description: "Ready for telemetry",
    icon: RadioTower,
  },
  {
    label: "Sensor Readings",
    key: "totalSensorReadings",
    description: "Environment samples",
    icon: Activity,
  },
  {
    label: "Droppings Images",
    key: "totalImageReadings",
    description: "Fecal image captures",
    icon: Camera,
  },
  {
    label: "Healthy Detections",
    key: "healthyDetections",
    description: "Clear droppings analyses",
    icon: CheckCircle2,
  },
  {
    label: "Sick Detections",
    key: "sickDetections",
    description: "Health alerts flagged",
    icon: Siren,
  },
];

export default function OverviewCards({ overview }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
      {overviewCards.map(({ label, key, description, icon: Icon }) => (
        <article
          key={key}
          className="group rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-[0_18px_45px_rgba(20,83,45,0.06)] transition duration-200 hover:-translate-y-0.5 hover:border-[#86EFAC] hover:shadow-[0_24px_60px_rgba(20,83,45,0.12)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#64748B]">{label}</p>
              <p className="mt-2 text-3xl font-bold text-[#102A1C]">{overview[key]}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#DCFCE7] text-[#14532D] ring-1 ring-[#BBF7D0] transition group-hover:bg-[#16A34A] group-hover:text-white">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-[#64748B]">{description}</p>
        </article>
      ))}
    </section>
  );
}
