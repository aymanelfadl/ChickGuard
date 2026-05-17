const badgeStyles = {
  healthy: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  sick: "bg-red-100 text-red-700 ring-red-200",
  unknown: "bg-slate-100 text-slate-600 ring-slate-200",
};

export default function StatusBadge({ status }) {
  const normalized = status || "unknown";
  const label = normalized === "unknown" ? "Unknown" : normalized;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ${badgeStyles[normalized] || badgeStyles.unknown}`}
    >
      {label}
    </span>
  );
}
