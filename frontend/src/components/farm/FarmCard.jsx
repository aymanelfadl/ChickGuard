import { Link } from "react-router-dom";

import Card from "../common/Card.jsx";
import StatusBadge from "../dashboard/StatusBadge.jsx";

export default function FarmCard({ farm }) {
  return (
    <Card
      title={farm.name}
      description={farm.location || "No location set"}
      action={<StatusBadge status={farm.latest_health_status} />}
    >
      <div className="grid gap-4 text-sm text-[#6B7280] sm:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
          <p className="text-xs font-semibold text-[#6B7280]">Coops</p>
          <p className="mt-1 text-xl font-bold tracking-tight text-[#1C2B21]">{farm.number_of_coops ?? 0}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
          <p className="text-xs font-semibold text-[#6B7280]">Devices</p>
          <p className="mt-1 text-xl font-bold tracking-tight text-[#1C2B21]">{farm.number_of_devices ?? 0}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
          <p className="text-xs font-semibold text-[#6B7280]">Image Alerts</p>
          <p className={`mt-1 text-xl font-bold tracking-tight ${farm.active_alerts > 0 ? "text-red-600" : "text-[#1C2B21]"}`}>
            {farm.active_alerts ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
          <p className="text-xs font-semibold text-[#6B7280]">Health Status</p>
          <p className="mt-1 text-xl font-bold tracking-tight text-[#1C2B21]">{farm.latest_health_status || "Unknown"}</p>
        </div>
      </div>
      <Link
        to={`/farms/${farm.id}`}
        className="mt-6 flex w-full justify-center rounded-xl bg-[#15803D] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-800 shadow-apple-sm"
      >
        View Farm
      </Link>
    </Card>
  );
}
