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
        <div className="grid gap-4 xl:grid-cols-2">
          {alerts.map((alert) => (
            <article key={alert.id || `${alert.device_id}-${alert.timestamp}`} className="rounded-xl border border-red-100 bg-[#FEF2F2] p-5 shadow-apple-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-bold text-red-800">
                    {alert.disease_type || "Sick detection"}
                  </h3>
                  <p className="text-sm font-medium text-red-700 mt-0.5">
                    {alert.farm_id || "Farm"} · {alert.coop_id || "Coop"} · {alert.device_id || "Device"}
                  </p>
                </div>
                <p className="text-sm font-bold text-red-800">{formatPercent(alert.confidence)}</p>
              </div>
              <p className="mt-3 text-sm font-medium text-red-700">Detected {formatDateTime(alert.timestamp)}</p>
              <div className="mt-5 flex flex-wrap gap-2">
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
    <Link className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-red-800 border border-red-200 shadow-apple-sm transition-colors hover:bg-red-50" to={to}>
      {label}
    </Link>
  );
}
