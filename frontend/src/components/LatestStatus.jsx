import StatusBadge from "./StatusBadge.jsx";

function ValueRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2 last:border-0">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-slate-900">{value ?? "N/A"}</dd>
    </div>
  );
}

function formatConfidence(value) {
  return typeof value === "number" ? `${Math.round(value * 100)}%` : null;
}

function formatUnit(value, unit) {
  return value === null || value === undefined ? null : `${value} ${unit}`;
}

export default function LatestStatus({ status }) {
  const latestSensor = status?.latest_sensor;
  const latestPrediction = status?.latest_prediction;

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-950">Latest Sensor Status</h2>
          <p className="text-sm text-slate-500">
            Device {status?.device_id ?? "N/A"} · Farm {status?.farm_id ?? "N/A"} · Coop{" "}
            {status?.coop_id ?? "N/A"}
          </p>
        </div>

        {latestSensor ? (
          <dl>
            <ValueRow label="Temperature" value={formatUnit(latestSensor.temperature_c, "C")} />
            <ValueRow label="Humidity" value={formatUnit(latestSensor.humidity_percent, "%")} />
            <ValueRow label="Weight" value={formatUnit(latestSensor.weight_kg, "kg")} />
            <ValueRow label="Timestamp" value={latestSensor.timestamp} />
          </dl>
        ) : (
          <p className="text-sm text-slate-500">No sensor reading available yet.</p>
        )}
      </article>

      <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Latest Image Prediction</h2>
            <p className="text-sm text-slate-500">Most recent mock AI classification result.</p>
          </div>
          <StatusBadge status={latestPrediction?.prediction_status} />
        </div>

        {latestPrediction ? (
          <dl>
            <ValueRow label="Disease Type" value={latestPrediction.disease_type ?? "None"} />
            <ValueRow label="Confidence" value={formatConfidence(latestPrediction.confidence)} />
            <ValueRow label="Image Path" value={latestPrediction.image_path} />
            <ValueRow label="Timestamp" value={latestPrediction.timestamp} />
          </dl>
        ) : (
          <p className="text-sm text-slate-500">No image prediction available yet.</p>
        )}
      </article>
    </section>
  );
}
