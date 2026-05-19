import Card from "../common/Card.jsx";
import EmptyState from "../common/EmptyState.jsx";
import StatusBadge from "../dashboard/StatusBadge.jsx";
import { formatDateTime, formatPercent } from "../../utils/formatters.js";

export default function ReportDetectionSummary({
  healthyDetections = 0,
  sickDetections = 0,
  latestAnalysis,
}) {
  return (
    <Card title="Detection Summary" description="Fecal image classification results from droppings analyses.">
      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <Metric label="Healthy Detections" value={healthyDetections} />
          <Metric label="Sick Detections" value={sickDetections} danger />
        </div>

        {latestAnalysis ? (
          <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FBF8] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.04em] text-[#64748B]">Latest Droppings Analysis</p>
                <h3 className="mt-2 text-xl font-bold text-[#102A1C]">
                  {latestAnalysis.disease_type || "No disease detected"}
                </h3>
              </div>
              <StatusBadge status={latestAnalysis.prediction_status} />
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm font-semibold text-[#475569]">
                <span>Confidence</span>
                <span>{formatPercent(latestAnalysis.confidence)}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E2E8F0]">
                <div
                  className="h-full rounded-full bg-[#16A34A]"
                  style={{ width: `${Math.max(0, Math.min(100, Number(latestAnalysis.confidence || 0) * 100))}%` }}
                />
              </div>
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <Info label="Health Result" value={latestAnalysis.prediction_status} />
              <Info label="Model Class" value={latestAnalysis.raw_label} />
              <Info label="Camera / Device" value={latestAnalysis.device_id} />
              <Info label="Captured At" value={formatDateTime(latestAnalysis.timestamp)} />
            </dl>
          </div>
        ) : (
          <EmptyState title="No droppings analysis yet" message="Droppings analysis results will appear here after image uploads." />
        )}
      </div>
    </Card>
  );
}

function Metric({ label, value, danger = false }) {
  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-[0.04em] text-[#64748B]">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${danger ? "text-[#DC2626]" : "text-[#102A1C]"}`}>{value ?? 0}</p>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase text-[#64748B]">{label}</p>
      <p className="mt-1 truncate font-semibold text-[#102A1C]" title={value || undefined}>{value || "N/A"}</p>
    </div>
  );
}
