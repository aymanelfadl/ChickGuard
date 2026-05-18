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
      <div className="grid gap-3 text-sm text-[#475569] sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase text-[#64748B]">Coops</p>
          <p className="mt-1 text-lg font-bold text-[#102A1C]">{farm.number_of_coops ?? 0}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-[#64748B]">Devices</p>
          <p className="mt-1 text-lg font-bold text-[#102A1C]">{farm.number_of_devices ?? 0}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-[#64748B]">Active Alerts</p>
          <p className="mt-1 text-lg font-bold text-[#DC2626]">{farm.active_alerts ?? 0}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-[#64748B]">Health Status</p>
          <p className="mt-1 text-lg font-bold text-[#102A1C]">{farm.latest_health_status || "Unknown"}</p>
        </div>
      </div>
      <Link
        to={`/farms/${farm.id}`}
        className="mt-5 inline-flex rounded-lg bg-[#14532D] px-4 py-2 text-sm font-semibold text-white hover:bg-[#166534]"
      >
        View Farm
      </Link>
    </Card>
  );
}
