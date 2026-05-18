import { ShieldCheck } from "lucide-react";

import Card from "../common/Card.jsx";
import EmptyState from "../common/EmptyState.jsx";
import { formatDateTime, formatPercent } from "../../utils/formatters.js";
import StatusBadge from "./StatusBadge.jsx";

const columns = ["Device", "Farm", "Coop", "Disease", "Confidence", "Droppings Image", "Timestamp", "Created"];

export default function AlertsTable({ alerts }) {
  return (
    <Card
      title="Health Alerts"
      description="Health alerts from droppings analysis."
      action={<StatusBadge status={alerts.length ? "sick" : null} />}
    >
      {!alerts.length ? (
        <EmptyState
          icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
          title="No active disease alerts"
          message="Sick detections will appear here when the model flags a case."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#E2E8F0]">
          <table className="min-w-[980px] divide-y divide-[#E2E8F0] text-sm">
            <thead className="bg-[#F8FBF8] text-left text-xs uppercase text-[#64748B]">
              <tr>
                {columns.map((column) => (
                  <th key={column} className="px-4 py-3 font-semibold">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF2F7] bg-white">
              {alerts.map((alert) => (
                <tr key={alert.id} className="align-top transition hover:bg-[#F8FBF8]">
                  <td className="px-4 py-4 font-semibold text-[#102A1C]">{alert.deviceId || "N/A"}</td>
                  <td className="px-4 py-4 text-[#475569]">{alert.farmId || "N/A"}</td>
                  <td className="px-4 py-4 text-[#475569]">{alert.coopId || "N/A"}</td>
                  <td className="px-4 py-4 font-medium text-[#DC2626]">{alert.diseaseType || "Unknown"}</td>
                  <td className="px-4 py-4 text-[#475569]">{formatPercent(alert.confidence)}</td>
                  <td className="max-w-[260px] px-4 py-4 text-[#475569]">
                    <span className="block truncate" title={alert.imagePath || undefined}>
                      {alert.imagePath || "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-[#475569]">{formatDateTime(alert.timestamp)}</td>
                  <td className="px-4 py-4 text-[#475569]">{formatDateTime(alert.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
