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
      <div className="grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase text-[#64748B]">Devices</p>
          <p className="mt-1 text-lg font-bold text-[#102A1C]">{coop.number_of_devices ?? 0}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-[#64748B]">Alerts</p>
          <p className="mt-1 text-lg font-bold text-[#DC2626]">{coop.active_alerts ?? 0}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-[#64748B]">Status</p>
          <p className="mt-1 text-lg font-bold text-[#102A1C]">{coop.latest_health_status || "Unknown"}</p>
        </div>
      </div>
      <Link
        to={`/coops/${coop.id}`}
        className="mt-5 inline-flex rounded-lg bg-[#14532D] px-4 py-2 text-sm font-semibold text-white hover:bg-[#166534]"
      >
        View Coop
      </Link>
    </Card>
  );
}
