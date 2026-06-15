import { Link } from "react-router-dom";

import Card from "./Card.jsx";
import EmptyState from "./EmptyState.jsx";
import { formatDateTime } from "../../utils/formatters.js";

const SEVERITY_STYLES = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-blue-200 bg-blue-50 text-blue-800",
  normal: "border-green-200 bg-green-50 text-green-800",
};

export default function DecisionRules({
  decisions = [],
  title = "Decision Rules",
  description = "Rule-based decisions from droppings analysis and sensor telemetry.",
  limit,
  compact = false,
}) {
  const visibleDecisions = Number.isInteger(limit) ? decisions.slice(0, limit) : decisions;

  return (
    <Card title={title} description={description}>
      {!visibleDecisions.length ? (
        <EmptyState title="No decisions available" message="Decision rules will appear after sensor or image data is received." />
      ) : (
        <div className={compact ? "space-y-3" : "grid gap-3 lg:grid-cols-2"}>
          {visibleDecisions.map((decision, index) => {
            const normalized = normalizeDecision(decision, index);
            return <DecisionItem key={`${normalized.id}-${index}`} decision={normalized} compact={compact} />;
          })}
        </div>
      )}
    </Card>
  );
}

function DecisionItem({ decision, compact }) {
  const style = SEVERITY_STYLES[decision.severity] || SEVERITY_STYLES.info;

  return (
    <article className={`rounded-lg border p-4 ${style}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide">{decision.severity}</p>
          <h3 className="mt-1 text-base font-bold">{decision.title}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {decision.occurrences ? (
            <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold">
              {decision.occurrences} times
            </span>
          ) : null}
          {decision.source ? (
            <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold">
              {decision.source}
            </span>
          ) : null}
        </div>
      </div>
      {!compact && decision.description ? <p className="mt-3 text-sm leading-6">{decision.description}</p> : null}
      {decision.action ? <p className="mt-3 text-sm font-semibold leading-6">Action: {decision.action}</p> : null}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
        {decision.period ? <span className="rounded-lg bg-white/70 px-3 py-1.5">{decision.period}</span> : null}
        {decision.eventTimestamp ? (
          <span className="rounded-lg bg-white/70 px-3 py-1.5">{formatDateTime(decision.eventTimestamp)}</span>
        ) : null}
        {decision.deviceId ? <LinkButton to={`/devices/${decision.deviceId}`} label="Open Device" /> : null}
        {decision.coopId ? <LinkButton to={`/coops/${decision.coopId}`} label="Open Coop" /> : null}
      </div>
    </article>
  );
}

function LinkButton({ to, label }) {
  return (
    <Link to={to} className="rounded-lg bg-white/80 px-3 py-1.5 text-[#1C2B21] hover:bg-white">
      {label}
    </Link>
  );
}

function normalizeDecision(decision, index) {
  return {
    id: decision.id || `decision-${index}`,
    severity: decision.severity || "normal",
    title: decision.title || "Decision",
    description: decision.description || "",
    action: decision.action || "",
    source: decision.source || "",
    period: decision.period || "",
    occurrences: decision.occurrences || 0,
    eventTimestamp: decision.latest_event_timestamp || decision.event_timestamp || "",
    deviceId: decision.deviceId || decision.device_id || "",
    farmId: decision.farmId || decision.farm_id || "",
    coopId: decision.coopId || decision.coop_id || "",
  };
}
