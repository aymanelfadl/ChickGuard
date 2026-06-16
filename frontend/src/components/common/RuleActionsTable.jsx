import { Link } from "react-router-dom";

import Card from "./Card.jsx";
import EmptyState from "./EmptyState.jsx";
import { formatDateTime } from "../../utils/formatters.js";

const SEVERITY_CLASS = {
  critical: "bg-red-50 text-red-700 ring-red-200",
  warning: "bg-amber-50 text-amber-800 ring-amber-200",
  info: "bg-blue-50 text-blue-700 ring-blue-200",
  normal: "bg-green-50 text-green-700 ring-green-200",
};

export default function RuleActionsTable({
  actions = [],
  title = "Rule Actions",
  description = "Combined sensor and image decisions from the rule engine, ordered by event time.",
}) {
  const normalizedActions = actions.map(normalizeAction).sort(sortByTimeDesc);

  return (
    <Card title={title} description={description}>
      {!normalizedActions.length ? (
        <EmptyState title="No rule actions" message="Rule actions will appear when sensor or image readings cross a decision threshold." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-[980px] divide-y divide-gray-200 text-sm">
            <thead className="bg-[#F8FAFC] text-left text-xs font-bold uppercase tracking-[0.08em] text-[#64748B]">
              <tr>
                <HeaderCell>Time</HeaderCell>
                <HeaderCell>Severity</HeaderCell>
                <HeaderCell>Decision</HeaderCell>
                <HeaderCell>Action</HeaderCell>
                <HeaderCell>Source</HeaderCell>
                <HeaderCell>Period</HeaderCell>
                <HeaderCell>Device</HeaderCell>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {normalizedActions.map((action, index) => (
                <tr key={`${action.id}-${action.deviceId}-${action.eventTimestamp}-${index}`} className="align-top hover:bg-[#F8FAFC]">
                  <BodyCell>{formatDateTime(action.eventTimestamp)}</BodyCell>
                  <BodyCell>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${SEVERITY_CLASS[action.severity] || SEVERITY_CLASS.info}`}>
                      {action.severity}
                    </span>
                  </BodyCell>
                  <BodyCell strong>
                    <span className="block max-w-[220px] truncate" title={action.title}>
                      {action.title}
                    </span>
                    {action.description ? (
                      <span className="mt-1 block max-w-[260px] truncate text-xs font-medium text-[#64748B]" title={action.description}>
                        {action.description}
                      </span>
                    ) : null}
                  </BodyCell>
                  <BodyCell>
                    <span className="block max-w-[320px] truncate" title={action.action}>
                      {action.action || "Review this finding."}
                    </span>
                  </BodyCell>
                  <BodyCell>{action.source || "rules"}</BodyCell>
                  <BodyCell>{action.period || "N/A"}</BodyCell>
                  <BodyCell>
                    <div className="flex flex-wrap gap-2">
                      {action.deviceId ? <TableLink to={`/devices/${action.deviceId}`} label={action.deviceId} /> : "N/A"}
                      {action.coopId ? <TableLink to={`/coops/${action.coopId}`} label="Coop" /> : null}
                    </div>
                  </BodyCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function HeaderCell({ children }) {
  return <th className="px-4 py-3">{children}</th>;
}

function BodyCell({ children, strong = false }) {
  return (
    <td className={`px-4 py-4 ${strong ? "font-semibold text-[#1C2B21]" : "font-medium text-[#475569]"}`}>
      {children}
    </td>
  );
}

function TableLink({ to, label }) {
  return (
    <Link className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-[#14532D] hover:bg-[#F0FDF4]" to={to}>
      {label}
    </Link>
  );
}

function normalizeAction(action) {
  return {
    id: action.id || "rule-action",
    severity: action.severity || "info",
    title: action.title || "Rule action",
    description: action.description || "",
    action: action.action || "",
    source: action.source || "",
    period: action.period || "",
    eventTimestamp: action.eventTimestamp || action.event_timestamp || action.latest_event_timestamp || "",
    deviceId: action.deviceId || action.device_id || "",
    coopId: action.coopId || action.coop_id || "",
  };
}

function sortByTimeDesc(left, right) {
  return new Date(right.eventTimestamp || 0).getTime() - new Date(left.eventTimestamp || 0).getTime();
}
