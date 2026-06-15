import { ArrowRight, AlertTriangle, PlayCircle, BarChart2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function RecommendedActions({ alerts, overview, decisions = [] }) {
  const actions = [];

  const criticalDecision = decisions.find((decision) => decision.severity === "critical" || decision.severity === "warning");
  if (criticalDecision) {
    const decisionDeviceId = criticalDecision.deviceId || criticalDecision.device_id;
    actions.push({
      id: "rule-decision",
      label: criticalDecision.title || "Review Rule Decision",
      description: criticalDecision.action || criticalDecision.description || "A rule-based decision needs review.",
      icon: AlertTriangle,
      to: decisionDeviceId ? `/devices/${decisionDeviceId}` : "/reports",
      color: criticalDecision.severity === "critical" ? "text-red-600" : "text-amber-600",
      bg: criticalDecision.severity === "critical" ? "bg-red-50" : "bg-amber-50",
    });
  }

  // Logic to determine recommended actions
  if (alerts && alerts.length > 0) {
    actions.push({
      id: "review-alerts",
      label: "Review Image Alerts",
      description: `${alerts.length} droppings image alert${alerts.length === 1 ? "" : "s"} need review.`,
      icon: AlertTriangle,
      to: "/alerts",
      color: "text-amber-600",
      bg: "bg-amber-50",
    });
  }

  if (overview?.sickDetections > 0) {
    actions.push({
      id: "view-gallery",
      label: "Inspect Droppings Gallery",
      description: "Review recent image classifications.",
      icon: PlayCircle,
      to: "/gallery",
      color: "text-[#15803D]",
      bg: "bg-green-50",
    });
  }

  actions.push({
    id: "view-reports",
    label: "Check System Reports",
    description: "Analyze trends across all farms and coops.",
    icon: BarChart2,
    to: "/reports",
    color: "text-blue-600",
    bg: "bg-blue-50",
  });

  return (
    <section>
      <h3 className="mb-4 text-lg font-semibold tracking-tight text-[#1C2B21]">Recommended Actions</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {actions.slice(0, 3).map((action) => (
          <Link
            key={action.id}
            to={action.to}
            className="group flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-apple-sm transition-all hover:border-gray-200 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${action.bg} ${action.color}`}>
                <action.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1C2B21] group-hover:text-[#15803D] transition-colors">{action.label}</p>
                <p className="text-xs text-[#6B7280] mt-0.5">{action.description}</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#15803D] transition-colors" />
          </Link>
        ))}
      </div>
    </section>
  );
}
