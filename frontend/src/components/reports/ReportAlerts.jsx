import { Link } from "react-router-dom";

import Card from "../common/Card.jsx";
import EmptyState from "../common/EmptyState.jsx";
import { formatDateTime, formatPercent } from "../../utils/formatters.js";

export default function ReportAlerts({ alerts = [] }) {
  return (
    <Card title="Recent Alerts" description="Recent health alerts created from sick droppings analysis results.">
      {!alerts.length ? (
        <EmptyState title="No active health alerts" message="Good. No active health alerts right now." />
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {alerts.map((alert) => (
            <article key={alert.id || `${alert.device_id}-${alert.timestamp}`} className="rounded-lg border border-[#FECACA] bg-red-50 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-bold text-[#7F1D1D]">
                    {alert.disease_type || "Sick detection"}
                  </h3>
                  <p className="text-sm text-[#991B1B]">
                    {alert.farm_id || "Farm"} · {alert.coop_id || "Coop"} · {alert.device_id || "Device"}
                  </p>
                </div>
                <p className="text-sm font-bold text-[#7F1D1D]">{formatPercent(alert.confidence)}</p>
              </div>
              <p className="mt-3 text-sm text-[#7F1D1D]">Detected {formatDateTime(alert.timestamp)}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {alert.id ? <AlertLink to={`/gallery/${alert.id}`} label="View Image" /> : null}
                {alert.coop_id ? <AlertLink to={`/coops/${alert.coop_id}`} label="Open Coop" /> : null}
                {alert.device_id ? <AlertLink to={`/devices/${alert.device_id}`} label="Open Device" /> : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </Card>
  );
}

function AlertLink({ to, label }) {
  return (
    <Link className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-[#14532D] ring-1 ring-[#CFE8D7]" to={to}>
      {label}
    </Link>
  );
}
