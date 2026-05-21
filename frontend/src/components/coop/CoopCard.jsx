import { Link } from "react-router-dom";

import Card from "../common/Card.jsx";
import StatusBadge from "../dashboard/StatusBadge.jsx";

export default function CoopCard({ coop }) {
  return (
    <Card
      title={coop.name}
      description={coop.description || `Capacity: ${coop.capacity ?? "not set"}`}
      action={<StatusBadge status={coop.latest_health_status} />}
    >
      <div className="grid gap-4 text-sm text-[#6B7280] sm:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
          <p className="text-xs font-semibold text-[#6B7280]">Devices</p>
          <p className="mt-1 text-xl font-bold tracking-tight text-[#1C2B21]">{coop.number_of_devices ?? 0}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
          <p className="text-xs font-semibold text-[#6B7280]">Alerts</p>
          <p className={`mt-1 text-xl font-bold tracking-tight ${coop.active_alerts > 0 ? "text-red-600" : "text-[#1C2B21]"}`}>
            {coop.active_alerts ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
          <p className="text-xs font-semibold text-[#6B7280]">Status</p>
          <p className="mt-1 text-xl font-bold tracking-tight text-[#1C2B21]">{coop.latest_health_status || "Unknown"}</p>
        </div>
      </div>
      <Link
        to={`/coops/${coop.id}`}
        className="mt-6 flex w-full justify-center rounded-xl bg-[#15803D] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-800 shadow-apple-sm"
      >
        View Coop
      </Link>
    </Card>
  );
}
