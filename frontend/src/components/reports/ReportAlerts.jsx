import { Link } from "react-router-dom";

import Card from "../common/Card.jsx";
import EmptyState from "../common/EmptyState.jsx";
import { formatDateTime, formatPercent } from "../../utils/formatters.js";

export default function ReportAlerts({ alerts = [] }) {
  return (
    <Card title="Droppings Image Alerts" description="Image-based disease alerts from recent poultry droppings analysis.">
      {!alerts.length ? (
        <EmptyState title="No droppings image alerts" message="Good. No image-based disease alerts right now." />
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <article key={alert.id || `${alert.device_id}-${alert.timestamp}`} className="rounded-lg border border-red-200 bg-red-50 p-4">
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
    <Link className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-red-800 border border-red-200 transition-colors hover:bg-red-50" to={to}>
      {label}
    </Link>
  );
}
