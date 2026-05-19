import { Link } from "react-router-dom";

import StatusBadge from "../dashboard/StatusBadge.jsx";

export default function HierarchyContext({ farm, coop, device, status }) {
  const cards = [
    buildContextCard("Farm", farm),
    buildContextCard("Coop", coop),
    buildContextCard("Device", device),
  ].filter(Boolean);

  if (status) {
    cards.push({ label: "Status", value: status, status });
  }

  if (!cards.length) {
    return null;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="min-w-0 rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.04em] text-[#64748B]">{card.label}</p>
          {card.status ? (
            <div className="mt-2">
              <StatusBadge status={card.status} />
            </div>
          ) : card.to ? (
            <Link className="mt-1 block truncate text-sm font-bold text-[#14532D] hover:underline" to={card.to}>
              {card.value}
            </Link>
          ) : (
            <p className="mt-1 truncate text-sm font-bold text-[#102A1C]">{card.value}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function buildContextCard(label, value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string" || typeof value === "number") {
    return { label, value: String(value) };
  }

  const displayValue = value.label || value.name || value.device_id || value.deviceId || value.id;

  if (!displayValue) {
    return null;
  }

  return {
    label,
    value: displayValue,
    to: value.to,
  };
}
